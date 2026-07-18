import { getSession } from "./authApi";

afterEach(() => {
  jest.restoreAllMocks();
});

it("returns a clear Bulgarian message when the API is unreachable", async () => {
  jest.spyOn(global, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

  await expect(getSession()).rejects.toThrow(
    "Няма връзка със сървъра. Провери дали backend-ът работи и опитай отново."
  );
});
