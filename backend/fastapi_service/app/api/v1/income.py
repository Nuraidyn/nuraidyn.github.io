from fastapi import APIRouter, Depends, HTTPException

from app.deps import require_agreement
from app.schemas import IncomeInsightsRequest, IncomeInsightsResponse
from app.services.income_insights import generate_income_insights

router = APIRouter(tags=["income"])


@router.post("/income/insights", response_model=IncomeInsightsResponse)
def income_insights(
    payload: IncomeInsightsRequest,
    _: dict = Depends(require_agreement),
):
    """
    Generate educational AI insights for a personal income profile.

    Uses the configured LLM provider (OpenAI / Gemini / Groq) with a
    deterministic rule-based fallback when no provider is available.
    Always returns HTTP 200 — the ``provider`` field indicates whether
    a real LLM or the fallback was used.
    """
    try:
        return generate_income_insights(payload)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
