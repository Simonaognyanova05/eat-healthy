import { getSession, recognizeIngredients } from "./authApi";

afterEach(() => {
  jest.restoreAllMocks();
});

it("preserves the CSRF token when an image content type is supplied", async () => {
  const fetchMock = jest.spyOn(global, "fetch")
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: { user: { id: "user-1" }, csrfToken: "csrf-token" } }) })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: { ingredients: [] } }) });

  await getSession();
  const file = new File(["image"], "fridge.jpg", { type: "image/jpeg" });
  await recognizeIngredients(file);

  expect(fetchMock.mock.calls[1][1]).toEqual(expect.objectContaining({
    method: "POST",
    credentials: "include",
    body: file,
    headers: expect.objectContaining({ "content-type": "image/jpeg", "x-csrf-token": "csrf-token" })
  }));
});

it("returns a clear Bulgarian message when the API is unreachable", async () => {
  jest.spyOn(global, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

  await expect(getSession()).rejects.toThrow(
    "Няма връзка със сървъра. Провери дали backend-ът работи и опитай отново."
  );
});
