import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

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
}
