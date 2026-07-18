import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LoginPage } from "./LoginPage";
import { getSession, login } from "../services/authApi";

jest.mock("../services/authApi", () => ({
  getSession: jest.fn(), login: jest.fn(), oauthUrl: (provider) => `/oauth/${provider}`
}));

beforeEach(() => { jest.clearAllMocks(); getSession.mockResolvedValue({ user: null }); });

it("signs in with email credentials and returns the authenticated user", async () => {
  const user = { id: "user-1", displayName: "Ива", email: "iva@example.com" };
  const onAuthenticated = jest.fn();
  login.mockResolvedValue({ user });
  render(<LoginPage onAuthenticated={onAuthenticated} onGoToRegister={jest.fn()} />);
  await screen.findByRole("heading", { name: "Влез в профила си" });
  fireEvent.change(screen.getByLabelText("Имейл"), { target: { value: "iva@example.com" } });
  fireEvent.change(screen.getByLabelText("Парола"), { target: { value: "correct horse battery staple" } });
  fireEvent.click(screen.getByRole("button", { name: /Влез в профила си/ }));
  await waitFor(() => expect(login).toHaveBeenCalledWith({ email: "iva@example.com", password: "correct horse battery staple" }));
  expect(onAuthenticated).toHaveBeenCalledWith(user);
});

it("opens registration from the login form", async () => {
  const onGoToRegister = jest.fn();
  render(<LoginPage onAuthenticated={jest.fn()} onGoToRegister={onGoToRegister} />);
  await screen.findByRole("heading", { name: "Влез в профила си" });
  fireEvent.click(screen.getByRole("button", { name: "Създай профил" }));
  expect(onGoToRegister).toHaveBeenCalled();
});
