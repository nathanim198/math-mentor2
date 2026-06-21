import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are Math Mentor, a helpful and encouraging math tutor.
          - Explain concepts clearly using simple language first, then formal notation.
          - Use LaTeX for mathematical formulas (e.g., $x^2$ or $$E=mc^2$$).
          - Break down complex problems into step-by-step solutions.
          - If a user asks for an answer, guide them through the process rather than just giving the result.
          - Be encouraging and patient.`,
        },
        history: history || [],
      });

      const result = await chat.sendMessageStream({ message });
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  app.post("/api/assessment-chat", async (req, res) => {
    try {
      const { message, history, name, age } = req.body;
      
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are evaluating the math level of a ${age}-year-old student named ${name}. 
          Your goal is to determine if they are Beginner, Intermediate, or Advanced in math.
          - Ask them 3 math questions one by one, waiting for their response each time.
          - Start with a simple question appropriate for their age. Based on their answer, make the next question harder or easier.
          - Be friendly, encouraging, and brief.
          - Use LaTeX for mathematical formulas.
          - CRITICAL: After they answer the 3rd question, you MUST end your response EXACTLY with the following format on a new line:
          ASSESSMENT_COMPLETE: [Level]: [Topic1], [Topic2], [Topic3]
          where [Level] is Beginner, Intermediate, or Advanced, and [Topic1], [Topic2], [Topic3] are three specific math topics they should practice.`,
        },
        history: history || [],
      });

      const result = await chat.sendMessageStream({ message });
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  app.post("/api/generate-problems", async (req, res) => {
    try {
      const { topic, difficulty } = req.body;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 3 math practice problems about "${topic}" at a ${difficulty} difficulty level. 
        Format as JSON array of objects with 'question' (LaTeX), 'options' (Array of 4 strings, one correct), 'correctIndex' (number), 'explanation' (LaTeX).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                correctIndex: { type: Type.NUMBER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctIndex", "explanation"]
            }
          }
        }
      });

      res.json(JSON.parse(response.text || "[]"));
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to generate problems" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
