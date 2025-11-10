// User Types
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  department?: Department;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  name: string; // Computed property
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  manager?: User;
  createdAt: string;
  updatedAt: string;
}

// Task Types
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum TaskCategory {
  GENERAL = 'GENERAL',
  FINANCIAL = 'FINANCIAL',
  OPERATIONAL = 'OPERATIONAL',
  STRATEGIC = 'STRATEGIC',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string | null;
  createdBy: User;
  assignedTo: User;
  checklistItems?: ChecklistItem[];
  comments?: Comment[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  taskId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  taskId: string;
  uploadedBy: User;
  createdAt: string;
}

// Approval Types
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum ApproverType {
  USER = 'USER',
  ROLE = 'ROLE',
  DEPARTMENT = 'DEPARTMENT',
}

export interface ApprovalStage {
  id: string;
  name: string;
  description?: string;
  order: number;
  approverType: ApproverType;
  approverId: string;
  approver?: User;
  requiredApprovals: number;
  templateId: string;
  createdAt: string;
}

export interface ApprovalTemplate {
  id: string;
  name: string;
  description?: string;
  stages: ApprovalStage[];
  isActive: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  task: Task;
  template: ApprovalTemplate;
  currentStage?: ApprovalStage;
  requestedBy: User;
  approver?: User;
  status: ApprovalStatus;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_CREATED = 'TASK_CREATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  TASK_OVERDUE = 'TASK_OVERDUE',
  APPROVAL_REQUESTED = 'APPROVAL_REQUESTED',
  APPROVAL_APPROVED = 'APPROVAL_APPROVED',
  APPROVAL_REJECTED = 'APPROVAL_REJECTED',
  COMMENT_ADDED = 'COMMENT_ADDED',
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  userId: string;
  taskId?: string;
  approvalId?: string;
  createdAt: string;
  updatedAt: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  departmentId: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Dashboard Types
export interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalApprovals: number;
  pendingApprovals: number;
  approvedApprovals: number;
  rejectedApprovals: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}