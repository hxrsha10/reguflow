
import { GoogleGenAI, Type } from "@google/genai";
import { ComplianceData } from "../types";

const SYSTEM_INSTRUCTION = `
Role: Compliance & Risk Workflow Assistant (India)
Purpose: Convert complex Indian regulations into clear operational tasks and checklists.
Tone: Professional, neutral, helpful. NO legal advice.
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    applicableRegulations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
        required: ["name", "description"]
      }
    },
    complianceObligations: { type: Type.ARRAY, items: { type: Type.STRING } },
    actionableTaskChecklist: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { task: { type: Type.STRING }, description: { type: Type.STRING } },
        required: ["task", "description"]
      }
    },
    requiredDocuments: { type: Type.ARRAY, items: { type: Type.STRING } },
    deadlinesFrequency: { type: Type.ARRAY, items: { type: Type.STRING } },
    riskFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
    monitoringSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["applicableRegulations", "complianceObligations", "actionableTaskChecklist", "requiredDocuments", "deadlinesFrequency", "riskFlags", "monitoringSuggestions"]
};

export const getComplianceReport = async (scenario: string): Promise<ComplianceData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: scenario,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.2
    },
  });

  if (!response.text) throw new Error("Empty response from AI engine.");
  return JSON.parse(response.text) as ComplianceData;
};
