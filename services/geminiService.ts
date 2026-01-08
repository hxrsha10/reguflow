
import { GoogleGenAI, Type } from "@google/genai";
import { ComplianceData } from "../types";

const SYSTEM_INSTRUCTION = `
Role: Global Business Strategist & Compliance Architect (India)
Purpose: Transform ANY business query into a high-fidelity roadmap. 

Personalization Rule: You will be provided with "User Context/History". If the current query relates to previous searches, improve your response by building upon past context (e.g., comparing cities, scaling existing models).

Scope: 
- Minor: Home-based businesses, micro-consultancies, small retail.
- Major: Unicorn startups, NBFCs, cross-border e-commerce, manufacturing.
- Premium Features: If tier is PREMIUM, provide 50% more detail in 'riskFlags' and 'monitoringSuggestions', including specific section numbers of Indian Acts.

Output: Valid JSON only.
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
  tier: string = 'FREE', 
  attachments: Attachment[] = [],
  history: string[] = []
): Promise<ComplianceData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  const isPro = tier === 'PRO' || tier === 'PREMIUM';
  const isPremium = tier === 'PREMIUM';
  
  // Use pro model for paid tiers, flash for free
  const modelName = isPro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

  const contextPrompt = history.length > 0 
    ? `USER HISTORY CONTEXT: ${history.join(" | ")}. CURRENT QUERY: ${scenario}.`
    : scenario;

  const config: any = {
    systemInstruction: `${SYSTEM_INSTRUCTION}\nUser Tier: ${tier}\n${isPremium ? 'PROVIDE MAXIMUM DETAIL FOR PREMIUM USER.' : ''}`,
    responseMimeType: "application/json",
    responseSchema: responseSchema,
    temperature: 0.2
  };

  if (isPro) {
    config.tools = [{ googleSearch: {} }];
  }

  const parts: any[] = [{ text: contextPrompt }];
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
    throw new Error("Formatting error. AI response could not be parsed.");
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
