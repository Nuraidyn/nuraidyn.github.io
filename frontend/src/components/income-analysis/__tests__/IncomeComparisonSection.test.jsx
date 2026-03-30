import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock chart library to avoid canvas/WebGL issues in jsdom
vi.mock("react-chartjs-2", () => ({
  Bar: ({ data }) => (
    <div data-testid="bar-chart">
      {data.labels?.map((l) => <span key={l}>{l}</span>)}
    </div>
  ),
}));
vi.mock("chart.js/auto", () => ({ Chart: class {} }));

import IncomeComparisonSection from "../IncomeComparisonSection";
import { I18nProvider } from "../../../context/I18nContext";

// ThemeContext mock — provide a light theme so isDark=false
vi.mock("../../../context/ThemeContext", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

function renderSection(props = {}) {
  const defaultProps = { userSalary: 4000, userCountry: "Germany" };
  return render(
    <I18nProvider>
      <IncomeComparisonSection {...defaultProps} {...props} />
    </I18nProvider>
  );
}

describe("IncomeComparisonSection", () => {
  beforeEach(() => {
    window.localStorage.setItem("ewp_language", "en");
  });

  it("renders the section title", () => {
    renderSection();
    expect(screen.getByText(/Compare Income Across Countries/i)).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    renderSection();
    expect(screen.getByText(/Benchmark your salary/i)).toBeInTheDocument();
  });

  it("renders all 4 KPI card labels", () => {
    renderSection();
    expect(screen.getByText(/Your Salary vs Local Average/i)).toBeInTheDocument();
    expect(screen.getByText(/Inflation \(Your Country\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Real Income Change/i)).toBeInTheDocument();
    expect(screen.getByText(/Best Benchmark Country/i)).toBeInTheDocument();
  });

  it("renders the bar chart when comparison countries are selected", () => {
    renderSection();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders period toggle buttons", () => {
    renderSection();
    expect(screen.getByRole("button", { name: "1Y" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3Y" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5Y" })).toBeInTheDocument();
  });

  it("changes period when toggle is clicked", async () => {
    renderSection();
    const btn5y = screen.getByRole("button", { name: "5Y" });
    await userEvent.click(btn5y);
    // After clicking 5Y, it should have the active class
    expect(btn5y.className).toMatch(/tab-active/);
  });

  it("3Y is active by default", () => {
    renderSection();
    const btn3y = screen.getByRole("button", { name: "3Y" });
    expect(btn3y.className).toMatch(/tab-active/);
  });

  it("shows adjust-for-inflation toggle", () => {
    renderSection();
    expect(screen.getByText(/Adjust for inflation/i)).toBeInTheDocument();
  });

  it("shows show-my-salary toggle", () => {
    renderSection();
    expect(screen.getByText(/Show my salary bar/i)).toBeInTheDocument();
  });

  it("shows country comparison checkboxes", () => {
    renderSection();
    expect(screen.getByText(/Compare with/i)).toBeInTheDocument();
    // US, DE, GB should be rendered as country toggle buttons
    expect(screen.getByRole("button", { name: "US" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "DE" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "GB" })).toBeInTheDocument();
  });

  it("shows empty state message when no comparison countries selected", async () => {
    renderSection();
    // Deselect all default comparison countries (US, DE, GB)
    await userEvent.click(screen.getByRole("button", { name: "US" }));
    await userEvent.click(screen.getByRole("button", { name: "DE" }));
    await userEvent.click(screen.getByRole("button", { name: "GB" }));
    expect(screen.getByText(/Select countries to compare/i)).toBeInTheDocument();
  });

  it("handles zero userSalary without crashing", () => {
    renderSection({ userSalary: 0 });
    expect(screen.getByText(/Compare Income Across Countries/i)).toBeInTheDocument();
  });

  it("handles undefined userCountry without crashing", () => {
    renderSection({ userCountry: undefined });
    expect(screen.getByText(/Compare Income Across Countries/i)).toBeInTheDocument();
  });

  it("inflation toggle is checked by default", () => {
    renderSection();
    // Find checkbox by looking for a hidden sr-only input preceding the toggle text
    const checkboxes = screen.getAllByRole("checkbox", { hidden: true });
    // First checkbox is adjustInflation (default true), second is showMyLine (default true)
    expect(checkboxes[0]).toBeChecked();
  });

  it("toggling inflation checkbox changes state", async () => {
    renderSection();
    const checkboxes = screen.getAllByRole("checkbox", { hidden: true });
    await userEvent.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
  });
});
