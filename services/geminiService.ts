
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Post } from "../types";

export const generateFeed = async (): Promise<Post[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a list of 5 diverse social media posts in JSON format. Each post should have a realistic caption, a count of likes between 10 and 5000, and a fake timestamp. Provide usernames like 'travel_bug', 'tech_guru', 'foodie_life', etc.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              username: { type: Type.STRING },
              caption: { type: Type.STRING },
              likes: { type: Type.NUMBER },
              timestamp: { type: Type.STRING }
            },
            required: ["id", "username", "caption", "likes", "timestamp"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    return data.map((item: any, index: number) => ({
      ...item,
      user: {
        id: `user-${index}`,
        username: item.username,
        avatar: `https://picsum.photos/seed/${item.username}/200`,
        isVerified: Math.random() > 0.7
      },
      imageUrl: `https://picsum.photos/seed/post-${item.id}/800/800`,
      comments: [],
      isLiked: false
    }));
  } catch (error) {
    console.error("Error generating feed:", error);
    return [];
  }
};

export const startAICall = (callbacks: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      systemInstruction: 'You are Alex, a friendly AI companion on a social media app. You are currently on a video call with the user. Be engaging, ask how their day is going, and talk about latest trends.',
      responseModalities: [Modality.AUDIO]
    }
  });
};
