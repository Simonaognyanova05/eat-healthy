import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { RegisterPage } from "./RegisterPage.jsx";
import { getSession } from "../services/authApi.js";

jest.mock("lucide-react", () => {
  const Icon = (props) => <svg aria-hidden="true" {...props} />;
  return { ArrowRight: Icon, Check: Icon, Eye: Icon, EyeOff: Icon, Leaf: Icon, LockKeyhole: Icon };
});

jest.mock("../services/authApi.js", () => ({
  getSession: jest.fn(),
  register: jest.fn(),
  oauthUrl: (provider) => `/oauth/${provider}`
}));

beforeEach(() => {
  getSession.mockResolvedValue({ user: null });
});

it("offers Google and email registration with accessible fields", async () => {
  render(<RegisterPage />);
  await waitFor(() => expect(screen.getByRole("heading", { name: "Добре дошъл" })).toBeInTheDocument());
  expect(screen.getByRole("link", { name: /Google/ })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Apple/ })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Имейл")).toBeInTheDocument();
  expect(screen.getByLabelText("Парола")).toBeInTheDocument();
});
