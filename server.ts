import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { InferenceClient } from "@huggingface/inference";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const hfToken = process.env.HF_TOKEN;

if (!hfToken) {
  throw new Error(
    "HF_TOKEN environment variable is not configured."
  );
}

const client = new InferenceClient(hfToken);

app.post("/api/generate", async (req, res) => {
  try {
    const {
      briefText,
      imageData,
      imageMimeType,
      platform,
      tone
    } = req.body;

    if (!briefText && !imageData) {
      return res.status(400).json({
        error:
          "Sediakan brief teks atau gambar terlebih dahulu."
      });
    }

    const chosenPlatform =
      platform || "TikTok, Reels, Shorts";

    const chosenTone =
      tone || "Kreatif dan Menarik";

    const prompt = `
Anda adalah Content Strategist dan Script Writer profesional.

Buat output dalam BAHASA INDONESIA.

Platform:
${chosenPlatform}

Tone:
${chosenTone}

Brief:
${briefText || "Analisis berdasarkan gambar"}

Output HARUS berupa JSON valid dengan format:

{
  "title": "",
  "targetAudience": "",
  "platformRelevance": "",
  "hook": "",
  "coreIdea": "",
  "storyboard": [
    {
      "sceneNumber": 1,
      "visual": "",
      "audio": "",
      "duration": ""
    }
  ],
  "caption": "",
  "hashtags": [],
  "productionTips": []
}

Jangan menambahkan markdown.
Jangan menambahkan penjelasan.
Keluarkan JSON saja.
`;

    let completion;

    if (imageData) {
      completion =
        await client.chatCompletion({
          model:
            "Qwen/Qwen2.5-VL-72B-Instruct",

          messages: [
            {
              role: "system",
              content:
                "Kamu adalah ahli konten media sosial Indonesia."
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: imageData
                  }
                },
                {
                  type: "text",
                  text: prompt
                }
              ]
            }
          ],

          max_tokens: 2500,
          temperature: 0.8
        });
    } else {
      completion =
        await client.chatCompletion({
          model:
            "Qwen/Qwen2.5-72B-Instruct",

          messages: [
            {
              role: "system",
              content:
                "Kamu adalah ahli konten media sosial Indonesia."
            },
            {
              role: "user",
              content: prompt
            }
          ],

          max_tokens: 2500,
          temperature: 0.8
        });
    }

    const raw =
      completion.choices?.[0]?.message?.content;

    if (!raw) {
      throw new Error(
        "Model tidak mengembalikan respons."
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch {
      const cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      parsed = JSON.parse(cleaned);
    }

    res.json(parsed);
  } catch (error: any) {
    console.error(error);

    res.status(500).json({
      error:
        error?.message ||
        "Terjadi kesalahan saat memproses AI."
    });
  }
});

if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } =
    await import("vite");

  const vite = await createViteServer({
    server: {
      middlewareMode: true
    },
    appType: "spa"
  });

  app.use(vite.middlewares);
} else {
  const distPath = path.join(
    process.cwd(),
    "dist"
  );

  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    res.sendFile(
      path.join(distPath, "index.html")
    );
  });
}

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});
