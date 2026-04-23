import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AuthContext from "../../context/AuthContext";
import { I18nProvider } from "../../context/I18nContext";
import AuthPanel from "../AuthPanel";

/* ── helpers ──────────────────────────────────────────────── */

function makeAuthCtx(overrides = {}) {
  return {
    user: null,
    agreement: null,
    agreementStatus: { loading: false, error: "" },
    authStatus: { loading: false, error: "" },
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    acceptActiveAgreement: vi.fn(),
    ...overrides,
  };
}

function renderPanel(ctx, props = {}) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={ctx}>
        <I18nProvider>
          <AuthPanel {...props} />
        </I18nProvider>
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

async function fillLoginForm(username = "testuser", password = "pass") {
  await userEvent.type(document.querySelector('input[name="username"]'), username);
  await userEvent.type(document.querySelector('input[name="password"]'), password);
  await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
}

/* ── tests ────────────────────────────────────────────────── */

describe("AuthPanel login", () => {
  beforeEach(() => {
    window.localStorage.setItem("ewp_language", "en");
  });

  it("smoke: successful login calls onAuthSuccess", async () => {
    const ctx = makeAuthCtx({ login: vi.fn().mockResolvedValue({ ok: true }) });
    const onAuthSuccess = vi.fn();
    renderPanel(ctx, { onAuthSuccess });

    await fillLoginForm();

    await waitFor(() => expect(ctx.login).toHaveBeenCalledTimes(1));
    expect(ctx.login).toHaveBeenCalledWith({ username: "testuser", password: "pass" });
    expect(onAuthSuccess).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows 'Invalid credentials' on 401", async () => {
    const ctx = makeAuthCtx({
      login: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: "invalid_credentials", msgKey: "auth.invalidCredentials", detail: null },
      }),
    });
    renderPanel(ctx);

    await fillLoginForm();

    await waitFor(() =>
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument()
    );
  });

  it("shows detail from 401 backend response when present", async () => {
    const ctx = makeAuthCtx({
      login: vi.fn().mockResolvedValue({
        ok: false,
        error: {
          code: "invalid_credentials",
          msgKey: "auth.invalidCredentials",
          detail: "No active account found.",
        },
      }),
    });
    renderPanel(ctx);

    await fillLoginForm();

    await waitFor(() =>
      expect(screen.getByText(/No active account found/i)).toBeInTheDocument()
    );
  });

  it("shows rate-limit message on 429", async () => {
    const ctx = makeAuthCtx({
      login: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: "rate_limited", msgKey: "auth.rateLimited", detail: null },
      }),
    });
    renderPanel(ctx);

    await fillLoginForm();

    await waitFor(() =>
      expect(screen.getByText(/Too many attempts/i)).toBeInTheDocument()
    );
  });

  it("shows server error message on 500", async () => {
    const ctx = makeAuthCtx({
      login: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: "server_error", msgKey: "auth.serverError", detail: null },
      }),
    });
    renderPanel(ctx);

    await fillLoginForm();

    await waitFor(() =>
      expect(screen.getByText(/Server is unavailable/i)).toBeInTheDocument()
    );
  });

  it("shows network error message when no response", async () => {
    const ctx = makeAuthCtx({
      login: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: "network_error", msgKey: "auth.networkError", detail: null },
      }),
    });
    renderPanel(ctx);

    await fillLoginForm();

    await waitFor(() =>
      expect(screen.getByText(/Cannot reach server/i)).toBeInTheDocument()
    );
  });
});

describe("AuthPanel register", () => {
  beforeEach(() => {
    window.localStorage.setItem("ewp_language", "en");
  });

  async function fillRegisterForm() {
    await userEvent.click(screen.getByRole("button", { name: /^register$/i }));
    await userEvent.type(document.querySelector('input[name="username"]'), "newuser");
    await userEvent.type(document.querySelector('input[name="password"]'), "Short1!");
    await userEvent.type(document.querySelector('input[name="confirmPassword"]'), "Short1!");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
  }

  it("shows validation detail from 400 Django field errors", async () => {
    const ctx = makeAuthCtx({
      register: vi.fn().mockResolvedValue({
        ok: false,
        error: {
          code: "validation_error",
          msgKey: "auth.validationError",
          detail: "This password is too short.",
        },
      }),
    });
    renderPanel(ctx);

    await fillRegisterForm();

    await waitFor(() =>
      expect(screen.getByText(/too short/i)).toBeInTheDocument()
    );
  });

  it("shows success message and switches to login mode on ok", async () => {
    const ctx = makeAuthCtx({
      register: vi.fn().mockResolvedValue({ ok: true }),
    });
    renderPanel(ctx);

    await fillRegisterForm();

    await waitFor(() =>
      expect(screen.getByText(/Registration successful/i)).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });
});
