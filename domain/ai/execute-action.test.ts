import { describe, expect, it } from "vitest";
import { buildFpzgDemoProject } from "@/data/demo/fpzg-project";
import {
  AIActionContractError,
  executeContextualAIAction,
} from "@/domain/ai/execute-action";
import type {
  AIProvider,
  AIProviderRequest,
  AIProviderResponse,
} from "@/domain/ai/provider";
import type { AICapability } from "@/domain/policy/types";
import type { AcademicProject } from "@/domain/project/types";

const now = new Date("2026-08-03T12:00:00Z");

class RecordingProvider implements AIProvider {
  calls: AIProviderRequest[] = [];

  async execute(request: AIProviderRequest): Promise<AIProviderResponse> {
    this.calls.push(structuredClone(request));
    return {
      text: "provider-output-marker",
      providerId: "fake-provider",
      modelId: "fake-model",
      usage: {
        inputTokens: 111,
        outputTokens: 22,
      },
    };
  }
}

function projectWithFirstTaskCapability(capability: AICapability): AcademicProject {
  const project = buildFpzgDemoProject(now);
  const first = project.tasks[0];
  if (!first) throw new Error("Demo task is required for this test.");

  return {
    ...project,
    tasks: [
      { ...first, capability },
      ...project.tasks.slice(1),
    ],
  };
}

