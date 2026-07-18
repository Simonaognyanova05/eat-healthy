import { recognitionJsonSchema, recognitionResultSchema } from "../validation/recognitionSchemas.js";

export async function recognizeImages({ images, env, fetchImpl = fetch }) {
  const response = await fetchImpl("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      store: false,
      max_output_tokens: 1400,
      input: [{ role: "user", content: [
        { type: "input_text", text: `Анализирай всичките ${images.length} изображения като една обща кухня. Разпознай само видимите хранителни продукти и върни един обединен списък без повторения. Използвай кратки нормализирани имена на български, без марки, съдове и кухненски предмети. Не отгатвай скрити продукти. При несигурност намали confidence и добави предупреждение.` },
        ...images.map(({ buffer, mime }) => ({ type: "input_image", image_url: `data:${mime};base64,${buffer.toString("base64")}`, detail: "high" }))
      ] }],
      text: { format: { type: "json_schema", name: "ingredient_recognition", strict: true, schema: recognitionJsonSchema } }
    }),
    signal: AbortSignal.timeout(45000)
  });
  if (!response.ok) throw new Error("AI_PROVIDER_ERROR");
  const payload = await response.json();
  const text = payload.output?.flatMap((item) => item.content || []).find((part) => part.type === "output_text")?.text;
  if (!text) throw new Error("AI_INVALID_OUTPUT");
  const parsed = recognitionResultSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error("AI_INVALID_OUTPUT");
  return { ...parsed.data, model: env.OPENAI_MODEL };
}

export const recognizeImage = ({ image, mime, ...options }) => recognizeImages({ images: [{ buffer: image, mime }], ...options });
