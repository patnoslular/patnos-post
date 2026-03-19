import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  // 1. Try manual override from localStorage (highest priority)
  try {
    const manualKey = localStorage.getItem('GEMINI_API_KEY_OVERRIDE');
    if (manualKey && manualKey.trim().length > 10) {
      return manualKey.trim();
    }
  } catch (e) {
    // Ignore localStorage errors
  }

  // 2. Try MY_API_KEY from environment
  const myKey = process.env.MY_API_KEY || (import.meta as any).env?.VITE_MY_API_KEY;
  if (myKey && myKey !== 'YOUR_API_KEY' && myKey.length > 10) {
    return myKey;
  }

  // 3. Try GEMINI_API_KEY from environment
  const key = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
  if (key && key.length > 5 && key !== "AI Studio Free Tier") {
    return key;
  }
  
  return "";
};

// Simple in-memory and localStorage cache
const translationCache: Record<string, string> = {};

// Load cache from localStorage on init
try {
  const savedCache = localStorage.getItem('translation_cache');
  if (savedCache) {
    Object.assign(translationCache, JSON.parse(savedCache));
  }
} catch (e) {
  console.warn("Failed to load translation cache", e);
}

const saveCache = () => {
  try {
    // Limit cache size to avoid localStorage limits (keep last 500 entries)
    const keys = Object.keys(translationCache);
    if (keys.length > 500) {
      const keysToDelete = keys.slice(0, keys.length - 500);
      keysToDelete.forEach(k => delete translationCache[k]);
    }
    localStorage.setItem('translation_cache', JSON.stringify(translationCache));
  } catch (e) {
    console.warn("Failed to save translation cache", e);
  }
};

export const translateContent = async (text: string, targetLang: 'tr' | 'ku') => {
  if (!text || text.trim() === "") return text;
  
  const apiKey = getApiKey();
  if (!apiKey || apiKey === "" || apiKey === "MY_GEMINI_API_KEY") {
    console.error("Gemini API Key is missing or using placeholder in the browser environment.");
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });

  const cacheKey = `${targetLang}:${text.substring(0, 100)}:${text.length}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }
  
  try {
    // Wrap the entire generation process in a promise that we can catch
    const translatedText = await (async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a professional translator. Translate the following text into ${targetLang === 'tr' ? 'Turkish' : 'Kurdish (Kurmanji dialect)'}. 
        - Maintain the original tone, style, and formatting.
        - If there are placeholders like [IMAGE:...] keep them exactly as they are.
        - Return ONLY the translated text. Do not include any explanations or intro/outro.
        
        Text to translate:
        ${text}`,
      });

      if (!response.text) {
        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY' || finishReason === 'RECITATION') {
          throw new Error(`SAFETY_BLOCK_${finishReason}`);
        }
        throw new Error("EMPTY_RESPONSE");
      }

      return response.text.trim();
    })();
    
    if (!translatedText || translatedText === "") {
      throw new Error("EMPTY_RESPONSE");
    }
    
    translationCache[cacheKey] = translatedText;
    saveCache();
    return translatedText;
  } catch (error: any) {
    console.error("Translation error details:", error);
    throw error;
  }
};
