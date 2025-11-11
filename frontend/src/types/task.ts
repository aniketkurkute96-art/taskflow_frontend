export type TaskFlag =
  | 'NONE'
  | 'HIGH'
  | 'BLOCKED'
  | 'CLIENT_WAIT'
  | 'INTERNAL_WAIT';

export interface Project {
  id: string;
  name: string;
  key?: string;
  color?: string | null;
  isArchived?: boolean;
}

export interface TaskListQuery {
  projectId?: string;
  q?: string;
  assignees?: string[];
  statuses?: string[];
  flags?: TaskFlag[];
  startFrom?: string;
  startTo?: string;
  endFrom?: string;
  endTo?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export const TASK_FLAGS: readonly TaskFlag[] = [
  'NONE',
  'HIGH',
  'BLOCKED',
  'CLIENT_WAIT',
  'INTERNAL_WAIT',
] as const;


