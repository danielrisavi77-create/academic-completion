import type { AICapability, PolicyConditionCode } from "@/domain/policy/types";

export type AIProviderRequest = {
  capability: AICapability;
  taskTitle: string;
  userInput: string;
  obligations: PolicyConditionCode[];
  systemInstructions: string[];
};

export type AIProviderResponse = {
  text: string;
  providerId: string;
  modelId: string;
};

export interface AIProvider {
  execute(request: AIProviderRequest): Promise<AIProviderResponse>;
}
