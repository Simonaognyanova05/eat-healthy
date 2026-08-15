const API_URL = process.env.REACT_APP_API_URL
  || (process.env.NODE_ENV === "production"
    ? "/api/v1"
    : `${window.location.protocol}//${window.location.hostname}:4000/api/v1`);
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
  if (!response.ok) {
    const error = new Error(body?.error?.message || "Нещо се обърка.");
    error.code = body?.error?.code;
    error.details = body?.error?.details;
    error.status = response.status;
    throw error;
  }
  return body.data;
}
export async function getSession() {
  const data = await request("/auth/session");
  csrfToken = data.csrfToken;
  return data;
}
export const register = (values) => request("/auth/register", { method: "POST", body: JSON.stringify(values) });
export const login = (values) => request("/auth/login", { method: "POST", body: JSON.stringify(values) });
export const logout = () => request("/auth/logout", { method: "POST" });
export const recognizeIngredients = (files) => {
  const form = new FormData();
  files.forEach((file) => form.append("images", file));
  return request("/recognitions", { method: "POST", body: form });
};
export const recognizeGuestImage = (file) => {
  const form = new FormData();
  form.append("image", file);
  return request("/recognitions/guest", { method: "POST", body: form });
};
export const getRecognitionUsage = () => request("/recognitions/usage");
export const createPlanRequest = (plan) => request("/plan-requests", { method: "POST", body: JSON.stringify({ plan }) });
export const getMyPlanRequest = () => request("/plan-requests/mine");
export const getAdminPlanRequests = () => request("/plan-requests/admin");
export const decidePlanRequest = (id, decision) => request(`/plan-requests/admin/${id}`, {
  method: "PATCH",
  body: JSON.stringify({ decision })
});
export const getProfile = () => request("/profile");
export const saveProfile = (values) => request("/profile", { method: "PUT", body: JSON.stringify(values) });
export const generateRecipes = (ingredients) => request("/recipes/generate", {
  method: "POST",
  body: JSON.stringify({ ingredients: ingredients.map((ingredient) => ingredient.name) })
});
export const oauthUrl = (provider) => `${API_URL}/auth/oauth/${provider}/start`;
