import { GoogleGenerativeAI } from "@google/generative-ai";

const getApiKey = () => {
  const manualKey = localStorage.getItem('GEMINI_API_KEY_OVERRIDE');
  if (manualKey && manualKey.length > 10) return manualKey;
  return (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
};

export const translateContent = async (text: string, targetLang: 'tr' | 'ku') => {
  if (!text || text.trim() === "") return text;
  
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(`You are a professional translator. Translate the following text into ${targetLang === 'tr' ? 'Turkish' : 'Kurdish (Kurmanji dialect)'}. 
      - Maintain common formatting.
      - Return ONLY the translated text.
      Text: ${text}`);

    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Hata durumunda orijinal metni döndür
  }
};
