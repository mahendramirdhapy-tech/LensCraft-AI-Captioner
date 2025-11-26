import { GoogleGenAI } from "@google/genai";

// Models to try in order of preference/speed/cost
const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite-latest'; 
// Note: In a real scenario, fallback might be a stronger model if the light one fails due to complexity, 
// or a different provider. Here we use variants of Flash for speed/reliability.

export const generateCaption = async (base64Image: string, mimeType: string): Promise<{ text: string; model: string }> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  const prompt = "Analyze this image and provide a concise, descriptive caption. Focus on the main subject and action.";

  try {
    // Attempt 1: Primary Model
    console.log(`Attempting caption with ${PRIMARY_MODEL}...`);
    const response = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      }
    });

    if (response.text) {
      return { text: response.text, model: PRIMARY_MODEL };
    }
  } catch (error) {
    console.warn(`Primary model ${PRIMARY_MODEL} failed, attempting fallback...`, error);
  }

  try {
    // Attempt 2: Fallback Model
    console.log(`Attempting caption with ${FALLBACK_MODEL}...`);
    const response = await ai.models.generateContent({
      model: FALLBACK_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      }
    });

    if (response.text) {
      return { text: response.text, model: FALLBACK_MODEL };
    }
  } catch (error) {
    console.error("Fallback model failed.", error);
    throw new Error("AI service is temporarily unavailable. Please try again later.");
  }

  throw new Error("Unable to generate caption from available models.");
};