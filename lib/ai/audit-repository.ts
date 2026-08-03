import type { AIActionAuditEvent } from "@/domain/ai/execute-action";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export class AIAuditPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIAuditPersistenceError";
  }
}

export async function recordAIActionAuditEvent(event: AIActionAuditEvent) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("completion_events").insert({
    academic_project_id: event.projectId,
    task_id: event.taskId,
    event_type: event.eventType,
    capability: event.capability,
    policy_rule_ids: event.policyRuleIds,
    provider_id: event.providerId ?? null,
    model_id: event.modelId ?? null,
    authority_type: "SYSTEM_ASSESSED",
    authority_source_label: "Runtime AI policy + execution gate",
    occurred_at: new Date().toISOString(),
  });

  if (error) {
    throw new AIAuditPersistenceError("Could not persist the content-free AI action event.");
  }
}
