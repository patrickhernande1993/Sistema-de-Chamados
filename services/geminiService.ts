
import { GoogleGenAI, Type } from "@google/genai";
import { FinanceAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBillWithGemini = async (
  title: string,
  amount: number,
  category: string
): Promise<FinanceAnalysis | null> => {
  
  if (!process.env.API_KEY) {
      console.warn("API Key ausente.");
      return null;
  }

  try {
    const prompt = `
      Atue como um consultor financeiro pessoal focado em economia doméstica.
      Analise esta despesa:
      Item: "${title}"
      Valor: R$ ${amount}
      Categoria: ${category}

      Retorne um JSON com:
      1. isExpensive: boolean (Verdadeiro se o valor parecer alto para o item/média de mercado no Brasil).
      2. savingsTip: string (Uma dica prática e curta de como economizar nisso).
      3. categoryInsight: string (Um comentário sobre gastos nessa categoria).
      4. sentimentLabel: 'Good' (Gasto OK), 'Warning' (Atenção), 'Bad' (Gasto Excessivo).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isExpensive: { type: Type.BOOLEAN },
            savingsTip: { type: Type.STRING },
            categoryInsight: { type: Type.STRING },
            sentimentLabel: { type: Type.STRING, enum: ["Good", "Warning", "Bad"] }
          },
          required: ["isExpensive", "savingsTip", "categoryInsight", "sentimentLabel"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as FinanceAnalysis;
    }
    return null;
  } catch (error) {
    console.error("Erro na análise financeira:", error);
    return null;
  }
};
