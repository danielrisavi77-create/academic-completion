import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { DisclosureAIAction } from "@/components/ai/DisclosureAIAction";
import { LektaWorkflowPanel } from "@/components/lekta/LektaWorkflowPanel";
import { ProjectHome } from "@/components/project/ProjectHome";
import { ProjectWorkflowControls } from "@/components/project/ProjectWorkflowControls";
import { deriveProjectIntelligence } from "@/domain/project/intelligence";
import { getOwnedProject } from "@/lib/persistence/completion-repository";
import { hydrateProjectWithLekta } from "@/lib/persistence/lekta-projection-repository";
import { requireAuthenticatedUser } from "@/lib/supabase/server";

export default async function PersistentProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await requireAuthenticatedUser();

  if (!user) {
    redirect(`/prijava?next=${encodeURIComponent(`/project/${projectId}`)}`);
  }

  const baseProject = await getOwnedProject({ ownerUserId: user.id, projectId });
  if (!baseProject) notFound();
  const project = await hydrateProjectWithLekta(baseProject);

  const referenceDate = new Date();
  const intelligence = deriveProjectIntelligence(project, referenceDate);
  const disclosureTask = project.tasks.find(
    (task) =>
      task.capability === "DISCLOSURE_HELP" &&
      (task.status === "OPEN" || task.status === "IN_PROGRESS"),
  );

  return (
    <AppShell projectId={project.id}>
      <ProjectHome
        project={{
          ...project,
          blockers: intelligence.blockers,
          nextBestAction: intelligence.nextBestAction,
        }}
        intelligence={intelligence}
        referenceDate={referenceDate}
      />

      <div className="page-frame project-ai-frame">
        <ProjectWorkflowControls
          mentorVersionLabel={project.mentor.lastSentVersionLabel ?? null}
          mentorWaiting={project.mentor.waitingForMentor}
          projectId={project.id}
          tasks={project.tasks}
        />
      </div>

      <div className="page-frame project-ai-frame" id="lekta-workflow">
        <LektaWorkflowPanel projectId={project.id} lekta={project.lekta} />
      </div>

      {disclosureTask ? (
        <div className="page-frame project-ai-frame">
          <DisclosureAIAction
            projectId={project.id}
            taskId={disclosureTask.id}
            taskTitle={disclosureTask.title}
          />
        </div>
      ) : null}
    </AppShell>
  );
}
