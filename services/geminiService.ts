import { GoogleGenAI, Type } from "@google/genai";
import { TicketPriority, TicketCategory, AIAnalysis } from "../types";

// Acesso seguro ao import.meta.env para evitar erros "Cannot read properties of undefined"
// se o ambiente Vite não injetar o objeto corretamente.
const apiKey = (import.meta.env && import.meta.env.VITE_GOOGLE_API_KEY) || "";

const ai = new GoogleGenAI({ apiKey: apiKey });

export const analyzeTicketWithGemini = async (
  title: string,
  description: string
): Promise<AIAnalysis | null> => {
  if (!apiKey) {
      console.warn("API Key do Gemini não configurada (VITE_GOOGLE_API_KEY).");
      return null;
  }

  try {
    const prompt = `
      Analise o seguinte ticket de suporte.
      Título: "${title}"
      Descrição: "${description}"
      
      Forneça uma resposta JSON com:
      1. Prioridade Sugerida (LOW, MEDIUM, HIGH, CRITICAL). Baseie-se na urgência e impacto.
      2. Categoria Sugerida (BUG, FEATURE_REQUEST, BILLING, SUPPORT, OTHER).
      3. Pontuação de Sentimento (0-100, onde 0 é muito irritado/negativo, 100 é muito feliz/positivo).
      4. Rótulo de Sentimento (Positive, Neutral, Negative).
      5. Um resumo conciso de 1 frase do problema (em Português do Brasil).
      6. Um rascunho de resposta profissional e empática para o agente de suporte enviar (em Português do Brasil).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedPriority: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
            suggestedCategory: { type: Type.STRING, enum: ["BUG", "FEATURE_REQUEST", "BILLING", "SUPPORT", "OTHER"] },
            sentimentScore: { type: Type.NUMBER },
            sentimentLabel: { type: Type.STRING, enum: ["Positive", "Neutral", "Negative"] },
            summary: { type: Type.STRING },
            suggestedReply: { type: Type.STRING }
          },
          required: ["suggestedPriority", "suggestedCategory", "sentimentScore", "sentimentLabel", "summary", "suggestedReply"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        suggestedPriority: data.suggestedPriority as TicketPriority,
        suggestedCategory: data.suggestedCategory as TicketCategory,
        sentimentScore: data.sentimentScore,
        sentimentLabel: data.sentimentLabel,
        summary: data.summary,
        suggestedReply: data.suggestedReply
      };
    }
    return null;
  } catch (error) {
    console.error("Falha na análise do Gemini:", error);
    return null;
  }
};