export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  QA = 'QA',
  BUG = 'BUG',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

// Quy tắc chuyển trạng thái hợp lệ
export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.REVIEW, TaskStatus.BLOCKED],
  [TaskStatus.REVIEW]: [TaskStatus.QA, TaskStatus.IN_PROGRESS],
  [TaskStatus.QA]: [TaskStatus.DONE, TaskStatus.IN_PROGRESS, TaskStatus.BUG],
  [TaskStatus.BUG]: [],
  [TaskStatus.DONE]: [TaskStatus.DONE],  // DONE không chuyển đi đâu được
  [TaskStatus.BLOCKED]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
};

// Kiểm tra chuyển trạng thái hợp lệ
export function canTransition(current: TaskStatus, next: TaskStatus): boolean {
  return TASK_STATUS_TRANSITIONS[current].includes(next);
}
