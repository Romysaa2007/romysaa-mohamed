
import { GoogleGenAI } from "@google/genai";

export const analyzeSalesWithAI = async (salesData: any, expenses: number, profit: number) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      أنت خبير مالي لنظام إدارة دهانات يسمى "الأشوال".
      بناءً على البيانات التالية:
      - إجمالي المبيعات: ${salesData.totalSales} ج.م
      - إجمالي المصاريف: ${expenses} ج.م
      - صافي الربح: ${profit} ج.م
      - عدد الفواتير: ${salesData.count}
      
      قدم تحليلاً مختصراً (باللغة العربية) يتضمن:
      1. تقييم سريع للأداء.
      2. نصيحة لتقليل المصاريف أو زيادة المبيعات.
      3. تشجيع للمدير.
      اجعل الرد بصيغة احترافية ومختصرة جداً.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "عذراً، لم أتمكن من تحليل البيانات حالياً. حاول مرة أخرى لاحقاً.";
  }
};
