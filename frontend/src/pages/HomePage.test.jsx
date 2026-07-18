import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { HomePage } from "./HomePage";

jest.mock("../services/authApi", () => ({ logout: jest.fn() }));

beforeAll(() => {
  URL.createObjectURL = jest.fn(() => "blob:preview");
  URL.revokeObjectURL = jest.fn();
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] }) }
  });
  HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue();
});

it("opens a live camera flow instead of the file picker", async () => {
  render(<HomePage user={{ displayName: "Ива" }} onLoggedOut={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: /Снимай хладилника/ }));
  expect(await screen.findByRole("dialog", { name: "Снимай продуктите" })).toBeInTheDocument();
  expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false }));
  expect(screen.getByRole("button", { name: /Качи снимка/ })).toBeInTheDocument();
});

it("rejects unsupported image formats before upload", () => {
  render(<HomePage user={{ displayName: "Ива" }} onLoggedOut={jest.fn()} />);
  const file = new File(["not-an-image"], "fridge.gif", { type: "image/gif" });
  fireEvent.change(screen.getByLabelText("Качи снимка от устройството"), { target: { files: [file] } });
  expect(screen.getByRole("alert")).toHaveTextContent("JPG, PNG или WebP");
  expect(URL.createObjectURL).not.toHaveBeenCalled();
});
