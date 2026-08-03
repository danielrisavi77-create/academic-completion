import type { AuthorityRef } from "@/domain/authority/authority";
import type { AICapability } from "@/domain/policy/types";

export type NextActionRoute =
  | "IN_APP_TASK"
  | "AI_ACTION"
  | "KATEDRA_HANDOFF"
  | "LEKTA_HANDOFF"
  | "WAIT_FOR_EXTERNAL"
  | "OFFICIAL_PROCESS";

export type NextBestAction = {
  actionId: string;
  projectId: string;
  taskId?: string;
  title: string;
  reason: string;
  capability?: AICapability;
  route: NextActionRoute;
  authority: AuthorityRef;
};
