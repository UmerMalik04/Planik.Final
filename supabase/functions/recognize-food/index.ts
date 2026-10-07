// Deno.serve — no remote std import, so cold starts and deploys stay fast.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

// CORS — required for browser/WebView clients (Capacitor iOS/Android use file:// origin).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Strict JSON contract returned to the client. Keep this in sync with FoodRecognitionService.ts.
const SYSTEM_PROMPT = `You are an expert food identifier for every world cuisine. Name the exact dish in this photo and estimate nutrition for the visible portion (not per 100g).
The photo may be taken from ANY angle (top-down, side, tilted, upside-down), in poor light, close-up, in a container, packaged or partly eaten — identify it anyway.
For South Asian / desi food, use visual cues: gravy colour (red/orange = karahi, jalfrezi, rogan josh, tikka masala; yellow/cream = korma, daal, kadhi; green = saag, palak paneer; brown = nihari, bhuna, keema), oil sheen, visible meat (chicken, lamb, mutton, beef, fish, prawn), vegetables, paneer, chickpeas or lentils, and sides (naan, roti, chapati, paratha, puri, rice, raita).
Examples: Chicken Karahi, Lamb Karahi, Chicken Tikka Masala, Butter Chicken, Chicken Korma, Rogan Josh, Chicken Jalfrezi, Keema, Keema Aloo, Nihari, Haleem, Paya, Aloo Gosht, Aloo Gobi, Bhindi Masala, Saag Gosht, Palak Paneer, Chana Masala, Daal Tarka, Daal Makhani, Rajma, Kadhi Pakora, Chicken Biryani, Pulao, Samosa, Pakora, Seekh Kebab, Chapli Kebab, Tandoori Chicken, Halwa Puri, Gulab Jamun, Kheer. Also be specific for Middle Eastern, African, East/South-East Asian and Latin dishes.
If a curry and bread/rice are both visible, name both (e.g. "Chicken Karahi with Naan") and sum the nutrition.
NEVER answer with generic labels like "Curry", "Mixed Food", "Stew" or "Rice with Meat" — always choose the closest specific dish. Branded items by brand name.
If there is no food at all, name = "Unrecognized".
Output the JSON only.`;

/** Generic names that mean the model gave up — never show these to the user.
 *  Only flag answers that are nothing BUT a generic word (optionally with a
 *  filler like "mixed" or a cuisine). Real names like "Mixed Berry Smoothie",
 *  "Meat Lovers Pizza" or "Street Food Tacos" must pass through untouched. */
const isGeneric = (name: unknown) => {
  if (typeof name !== "string") return true;
  const n = name.trim().toLowerCase();
  return /^(mixed\s+)?(plate|bowl|dish)\s+of\s+food$/.test(n) ||
    /^(mixed\s+)?(curry|food|stew|dish|meal|meat|rice)$/.test(n) ||
    /^(indian|asian|ethnic|south asian)\s+(food|curry|dish|meal)$/.test(n);
};

