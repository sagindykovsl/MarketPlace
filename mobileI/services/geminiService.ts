import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const rewriteComplaintText = async (text: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Rewrite the following customer complaint to be more professional, concise, and clear for a business context. Keep the core issue intact but remove emotional language. 
    
    Complaint: "${text}"`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return text;
  }
};