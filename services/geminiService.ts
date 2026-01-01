
import { GoogleGenAI, Type } from "@google/genai";
import { SuggestedService, Car, FuelType, ExtractedPart, SchematicHotspot } from '../types';

const parseAIResponse = (text: string | undefined): any => {
  if (!text) throw new Error("Empty response from AI");
  let cleanedText = text.trim();
  const match = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) cleanedText = match[1];
  try {
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("JSON Parse error:", cleanedText);
    throw e;
  }
};

// Використовуємо 'gemini-3-pro-preview' для складних завдань аналізу та міркування
export const suggestServicesWithAI = async (mileage: number, complaints: string): Promise<SuggestedService[]> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  try {
    const prompt = `Ти - провідний механік СТО 'RemServ'. Проаналізуй скарги клієнта: "${complaints}". Пробіг авто: ${mileage} км. Запропонуй список необхідних робіт у форматі JSON масиву об'єктів з полями serviceName та reason.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Використовуємо Pro для кращої логіки
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              serviceName: { type: Type.STRING, description: "Назва послуги" },
              reason: { type: Type.STRING, description: "Обґрунтування рекомендації" },
            },
            required: ['serviceName', 'reason']
          },
        },
      },
    });
    return parseAIResponse(response.text);
  } catch (error) {
    console.error("AI Suggest Error:", error);
    return [];
  }
};

export const extractCarDataFromImage = async (images: { front?: string; back?: string }): Promise<Partial<Omit<Car, 'carID' | 'ownerID'>>> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const imageParts = [];
  if (images.front) imageParts.push({ inlineData: { mimeType: 'image/jpeg', data: images.front } });
  if (images.back) imageParts.push({ inlineData: { mimeType: 'image/jpeg', data: images.back } });
  if (imageParts.length === 0) return {};

  try {
    const prompt = `Проаналізуй фото техпаспорта та витягни дані: make (марка), model (модель), licensePlate (номер), vin (код), year (рік як число), engineVolume (об'єм як число), fuel (пальне: одне з ${Object.values(FuelType).join(', ')}). Поверни ТІЛЬКИ чистий JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Використовуємо Pro для точного OCR
      contents: { parts: [...imageParts, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            make: { type: Type.STRING },
            model: { type: Type.STRING },
            licensePlate: { type: Type.STRING },
            vin: { type: Type.STRING },
            year: { type: Type.NUMBER },
            engineVolume: { type: Type.NUMBER },
            fuel: { type: Type.STRING },
          }
        }
      },
    });
    return parseAIResponse(response.text);
  } catch (error) {
    console.error("OCR Car Error:", error);
    return {};
  }
};

export const extractPartsFromInvoiceImage = async (imageBase64: string): Promise<ExtractedPart[]> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  try {
    const prompt = `Проаналізуй накладну та витягни список запчастин: name (назва), partNumber (артикул), quantity (кількість як число), price (ціна за одиницю як число). Поверни JSON масив.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              partNumber: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              price: { type: Type.NUMBER }
            },
            required: ['name', 'quantity', 'price']
          }
        }
      }
    });
    return parseAIResponse(response.text);
  } catch (error) {
    console.error("Invoice Error:", error);
    return [];
  }
};

export const analyzeSchematicWithAI = async (imageBase64: string): Promise<SchematicHotspot[]> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  try {
    const prompt = `Це технічна схема автомобільного вузла. Знайди всі пронумеровані деталі. Для кожної вкажи: label (номер на схемі), x та y (координати як число 0-100, відсоток від розміру зображення), та serviceKeywords (масив ключових слів для пошуку послуг українською). Поверни JSON масив.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER },
              serviceKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['label', 'x', 'y', 'serviceKeywords']
          }
        }
      },
    });
    const results = parseAIResponse(response.text);
    return results.map((r: any, idx: number) => ({ ...r, id: String(idx) }));
  } catch (error) {
    console.error("Schematic AI Error:", error);
    return [];
  }
};
