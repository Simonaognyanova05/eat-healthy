import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HomePage } from "./HomePage";
import { generateRecipes, getMyPlanRequest, getProfile, getRecognitionUsage, recognizeIngredients } from "../services/authApi";

jest.mock("../services/authApi", () => ({
  logout: jest.fn(),
  recognizeIngredients: jest.fn(),
  generateRecipes: jest.fn(),
  getRecognitionUsage: jest.fn(),
  getMyPlanRequest: jest.fn(),
  createPlanRequest: jest.fn(),
  getAdminPlanRequests: jest.fn(),
  decidePlanRequest: jest.fn()
  , getProfile: jest.fn(), saveProfile: jest.fn()
}));

beforeAll(() => {
  URL.createObjectURL = jest.fn(() => "blob:preview"); URL.revokeObjectURL = jest.fn();
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: jest.fn().mockResolvedValue({ getTracks: () => [{ stop: jest.fn() }] }) } });
  HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue();
});
beforeEach(() => {
  jest.clearAllMocks();
  getRecognitionUsage.mockImplementation(() => new Promise(() => {}));
  getMyPlanRequest.mockImplementation(() => new Promise(() => {}));
  getProfile.mockResolvedValue({ profile: null });
});

it("opens the private nutrition profile", async () => {
  render(<HomePage user={{ displayName: "Ива" }} onLoggedOut={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Профил" }));
  expect(await screen.findByRole("heading", { name: "Профил и цел" })).toBeInTheDocument();
  expect(screen.getByLabelText("Години")).toBeInTheDocument();
});

it("shows the server-provided daily recognition allowance", async () => {
  getRecognitionUsage.mockResolvedValue({ plan: "free", used: 0, limit: 50, remaining: 50, resetAt: "2026-08-01T00:00:00.000Z" });
  render(<HomePage user={{ displayName: "Ива" }} onLoggedOut={jest.fn()} />);
  expect(await screen.findByText("50 от 50 снимки остават този месец")).toBeInTheDocument();
});

it("opens the camera flow", async () => {
  render(<HomePage user={{ displayName: "Ива" }} onLoggedOut={jest.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: /Снимай продуктите/ }));
  expect(await screen.findByRole("dialog")).toBeInTheDocument();
});

it("rejects unsupported image formats before upload", () => {
  render(<HomePage user={{ displayName: "Ива" }} onLoggedOut={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Качи снимки от устройството"), { target: { files: [new File(["x"], "fridge.gif", { type: "image/gif" })] } });
  expect(screen.getByRole("alert")).toHaveTextContent("JPG, PNG или WebP");
});

it("lets the user remove detected and add missing ingredients", async () => {
  recognizeIngredients.mockResolvedValue({ context: "fridge", warnings: [], ingredients: [{ name: "яйца", confidence: 0.95 }, { name: "домати", confidence: 0.8 }] });
  render(<HomePage user={{ displayName: "Ива" }} onLoggedOut={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Качи снимки от устройството"), { target: { files: [new File(["image"], "fridge.jpg", { type: "image/jpeg" })] } });
  fireEvent.click(screen.getByRole("button", { name: "Разпознай от снимката" }));
  await screen.findByRole("heading", { name: "Какво открихме" });
  fireEvent.click(screen.getByRole("button", { name: "Премахни яйца" }));
  fireEvent.change(screen.getByLabelText("Липсващ продукт"), { target: { value: "краставици" } });
  fireEvent.click(screen.getByRole("button", { name: "Добави" }));
  await waitFor(() => expect(screen.queryByText("яйца")).not.toBeInTheDocument());
  expect(screen.getByText("краставици")).toBeInTheDocument();
});

it("shows a completed state after confirming the corrected ingredients", async () => {
  recognizeIngredients.mockResolvedValue({ context: "fridge", warnings: [], ingredients: [{ name: "яйца", confidence: 0.95 }] });
  render(<HomePage user={{ displayName: "Ива" }} onLoggedOut={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Качи снимки от устройството"), { target: { files: [new File(["image"], "fridge.jpg", { type: "image/jpeg" })] } });
  fireEvent.click(screen.getByRole("button", { name: "Разпознай от снимката" }));
  await screen.findByRole("button", { name: "Потвърди продуктите" });
  fireEvent.click(screen.getByRole("button", { name: "Потвърди продуктите" }));
  expect(screen.getByRole("heading", { name: /Продуктите са потвърдени/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Редактирай списъка/ })).toBeInTheDocument();
});

it("generates recipe cards and opens a recipe detail", async () => {
  const recipe = { id: "recipe-1", title: "Омлет със сирене", description: "Бърза рецепта с наличните продукти.", servings: 2, prepMinutes: 15, rating: 5, ingredients: [{ name: "яйца", quantity: "4 броя", available: true }], steps: ["Разбий яйцата.", "Изпечи омлета."], nutrition: { calories: 280, proteinGrams: 24, fatGrams: 18, carbsGrams: 3, source: "ai_estimate", confidence: "medium" } };
  recognizeIngredients.mockResolvedValue({ context: "fridge", warnings: [], ingredients: [{ name: "яйца", confidence: 0.95 }] });
  generateRecipes.mockResolvedValue({ recipes: [recipe, { ...recipe, id: "recipe-2", title: "Яйца на фурна" }, { ...recipe, id: "recipe-3", title: "Салата със сирене" }] });
  render(<HomePage user={{ displayName: "Ива" }} onLoggedOut={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Качи снимки от устройството"), { target: { files: [new File(["image"], "fridge.jpg", { type: "image/jpeg" })] } });
  fireEvent.click(screen.getByRole("button", { name: "Разпознай от снимката" }));
  await screen.findByRole("button", { name: "Потвърди продуктите" });
  fireEvent.click(screen.getByRole("button", { name: "Потвърди продуктите" }));
  fireEvent.click(screen.getByRole("button", { name: "Генерирай" }));
  expect(await screen.findByRole("heading", { name: "Три идеи за днес" })).toBeInTheDocument();
  expect(generateRecipes).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ name: "яйца" })]));
  fireEvent.click(screen.getAllByRole("button", { name: "Виж рецептата" })[0]);
  expect(screen.getByRole("heading", { name: "Омлет със сирене" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Необходими продукти" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Начин" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Хранителни стойности" })).toBeInTheDocument();
  expect(screen.getByText(/ориентировъчна AI оценка/i)).toBeInTheDocument();
});

it("uploads multiple images together and can remove one before recognition", async () => {
  recognizeIngredients.mockResolvedValue({ context: "mixed", warnings: [], ingredients: [] });
  render(<HomePage user={{ displayName: "Ива" }} onLoggedOut={jest.fn()} />);
  const files = [new File(["one"], "fridge.jpg", { type: "image/jpeg" }), new File(["two"], "cupboard.png", { type: "image/png" })];
  fireEvent.change(screen.getByLabelText("Качи снимки от устройството"), { target: { files } });
  expect(screen.getByText("2 от 5 снимки")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Премахни снимка 2" }));
  expect(screen.getByText("1 от 5 снимки")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Разпознай от снимката" }));
  await waitFor(() => expect(recognizeIngredients).toHaveBeenCalledWith([files[0]]));
});
