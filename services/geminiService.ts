
import { GoogleGenAI, Type } from "@google/genai";
import { ComplianceData } from "../types";

const SYSTEM_INSTRUCTION = `
Role: Compliance & Risk Workflow Assistant (India)
Purpose: Convert complex Indian regulations into clear operational tasks and checklists.
Tone: Professional, neutral, helpful. NO legal advice.
Important: You MUST return a valid JSON object matching the requested schema. 
If using Google Search grounding, ensure the links provided are specific to Indian ministries (MCA, GSTN, RBI, SEBI).
Do not include any text outside the JSON block.
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

export const getComplianceReport = async (scenario: string, isPro: boolean = false): Promise<ComplianceData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  
  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    responseMimeType: "application/json",
    responseSchema: responseSchema,
    temperature: 0.1
  };

  if (isPro) {
    config.tools = [{ googleSearch: {} }];
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: scenario,
    config: config,
  });

  const textOutput = response.text;
  if (!textOutput) throw new Error("Empty response from AI engine.");
  
  let parsed: ComplianceData;
  try {
    // Clean potential markdown blocks if JSON mode is slightly conversational
    const cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanJson) as ComplianceData;
  } catch (e) {
    console.error("JSON Parsing Error:", textOutput);
    throw new Error("The AI returned an invalid format. This usually happens with very complex scenarios. Please try simplifying your input.");
  }
  
  if (isPro && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    parsed.isGrounded = true;
    parsed.groundingSources = response.candidates[0].groundingMetadata.groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }));
  }

  return parsed;
};
