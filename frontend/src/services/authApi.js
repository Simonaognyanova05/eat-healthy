const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api/v1";
let csrfToken = "";

async function request(path, options = {}) {
  const { headers: optionHeaders = {}, ...requestOptions } = options;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      ...requestOptions,
      headers: { "content-type": "application/json", ...(csrfToken && { "x-csrf-token": csrfToken }), ...optionHeaders }
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
export const recognizeIngredients = (file) => request("/recognitions", {
  method: "POST",
  headers: { "content-type": file.type },
  body: file
});
export const oauthUrl = (provider) => `${API_URL}/auth/oauth/${provider}/start`;
