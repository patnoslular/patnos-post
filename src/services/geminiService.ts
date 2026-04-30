import { GoogleGenerativeAI } from "@google/generative-ai";

const getApiKey = () => {
  try {
    const manualKey = localStorage.getItem('GEMINI_API_KEY_OVERRIDE');
    if (manualKey && manualKey.trim().length > 10) return manualKey.trim();
  } catch (e) {}

  const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (viteKey && viteKey.length > 10) return viteKey;

  const envKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || "";
  return envKey;
};

const translationCache: Record<string, string> = {};

export const translateContent = async (text: string, targetLang: 'tr' | 'ku') => {
  if (!text || text.trim() === "") return text;
  
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const genAI = new GoogleGenerativeAI(apiKey);
  const cacheKey = `${targetLang}:${text.substring(0, 50)}:${text.length}`;
  if (translationCache[cacheKey]) return translationCache[cacheKey];
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`You are a professional translator. Translate the following text into ${targetLang === 'tr' ? 'Turkish' : 'Kurdish (Kurmanji dialect)'}. 
      - Maintain the original tone and formatting.
      - Return ONLY the translated text.
      
      Text to translate:
      ${text}`);

    const response = await result.response;
    const translatedText = response.text().trim();
    translationCache[cacheKey] = translatedText;
    return translatedText;
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
};
