import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProjectHome } from "@/components/project/ProjectHome";
import { deriveProjectIntelligence } from "@/domain/project/intelligence";
import { getOwnedProject } from "@/lib/persistence/completion-repository";
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

  const project = await getOwnedProject({ ownerUserId: user.id, projectId });
  if (!project) notFound();

  const referenceDate = new Date();
  const intelligence = deriveProjectIntelligence(project, referenceDate);

  return (
    <AppShell>
      <ProjectHome
        project={{
          ...project,
          blockers: intelligence.blockers,
          nextBestAction: intelligence.nextBestAction,
        }}
        intelligence={intelligence}
        referenceDate={referenceDate}
      />
    </AppShell>
  );
}
