
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getGeminiResponse = async (prompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "AI produced an empty response.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI is currently resting. Please try again later.";
  }
};