describe("contextual AI execution contract", () => {
  it("does not call the provider when FPZG denies submission-text generation", async () => {
    const provider = new RecordingProvider();
    const project = projectWithFirstTaskCapability("GENERATE_SUBMISSION_TEXT");
    const taskId = project.tasks[0]!.id;

    const result = await executeContextualAIAction({
      project,
      taskId,
      capability: "GENERATE_SUBMISSION_TEXT",
      userInput: "Napiši cijelo poglavlje metodologije.",
      provider,
    });

    expect(result.status).toBe("DENIED");
    expect(result.resolution.reason).toBe("OFFICIAL_DENY");
    expect(provider.calls).toHaveLength(0);
    expect(result.auditEvent.eventType).toBe("AI_ACTION_DENIED");
  });

  it("does not call the provider for an UNKNOWN capability", async () => {
    const provider = new RecordingProvider();
    const project = projectWithFirstTaskCapability("STRUCTURE_ASSIST");

    const result = await executeContextualAIAction({
      project,
      taskId: project.tasks[0]!.id,
      capability: "STRUCTURE_ASSIST",
      userInput: "Predloži strukturu rada.",
      provider,
    });

    expect(result.status).toBe("DENIED");
    expect(result.resolution.decision).toBe("UNKNOWN");
    expect(provider.calls).toHaveLength(0);
  });

  it("calls the provider exactly once for an authorized task capability", async () => {
    const provider = new RecordingProvider();
    const project = buildFpzgDemoProject(now);
    const methodologyTask = project.tasks.find(
      (task) => task.capability === "QUESTION_COACHING",
    );
    if (!methodologyTask) throw new Error("Question-coaching demo task missing.");

    const result = await executeContextualAIAction({
      project,
      taskId: methodologyTask.id,
      capability: "QUESTION_COACHING",
      userInput: "Odabrao sam namjerni uzorak jer tražim politički aktivne mlade.",
      provider,
    });

    expect(result.status).toBe("COMPLETED");
    expect(provider.calls).toHaveLength(1);
    expect(provider.calls[0]?.capability).toBe("QUESTION_COACHING");
    expect(provider.calls[0]?.obligations).toContain("ACTIVE_STUDENT_PARTICIPATION_REQUIRED");
    expect(provider.calls[0]?.systemInstructions.join(" ")).toMatch(/questions instead of writing submission-ready/i);
  });

  it("keeps content review scoped to critique instead of replacement prose", async () => {
    const provider = new RecordingProvider();
    const project = buildFpzgDemoProject(now);
    const reviewTask = project.tasks.find((task) => task.capability === "CONTENT_REVIEW");
    if (!reviewTask) throw new Error("Content-review demo task missing.");

    await executeContextualAIAction({
      project,
      taskId: reviewTask.id,
      capability: "CONTENT_REVIEW",
      userInput: "Ovo je moj vlastiti odlomak koji želim kritički provjeriti.",
      provider,
    });

    expect(provider.calls[0]?.systemInstructions.join(" ")).toMatch(/Do not replace the student's argument/i);
  });

  it("rejects a capability that does not match the task contract before provider execution", async () => {
    const provider = new RecordingProvider();
    const project = buildFpzgDemoProject(now);
    const task = project.tasks[0]!;

    await expect(
      executeContextualAIAction({
        project,
        taskId: task.id,
        capability: "LANGUAGE_REVIEW",
        userInput: "Provjeri ovo.",
        provider,
      }),
    ).rejects.toBeInstanceOf(AIActionContractError);

    expect(provider.calls).toHaveLength(0);
  });

  it("rejects AI execution for a non-actionable task state", async () => {
    const provider = new RecordingProvider();
    const project = buildFpzgDemoProject(now);
    const task = project.tasks[0]!;
    const waitingProject: AcademicProject = {
      ...project,
      tasks: project.tasks.map((candidate) =>
        candidate.id === task.id ? { ...candidate, status: "WAITING_EXTERNAL" } : candidate,
      ),
    };

    await expect(
      executeContextualAIAction({
        project: waitingProject,
        taskId: task.id,
        capability: task.capability!,
        userInput: "Nastavi raditi na zadatku.",
        provider,
      }),
    ).rejects.toThrow(/task status/i);

    expect(provider.calls).toHaveLength(0);
  });

  it("rejects empty and oversized content before any provider call", async () => {
    const provider = new RecordingProvider();
    const project = buildFpzgDemoProject(now);
    const task = project.tasks[0]!;

    await expect(
      executeContextualAIAction({
        project,
        taskId: task.id,
        capability: task.capability!,
        userInput: "   ",
        provider,
      }),
    ).rejects.toThrow(/non-empty/i);

    await expect(
      executeContextualAIAction({
        project,
        taskId: task.id,
        capability: task.capability!,
        userInput: "x".repeat(12_001),
        provider,
      }),
    ).rejects.toThrow(/size limit/i);

    expect(provider.calls).toHaveLength(0);
  });

  it("returns a content-free audit event after successful provider execution", async () => {
    const provider = new RecordingProvider();
    const project = buildFpzgDemoProject(now);
    const task = project.tasks[0]!;
    const sensitiveMarker = "SENSITIVE-SESSION-CONTENT";

    const result = await executeContextualAIAction({
      project,
      taskId: task.id,
      capability: task.capability!,
      userInput: sensitiveMarker,
      provider,
    });

    expect(result.status).toBe("COMPLETED");
    expect(JSON.stringify(result.auditEvent)).not.toContain(sensitiveMarker);
    expect(JSON.stringify(result.auditEvent)).not.toContain("provider-output-marker");
    expect(result.auditEvent.providerId).toBe("fake-provider");
    expect(result.auditEvent.modelId).toBe("fake-model");
  });

  it("trims session input before sending it to the provider", async () => {
    const provider = new RecordingProvider();
    const project = buildFpzgDemoProject(now);
    const task = project.tasks[0]!;

    await executeContextualAIAction({
      project,
      taskId: task.id,
      capability: task.capability!,
      userInput: "   moj odgovor   ",
      provider,
    });

    expect(provider.calls[0]?.userInput).toBe("moj odgovor");
  });

  it("blocks obvious personal identifiers before any provider call", async () => {
    const provider = new RecordingProvider();
    const project = buildFpzgDemoProject(now);
    const task = project.tasks[0]!;

    await expect(
      executeContextualAIAction({
        project,
        taskId: task.id,
        capability: task.capability!,
        userInput: "Moj kontakt je student@example.com.",
        provider,
      }),
    ).rejects.toThrow(/cloud processing/i);

    expect(provider.calls).toHaveLength(0);
  });
});
