export enum TaskStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  APPROVAL_PENDING = 'approval_pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export enum AssigneeType {
  USER = 'user',
  DEPARTMENT = 'department'
}

export enum ApprovalType {
  THREE_SIXTY = '360',
  SPECIFIC = 'specific',
  PREDEFINED = 'predefined'
}