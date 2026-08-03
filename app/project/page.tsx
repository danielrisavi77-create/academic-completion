import { AppShell } from "@/components/AppShell";
import { ProjectHome } from "@/components/project/ProjectHome";
import { ProjectIndex } from "@/components/project/ProjectIndex";
import { buildFpzgDemoProject } from "@/data/demo/fpzg-project";
import { deriveProjectIntelligence } from "@/domain/project/intelligence";
import { listOwnedCompletionProjects } from "@/lib/persistence/project-index";
import { requireAuthenticatedUser } from "@/lib/supabase/server";

export default async function ProjectPage() {
  const user = await requireAuthenticatedUser();

  if (user) {
    const projects = await listOwnedCompletionProjects(user.id);
    return (
      <AppShell>
        <ProjectIndex projects={projects} />
      </AppShell>
    );
  }

  const referenceDate = new Date();
  const project = buildFpzgDemoProject(referenceDate);
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
        demo
      />
    </AppShell>
  );
}
