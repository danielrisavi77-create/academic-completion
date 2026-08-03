import type { AcademicProject } from "@/domain/project/types";

export interface ProjectRepository {
  getById(projectId: string): Promise<AcademicProject | null>;
  save(project: AcademicProject): Promise<void>;
  delete(projectId: string): Promise<void>;
}

export class InMemoryProjectRepository implements ProjectRepository {
  private readonly projects = new Map<string, AcademicProject>();

  async getById(projectId: string): Promise<AcademicProject | null> {
    const project = this.projects.get(projectId);
    return project ? structuredClone(project) : null;
  }

  async save(project: AcademicProject): Promise<void> {
    this.projects.set(project.id, structuredClone(project));
  }

  async delete(projectId: string): Promise<void> {
    this.projects.delete(projectId);
  }
}