/** Response schema — forces valid, complete JSON so we never pay for a parse retry. */
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    servingSize: { type: "STRING" },
    calories: { type: "NUMBER" },
    protein: { type: "NUMBER" },
    carbs: { type: "NUMBER" },
    fat: { type: "NUMBER" },
    fiber: { type: "NUMBER" },
    sugar: { type: "NUMBER" },
    confidence: { type: "NUMBER" },
  },
  required: ["name", "calories", "protein", "carbs", "fat", "confidence"],
} as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // 1) Auth — privacy guard: only authenticated app users (incl. guest/anonymous) reach the AI pipeline.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError || !userData?.user) return json({ error: "Unauthorized" }, 401);

    // 2) Validate payload.
    const body = await req.json().catch(() => null);
    const imageBase64: unknown = body?.imageBase64;
    if (typeof imageBase64 !== "string" || !imageBase64.startsWith("data:image/")) {
      return json({ error: "Invalid image" }, 400);
    }
    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return json({ error: "Malformed image data URL" }, 400);
    const [, mimeType, rawBase64] = match;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const SCHEMA_CONFIG = {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0,
      maxOutputTokens: 300,
    };
    const noThinking = { ...SCHEMA_CONFIG, thinkingConfig: { thinkingBudget: 0 } };

    /** One Gemini call → parsed food JSON. Throws on HTTP/parse failure or timeout. */
    const recognise = async (model: string, config: Record<string, unknown>, timeoutMs: number, extraInstruction = "") => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{
                role: "user",
                parts: [{ text: SYSTEM_PROMPT + (extraInstruction ? "\n" + extraInstruction : "") }, { inlineData: { mimeType, data: rawBase64 } }],
              }],
              generationConfig: config,
            }),
          },
        );
        if (!res.ok) throw new Error(`${model} -> ${res.status} ${await res.text()}`);
        const data = await res.json();
        const text: string =
          data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
        const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
        if (!parsed?.name) throw new Error(`${model} -> empty result`);
        return { ...parsed, _model: model };
      } finally {
        clearTimeout(timer);
      }
    };

    const started = Date.now();
    // Accuracy first: the full Flash model always gets the chance to answer.
    // The lite model starts in parallel purely as a warm fallback — its answer
    // is only used if the accurate model fails or aborts, so a slow accurate
    // call never blocks an already-ready fallback (8s cap keeps worst case ~8s).
    const RACE: Array<[string, Record<string, unknown>]> = [
      ["gemini-flash-latest", noThinking],
      ["gemini-flash-lite-latest", SCHEMA_CONFIG],
    ];

    let result: Record<string, unknown> | null = null;
    let lastError = "no attempt succeeded";
    // Both attempts are started eagerly, so every promise needs a handler
    // attached immediately: if the primary resolves and the fallback later
    // rejects (non-2xx, parse failure, abort), an unawaited rejection would
    // otherwise be unhandled and can crash the edge isolate.
    // 12s/15s caps: on slow mobile uploads + Gemini cold starts the old 8s cap
    // aborted BOTH models on simple photos (e.g. a single orange), so the user
    // got an error instead of a result.
    const attempts = RACE.map(([model, config], i) => {
      const attempt = recognise(model, config, i === 0 ? 12000 : 15000);
      attempt.catch(() => {}); // no-op handler; real errors surface on await below
      return attempt;
    });
    try {
      result = await attempts[0];
    } catch (primaryError) {
      try {
        result = await attempts[1];
      } catch (fallbackError) {
        lastError = `primary: ${(primaryError as Error).message}; fallback: ${(fallbackError as Error).message}`;
        console.warn("All attempts failed:", lastError);
      }
    }
    if (!result) throw new Error(`Gemini API unavailable: ${lastError}`);

    // Generic label ("Curry", "Mixed Food") → one retry with a specific-dish
    // nudge. If the model still can't name it, answer "Unrecognized" so the
    // client shows a clear error — never invent a dish name.
    if (isGeneric(result.name) && result.name !== "Unrecognized") {
      try {
        const retry = await recognise("gemini-flash-latest", {
          ...SCHEMA_CONFIG,
          temperature: 0.3,
        }, 6000, "That answer was too generic. Look again at the gravy colour, oil sheen, meat/veg, bread and rice, and name the closest SPECIFIC dish (e.g. Chicken Karahi, Keema Aloo, Chana Masala, Lamb Biryani). If unsure between dishes, pick the single most likely one. Generic words like curry/mixed/food/stew are forbidden.");
        if (!isGeneric(retry.name)) {
          result = retry;
        } else {
          result = { name: "Unrecognized", confidence: 0 };
        }
      } catch (err) {
        console.warn("Generic-name retry failed:", (err as Error).message);
        result = { name: "Unrecognized", confidence: 0 };
      }
    }

    console.log(`Recognized in ${Date.now() - started}ms via ${result._model}:`, result.name);
    delete result._model;
    return json(result);
  } catch (error) {
    console.error("Error in recognize-food function:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
