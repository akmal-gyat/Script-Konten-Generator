import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// High limits for image base64 payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini SDK lazily
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please configure it in your Secrets / Env variables.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Helper to run generateContent with retries on transient errors (503, 429, etc.)
async function generateContentWithRetry(ai: GoogleGenAI, params: any, maxRetries = 3): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      console.log(`[Gemini] Calling API using model "${params.model}" (Attempt ${attempt + 1}/${maxRetries})...`);
      const response = await ai.models.generateContent(params);
      return response;
    } catch (error: any) {
      attempt++;
      console.error(`[Gemini] Attempt ${attempt} failed:`, error.message || error);
      
      const errorMessage = String(error.message || "").toUpperCase();
      const errorStatus = String(error.status || "").toUpperCase();
      const errorCode = Number(error.code || 0);

      const isTransient = 
        errorStatus === "UNAVAILABLE" || 
        errorCode === 503 || 
        errorMessage.includes("503") ||
        errorMessage.includes("UNAVAILABLE") ||
        errorMessage.includes("HIGH DEMAND") ||
        errorMessage.includes("TEMPORARY") ||
        errorStatus === "RESOURCE_EXHAUSTED" ||
        errorCode === 429 ||
        errorMessage.includes("429");
                          
      if (isTransient && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2000ms, 4000ms...
        console.log(`[Gemini] Transient error detected. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

// REST API for Content Generation
app.post("/api/generate", async (req, res) => {
  try {
    const { briefText, imageData, imageMimeType, platform, tone } = req.body;

    if (!briefText && !imageData) {
      res.status(400).json({ error: "Sediakan brief teks atau gambar terlebih dahulu." });
      return;
    }

    const ai = getGeminiClient();

    // Prepare prompt parts
    const parts: any[] = [];

    // Add image if present
    if (imageData && imageMimeType) {
      // Remove data:image/...;base64, prefix if included
      const cleanBase64 = imageData.replace(/^data:image\/\w+;base64,/, "");
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: imageMimeType,
        },
      });
    }

    // Compose strict system-like guidelines and contextual inputs for the prompt
    const chosenPlatform = platform || "Umum (TikTok, Reels, Shorts)";
    const chosenTone = tone || "Kreatif & Menarik";

    const textPrompt = `
Gaya Bahasa dan Format Hasil harus berbentuk INDONESIA. Anda adalah Asisten Kreatif Pembuat Ide Konten & Penulis Skenario Profesional (Content Creator Expert).
Analisis input yang diberikan berupa brief teks dan/atau instruksi visual dari gambar yang diunggah.

Spesifikasi Target Konten:
- Platform Utama: ${chosenPlatform}
- Nada Bicara (Tone of Voice): ${chosenTone}

DATA INPUT DARI PENGGUNA:
Brief Teks: ${briefText || "Sesuai dengan brief gambar saja"}

TUGAS ANDA:
Buatkan skenario konten kreatif siap saji lengkap dengan naskah script teks, detail visualisasi adegan demi adegan (storyboard), caption menarik penarik interaksi (engagement), hashtag relevan, dan kiat-kiat praktis produksi video.

Berikan output secara ketat mengikuti skema JSON yang ditentukan.
`;

    parts.push({ text: textPrompt });

    // Configuration for Gemini generation
    const config = {
      systemInstruction: "Kamu adalah asisten kreator konten media sosial, ahli penulisan skrip video pendek (Shorts, TikTok, Reels), copywriter jempolan, dan pengarah visual hebat. Berikan ide paling kreatif, praktis, orisinal, dan relevan dengan audiens Indonesia.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: [
          "title",
          "targetAudience",
          "platformRelevance",
          "hook",
          "coreIdea",
          "storyboard",
          "caption",
          "hashtags",
          "productionTips"
        ],
        properties: {
          title: {
            type: Type.STRING,
            description: "Judul kreatif yang menarik untuk ide konten ini."
          },
          targetAudience: {
            type: Type.STRING,
            description: "Target audiens yang paling cocok seperti demografi dan minat."
          },
          platformRelevance: {
            type: Type.STRING,
            description: "Penjelasan mengapa konten ini sangat cocok untuk platform yang dipilih."
          },
          hook: {
            type: Type.STRING,
            description: "Hook pembuka detik 1-3 yang sangat menarik perhatian audiens."
          },
          coreIdea: {
            type: Type.STRING,
            description: "Ide utama atau inti pesan dari konten ini."
          },
          storyboard: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              required: ["sceneNumber", "visual", "audio", "duration"],
              properties: {
                sceneNumber: {
                  type: Type.INTEGER,
                  description: "Nomor urut adegan (scene)."
                },
                visual: {
                  type: Type.STRING,
                  description: "Panduan visualisasi akting, posisi kamera, teks di layar, transisi, atau elemen visual di adegan ini."
                },
                audio: {
                  type: Type.STRING,
                  description: "Naskah dialog, voice over, sound effect, atau musik latar belakang pada adegan ini."
                },
                duration: {
                  type: Type.STRING,
                  description: "Estimasi durasi adegan (misal: '3 detik' atau '5 detik')."
                }
              }
            },
            description: "Alur storyboard adegan demi adegan berurutan untuk video berdurasi pendek/sedang (biasanya 5-8 adegan)."
          },
          caption: {
            type: Type.STRING,
            description: "Caption atau takarir media sosial yang memicu interaksi, lengkap dengan Call To Action (CTA)."
          },
          hashtags: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            },
            description: "Daftar hashtag relevan untuk mendominasi FYP (misal. ['#Fyp', '#TipsKreatif'])."
          },
          productionTips: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            },
            description: "Tips produksi seperti jenis pencahayaan, pemilihan musik latar belakang, strategi editing/cut, atau ekspresi."
          }
        }
      }
    };

    const modelsToTry = [
      "gemini-3.5-flash",
      "gemini-flash-latest",
      "gemini-3.1-flash-lite"
    ];

    let response;
    let lastError: any = null;

    for (let i = 0; i < modelsToTry.length; i++) {
      const model = modelsToTry[i];
      try {
        response = await generateContentWithRetry(ai, {
          model,
          contents: { parts },
          config
        }, 2); // 2 attempts per model
        break; // Success! Break the fallback loop
      } catch (error: any) {
        lastError = error;
        console.warn(`[Gemini] Model '${model}' failed. ${i < modelsToTry.length - 1 ? 'Attempting fallback to next model...' : ''}`);
      }
    }

    if (!response) {
      console.error("[Gemini] All models in the fallback chain failed.");
      throw lastError || new Error("All models failed to generate content.");
    }

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Gemini did not return any response.");
    }

    const parsedData = JSON.parse(outputText);
    res.json(parsedData);
  } catch (error: any) {
    console.error("Error generating content ide:", error);
    res.status(500).json({
      error: "Gagal berinteraksi dengan AI: " + (error.message || "Unknown error"),
    });
  }
});

// Serve frontend assets in development / production
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Always bind to port 3000
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
