import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  
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
}
