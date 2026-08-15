import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { GuestPage } from "./GuestPage";
import { getSession } from "../services/authApi";

jest.mock("../services/authApi", () => ({ getSession: jest.fn(), recognizeGuestImage: jest.fn() }));

beforeAll(() => {
  URL.createObjectURL = jest.fn(() => "blob:preview");
  URL.revokeObjectURL = jest.fn();
});
beforeEach(() => { jest.clearAllMocks(); getSession.mockResolvedValue({ user: null }); });

it("shows value before asking for registration", () => {
  render(<GuestPage onAuthenticated={jest.fn()} onRegister={jest.fn()} onLogin={jest.fn()} />);
  expect(screen.getByRole("heading", { name: /От снимка до идея/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Или виж примерен резултат/ })).toBeInTheDocument();
});

it("reveals an editable example and a contextual registration reason", () => {
  const onRegister = jest.fn();
  render(<GuestPage onAuthenticated={jest.fn()} onRegister={onRegister} onLogin={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: /Или виж примерен резултат/ }));
  expect(screen.getByRole("heading", { name: "Ето какво открихме" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Премахни яйца" }));
  expect(screen.queryByText("яйца")).not.toBeInTheDocument();
  expect(screen.getByText(/за да запазим анализа и да персонализираме/i)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Създай профил и продължи/ }));
  expect(onRegister).toHaveBeenCalledTimes(1);
});
