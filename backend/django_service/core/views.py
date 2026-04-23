from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .email_verification import create_verification_token, send_verification_email, verify_token
from .models import AgreementAcceptance, AnalysisPreset
from .serializers import (
    AgreementSerializer,
    AnalysisPresetSerializer,
    RegisterSerializer,
    ResendVerificationSerializer,
    UserSerializer,
)
from .tokens import CustomTokenObtainPairSerializer
from .utils import get_active_agreement, has_accepted_active_agreement

User = get_user_model()

_VERIFY_ERRORS = {
    "invalid": "Verification link is invalid.",
    "expired": "Verification link has expired. Please request a new one.",
    "already_used": "This link has already been used. Try signing in.",
}


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        user = serializer.save()

        token = create_verification_token(user)
        send_verification_email(user, token)

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "verification_required": True,
            },
            status=status.HTTP_201_CREATED,
        )


class CustomTokenView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    throttle_scope = "auth"

    def post(self, request, *args, **kwargs):
        username = request.data.get("username", "")
        password = request.data.get("password", "")

        # Check for unverified email BEFORE SimpleJWT authenticates, so we can
        # return a distinct 403 code that the frontend can act on specifically.
        try:
            user = User.objects.select_related("profile").get(username=username)
            if user.check_password(password):
                profile = getattr(user, "profile", None)
                if profile and not profile.is_email_verified:
                    return Response(
                        {
                            "code": "email_not_verified",
                            "detail": "Please verify your email address before logging in.",
                            "email": user.email,
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )
        except User.DoesNotExist:
            pass

        return super().post(request, *args, **kwargs)


class CustomTokenRefreshView(TokenRefreshView):
    throttle_scope = "auth"


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get("token") or request.query_params.get("token", "")
        if not token_str:
            return Response(
                {"detail": "Token is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        ok, user, error_code = verify_token(str(token_str))
        if not ok:
            return Response(
                {
                    "code": error_code,
                    "detail": _VERIFY_ERRORS.get(error_code, "Verification failed."),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"detail": "Email verified successfully.", "username": user.username},
            status=status.HTTP_200_OK,
        )


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "resend_verification"

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data.get("email", "")
        username = serializer.validated_data.get("username", "")

        user = None
        try:
            if email:
                user = User.objects.select_related("profile").get(email=email)
            elif username:
                user = User.objects.select_related("profile").get(username=username)
        except User.DoesNotExist:
            pass

        if user and user.email:
            profile = getattr(user, "profile", None)
            if profile and not profile.is_email_verified:
                token = create_verification_token(user)
                send_verification_email(user, token)

        # Always 200 — prevents user enumeration
        return Response(
            {"detail": "If the account exists and is unverified, a new email has been sent."},
            status=status.HTTP_200_OK,
        )


class ActiveAgreementView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        agreement = get_active_agreement()
        if not agreement:
            return Response({"active": False}, status=status.HTTP_200_OK)
        data = AgreementSerializer(agreement).data
        data["active"] = True
        return Response(data)


class AcceptAgreementView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "agreements"

    def post(self, request):
        agreement = get_active_agreement()
        if not agreement:
            return Response({"detail": "No active agreement"}, status=status.HTTP_404_NOT_FOUND)
        acceptance, created = AgreementAcceptance.objects.get_or_create(
            user=request.user,
            agreement=agreement,
            defaults={"ip_address": request.META.get("REMOTE_ADDR")},
        )
        if not created:
            return Response({"detail": "Agreement already accepted"}, status=status.HTTP_200_OK)
        return Response({"detail": "Agreement accepted"}, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "profile", None)
        data = {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "role": profile.role if profile else "user",
            "agreement_accepted": has_accepted_active_agreement(request.user),
            "email_verified": profile.is_email_verified if profile else True,
        }
        return Response(data)


class IntrospectTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "profile", None)
        return Response(
            {
                "user_id": request.user.id,
                "role": profile.role if profile else "user",
                "agreement_accepted": has_accepted_active_agreement(request.user),
            }
        )


class PresetsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        presets = AnalysisPreset.objects.filter(user=request.user).order_by("-updated_at", "-id")
        return Response(AnalysisPresetSerializer(presets, many=True).data)

    def post(self, request):
        serializer = AnalysisPresetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        name = serializer.validated_data["name"]
        if AnalysisPreset.objects.filter(user=request.user, name=name).exists():
            return Response(
                {"detail": "Preset name already exists."},
                status=status.HTTP_409_CONFLICT,
            )
        preset = AnalysisPreset.objects.create(user=request.user, **serializer.validated_data)
        return Response(AnalysisPresetSerializer(preset).data, status=status.HTTP_201_CREATED)


class PresetDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, preset_id: int) -> AnalysisPreset:
        return AnalysisPreset.objects.get(id=preset_id, user=request.user)

    def get(self, request, preset_id: int):
        try:
            preset = self.get_object(request, preset_id)
        except AnalysisPreset.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(AnalysisPresetSerializer(preset).data)

    def put(self, request, preset_id: int):
        try:
            preset = self.get_object(request, preset_id)
        except AnalysisPreset.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AnalysisPresetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        name = serializer.validated_data["name"]
        duplicate = (
            AnalysisPreset.objects.filter(user=request.user, name=name)
            .exclude(id=preset.id)
            .exists()
        )
        if duplicate:
            return Response({"detail": "Preset name already exists."}, status=status.HTTP_409_CONFLICT)

        preset.name = name
        preset.payload = serializer.validated_data["payload"]
        preset.save(update_fields=["name", "payload", "updated_at"])
        return Response(AnalysisPresetSerializer(preset).data)

    def delete(self, request, preset_id: int):
        try:
            preset = self.get_object(request, preset_id)
        except AnalysisPreset.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        preset.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
