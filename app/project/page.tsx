import { AppShell } from "@/components/AppShell";
import { ProjectHome } from "@/components/project/ProjectHome";
import { buildFpzgDemoProject } from "@/data/demo/fpzg-project";
import { deriveProjectIntelligence } from "@/domain/project/intelligence";

export default function ProjectPage() {
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
