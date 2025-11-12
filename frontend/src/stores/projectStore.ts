import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project } from '../types/task';

interface ProjectStore {
  projects: Project[];
  selectedProjectId: string | null;
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  selectProject: (id: string | null) => void;
  getProjectById: (id: string) => Project | undefined;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [
        { id: 'all', name: 'All Tasks', color: '#6366f1' },
        { id: 'default', name: 'General', color: '#8b5cf6' },
      ],
      selectedProjectId: 'all',

      addProject: (project) => {
        const newProject: Project = {
          ...project,
          id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
        set((state) => ({
          projects: [...state.projects, newProject],
        }));
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          selectedProjectId:
            state.selectedProjectId === id ? 'all' : state.selectedProjectId,
        }));
      },

      selectProject: (id) => {
        set({ selectedProjectId: id });
      },

      getProjectById: (id) => {
        return get().projects.find((p) => p.id === id);
      },
    }),
    {
      name: 'nagrik-projects-store',
    }
  )
);

