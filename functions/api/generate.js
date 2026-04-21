export async function onRequestPost({ request, env }) {
  const CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Bad JSON", { status: 400, headers: CORS });
  }

  const { systemPrompt, userPrompt } = body;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 1200, temperature: 0.7 },
      }),
    }
  );

  const data = await res.json();

  if (data.error) {
    return new Response(
      JSON.stringify({ error: data.error.message }),
      { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return new Response(
    JSON.stringify({ text }),
    { headers: { ...CORS, "Content-Type": "application/json" } }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
