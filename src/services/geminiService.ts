import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * GEMINI API SERVICE
 * 
 * NOT: Vercel'de "Rollup failed to resolve import" hatası alıyorsanız,
 * package.json içinde @google/generative-ai paketinin olduğundan emin olun
 * ve ortamınızda 'npm install' komutunu çalıştırın.
 */

const getApiKey = () => {
  // 1. Manuel API anahtarı (localStorage)
  try {
    const manualKey = localStorage.getItem('GEMINI_API_KEY_OVERRIDE');
    if (manualKey && manualKey.trim().length > 10) {
      return manualKey.trim();
    }
  } catch (e) {}

  // 2. VITE Çevre Değişkenleri
  const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (viteKey && viteKey.length > 10) {
    return viteKey;
  }

  // 3. Fallback
  const envKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || "";
  if (envKey && envKey.length > 5) {
    return envKey;
  }
  
  return "";
};

const translationCache: Record<string, string> = {};

try {
  const savedCache = localStorage.getItem('translation_cache');
  if (savedCache) {
    Object.assign(translationCache, JSON.parse(savedCache));
  }
} catch (e) {}

const saveCache = () => {
  try {
    const keys = Object.keys(translationCache);
    if (keys.length > 500) {
      const keysToDelete = keys.slice(0, keys.length - 500);
      keysToDelete.forEach(k => delete translationCache[k]);
    }
    localStorage.setItem('translation_cache', JSON.stringify(translationCache));
  } catch (e) {}
};

export const translateContent = async (text: string, targetLang: 'tr' | 'ku') => {
  if (!text || text.trim() === "") return text;
  
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const genAI = new GoogleGenerativeAI(apiKey);
  const cacheKey = `${targetLang}:${text.substring(0, 100)}:${text.length}`;
  
  if (translationCache[cacheKey]) return translationCache[cacheKey];
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`You are a professional translator. Translate the following text into ${targetLang === 'tr' ? 'Turkish' : 'Kurdish (Kurmanji dialect)'}. 
      - Maintain the original tone, style, and formatting.
      - If there are placeholders like [IMAGE:...] keep them exactly as they are.
      - Return ONLY the translated text. Do not include any explanations.
      
      Text:
      ${text}`);

    const response = await result.response;
    const translatedText = response.text();

    if (!translatedText) throw new Error("EMPTY_RESPONSE");
    
    translationCache[cacheKey] = translatedText.trim();
    saveCache();
    return translatedText.trim();
  } catch (error: any) {
    console.error("Translation error:", error);
    throw error;
  }
};
