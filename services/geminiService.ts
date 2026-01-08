
import { GoogleGenAI, Type } from "@google/genai";
import { ComplianceData } from "../types";

const SYSTEM_INSTRUCTION = `
Role: Universal Compliance & Startup Strategy Assistant (India)
Purpose: Transform ANY Indian business or startup query into a structured operational roadmap.
Scope: 
- Handle minor business queries: Opening a small shop, tea stall, freelance consultancy, or home-based business.
- Handle complex startup queries: NBFCs, Fintech, Drone tech, E-commerce, Foreign direct investment (FDI), and SEZ setups.
- Tone: Professional, highly encouraging, and operational.
- Localization: Always consider state-specific rules (e.g., Shop & Establishment Act variations across Maharashtra, Karnataka, etc.) and central mandates (GST, MCA, RBI).

Multi-modal: Analyze provided images (licenses, premises, forms) to verify compliance status.
Output: MUST be a valid JSON object matching the provided schema. No conversational filler outside the JSON.
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

export interface Attachment {
  data: string; // base64
  mimeType: string;
}

export const getComplianceReport = async (
  scenario: string, 
  isPro: boolean = false, 
  attachments: Attachment[] = []
): Promise<ComplianceData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const modelName = isPro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    responseMimeType: "application/json",
    responseSchema: responseSchema,
    temperature: 0.1
  };

  if (isPro) {
    config.tools = [{ googleSearch: {} }];
  }

  const parts: any[] = [{ text: scenario }];
  attachments.forEach(att => {
    parts.push({
      inlineData: {
        data: att.data,
        mimeType: att.mimeType
      }
    });
  });

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: config,
  });

  const textOutput = response.text;
  if (!textOutput) throw new Error("Empty response from AI engine.");
  
  let parsed: ComplianceData;
  try {
    const cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(cleanJson) as ComplianceData;
  } catch (e) {
    console.error("JSON Parsing Error:", textOutput);
    throw new Error("Formatting error. Please simplify your scenario.");
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
