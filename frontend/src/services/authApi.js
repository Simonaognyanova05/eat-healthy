const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api/v1";
let csrfToken = "";

async function request(path, options = {}) {
  const { headers: optionHeaders = {}, ...requestOptions } = options;
  const isFormData = typeof FormData !== "undefined" && requestOptions.body instanceof FormData;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      ...requestOptions,
      headers: { ...(!isFormData && { "content-type": "application/json" }), ...(csrfToken && { "x-csrf-token": csrfToken }), ...optionHeaders }
    });
  } catch {
    throw new Error("Няма връзка със сървъра. Провери дали backend-ът работи и опитай отново.");
  }
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || "Нещо се обърка.");
  return body.data;
}
export async function getSession() {
  const data = await request("/auth/session");
  csrfToken = data.csrfToken;
  return data;
}
export const register = (values) => request("/auth/register", { method: "POST", body: JSON.stringify(values) });
export const logout = () => request("/auth/logout", { method: "POST" });
export const recognizeIngredients = (files) => {
  const form = new FormData();
  files.forEach((file) => form.append("images", file));
  return request("/recognitions", { method: "POST", body: form });
};
export const generateRecipes = (ingredients) => request("/recipes/generate", {
  method: "POST",
  body: JSON.stringify({ ingredients: ingredients.map((ingredient) => ingredient.name) })
});
export const oauthUrl = (provider) => `${API_URL}/auth/oauth/${provider}/start`;
