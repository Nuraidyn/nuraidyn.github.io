import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthContext from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";

const REDIRECT_KEY = "ewp_redirect";

export default function AuthPanel({ onAuthSuccess }) {
  const { user, authStatus, login, register, logout, agreement } = useContext(AuthContext);
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [formState, setFormState] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptAgreement: false,
  });
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    if (mode === "login") {
      const result = await login({
        username: formState.username,
        password: formState.password,
      });
      if (!result.ok) {
        const base = t(result.error?.msgKey ?? "auth.errorUnknown");
        const detail = result.error?.detail;
        setMessage(detail ? `${base} ${detail}` : base);
      } else {
        onAuthSuccess?.();
        // Redirect back to the page the user was on when their session expired
        const redirect = sessionStorage.getItem(REDIRECT_KEY);
        if (redirect) {
          sessionStorage.removeItem(REDIRECT_KEY);
          navigate(redirect, { replace: true });
        }
      }
    } else {
      if (formState.password !== formState.confirmPassword) {
        setMessage(t("auth.passwordsDoNotMatch"));
        return;
      }
      const result = await register({
        username: formState.username,
        email: formState.email,
        password: formState.password,
        accept_agreement: formState.acceptAgreement,
      });
      if (!result.ok) {
        const base = t(result.error?.msgKey ?? "auth.errorUnknown");
        const detail = result.error?.detail;
        setMessage(detail ? `${base} ${detail}` : base);
      } else {
        setMessage(t("auth.registrationSuccess"));
        setMode("login");
      }
    }
  };

  if (user) {
    return (
      <div className="panel">
        <h3 className="panel-title">{t("auth.session")}</h3>
        <div className="space-y-2 text-sm text-muted">
          <p>{t("auth.signedInAs", { username: user.username })}</p>
          <p className="uppercase tracking-[0.2em] text-xs text-faint">{user.role}</p>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              logout();
              onAuthSuccess?.();
            }}
          >
            {t("auth.signOut")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="flex items-center justify-between">
        <h3 className="panel-title">{t("auth.access")}</h3>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={mode === "login" ? "tab-active" : "tab"}
          >
            {t("auth.login")}
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={mode === "register" ? "tab-active" : "tab"}
          >
            {t("auth.register")}
          </button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3 mt-4">
        <label className="label">{t("auth.username")}</label>
        <input
          className="input"
          name="username"
          value={formState.username}
          onChange={handleChange}
          required
        />
        {mode === "register" && (
          <>
            <label className="label">{t("auth.email")}</label>
            <input
              className="input"
              type="email"
              name="email"
              value={formState.email}
              onChange={handleChange}
            />
          </>
        )}
        <label className="label">{t("auth.password")}</label>
        <input
          className="input"
          type="password"
          name="password"
          value={formState.password}
          onChange={handleChange}
          required
        />
        {mode === "register" && (
          <>
            <label className="label">{t("auth.confirmPassword")}</label>
            <input
              className="input"
              type="password"
              name="confirmPassword"
              value={formState.confirmPassword}
              onChange={handleChange}
              required
            />
          </>
        )}
        {mode === "register" && agreement && (
          <label className="flex items-center gap-2 text-xs text-muted">
            <input
              type="checkbox"
              name="acceptAgreement"
              checked={formState.acceptAgreement}
              onChange={handleChange}
            />
            {t("auth.agreeTo", { title: agreement.title })}
          </label>
        )}
        <button className="btn-primary" type="submit" disabled={authStatus.loading}>
          {authStatus.loading ? t("auth.processing") : mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
        </button>
        {authStatus.error === "Session expired." && (
          <p className="text-xs text-rose-200/90">{t("auth.sessionExpired")}</p>
        )}
        {message && (
          <p className="text-xs text-rose-200/90">{message}</p>
        )}
      </form>
    </div>
  );
}
