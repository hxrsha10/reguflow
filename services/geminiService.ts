
import { GoogleGenAI, Type } from "@google/genai";
import { ComplianceData } from "../types";

const SYSTEM_INSTRUCTION = `
Role: Universal Business Strategist & Compliance Architect (India)
Expertise: Comprehensive knowledge of Indian Central and State laws (Shop & Establishment, GST, MCA, RBI, MSME, FEMA, Labor Laws, Food Safety/FSSAI, etc.).

Core Mission:
1. Universal Scope: Answer EVERY business-related question. No query is too small (e.g., 'How to open a cigarette stall legally in Mumbai') or too large (e.g., 'Drafting a multi-state holding structure for a fintech conglomerate').
2. Personalized Intelligence (Memory): You are provided with 'Recent Context'. Use this history to provide continuity. If the user previously asked about a startup in Delhi and now asks about scaling to Bangalore, your response must acknowledge the transition and compare regulations.
3. Tier-Specific Detail:
   - FREE: High-quality actionable roadmaps.
   - PRO: Enhanced grounding with live updates and professional depth.
   - PREMIUM: Maximum depth. Include specific section numbers of Indian Acts, audit-readiness checklists, and liability mitigation strategies.

Strict Format: Return ONLY a JSON object. No conversational filler.
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
  
  // Use pro model for paid tiers to provide superior intelligence
  const modelName = isPro ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

  // Construct context-aware prompt
  const contextBlock = history.length > 0 
    ? `USER INTERACTION HISTORY:\n${history.map((q, i) => `${i+1}. ${q}`).join('\n')}\n\nNEW QUERY: ${scenario}`
    : scenario;

  const config: any = {
    systemInstruction: `${SYSTEM_INSTRUCTION}\nACTIVE_TIER: ${tier}`,
    responseMimeType: "application/json",
    responseSchema: responseSchema,
    temperature: 0.25, // Slightly more creative for 'Strategy' while maintaining JSON strictness
  };

  if (isPro) {
    config.tools = [{ googleSearch: {} }];
  }

  const parts: any[] = [{ text: contextBlock }];
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
    throw new Error("AI intelligence formatting error. Please refine your query.");
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
