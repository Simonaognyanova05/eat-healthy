import { getSession, recognizeIngredients } from "./authApi";

afterEach(() => {
  jest.restoreAllMocks();
});

it("preserves the CSRF token for a multi-image multipart upload", async () => {
  const fetchMock = jest.spyOn(global, "fetch")
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: { user: { id: "user-1" }, csrfToken: "csrf-token" } }) })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: { ingredients: [] } }) });

  await getSession();
  const file = new File(["image"], "fridge.jpg", { type: "image/jpeg" });
  await recognizeIngredients([file]);

  const options = fetchMock.mock.calls[1][1];
  expect(options).toEqual(expect.objectContaining({
    method: "POST",
    credentials: "include",
    body: expect.any(FormData),
    headers: expect.objectContaining({ "x-csrf-token": "csrf-token" })
  }));
  expect(options.headers["content-type"]).toBeUndefined();
  expect(options.body.getAll("images")).toHaveLength(1);
});

it("returns a clear Bulgarian message when the API is unreachable", async () => {
  jest.spyOn(global, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

  await expect(getSession()).rejects.toThrow(
    "Няма връзка със сървъра. Провери дали backend-ът работи и опитай отново."
  );
});
