// ===== SEVERITY (String constants) =====
export const AUDIT_SEVERITY = {
    INFO: 'INFO',
    WARN: 'WARN',
    CRITICAL: 'CRITICAL',
} as const;

export type AuditSeverity = (typeof AUDIT_SEVERITY)[keyof typeof AUDIT_SEVERITY];
export const AUDIT_SEVERITY_LIST = Object.values(AUDIT_SEVERITY);

// ===== ACTIONS (String constants - dễ mở rộng) =====
export const AUDIT_ACTIONS = {
    // Auth
    LOGIN_SUCCESS: 'User Login Success',
    LOGIN_FAILED: 'Failed Login Attempt',
    LOGOUT: 'User Logout',
    PASSWORD_CHANGE: 'Password Changed',
    PASSWORD_RESET: 'Password Reset',
    USER_REGISTER: 'User Register',
    GITHUB_LOGIN: 'GitHub Login',
    GOOGLE_LOGIN: 'Google Login',
    GITHUB_CONNECT: 'GitHub Account Connected',

    // User Management
    USER_CREATE: 'Create User',
    USER_UPDATE: 'Update User',
    USER_DELETE: 'Delete User',
    USER_STATUS_CHANGE: 'User Status Changed',

    // Project Management
    PROJECT_CREATE: 'Create Project',
    PROJECT_UPDATE: 'Update Project',
    PROJECT_DELETE: 'Delete Project',
    MEMBER_INVITE: 'Invite Project Member',
    MEMBER_ACCEPT: 'Accept Invitation',
    MEMBER_REMOVE: 'Remove Project Member',

    // Repository
    REPO_CREATE: 'Create Repository',
    REPO_UPDATE: 'Update Repository',
    REPO_DELETE: 'Delete Repository',

    // Sprint
    SPRINT_CREATE: 'Create Sprint',
    SPRINT_UPDATE: 'Update Sprint',
    SPRINT_DELETE: 'Delete Sprint',
    SPRINT_START: 'Start Sprint',
    SPRINT_COMPLETE: 'Complete Sprint',

    // Task
    TASK_CREATE: 'Create Task',
    TASK_UPDATE: 'Update Task',
    TASK_DELETE: 'Delete Task',
    TASK_MOVE: 'Move Task',

    // Task Comment
    COMMENT_CREATE: 'Create Comment',
    COMMENT_UPDATE: 'Update Comment',
    COMMENT_DELETE: 'Delete Comment',

    // Attachment
    ATTACHMENT_UPLOAD: 'Upload Attachment',
    ATTACHMENT_DELETE: 'Delete Attachment',

    // GitHub Integration
    GITHUB_REPO_CREATE: 'Create GitHub Repo',
    GITHUB_BRANCH_CREATE: 'Create Branch',
    GITHUB_PR_CREATE: 'Create Pull Request',

    // Build
    BUILD_TRIGGER: 'Trigger Build',
    BUILD_STATUS_UPDATE: 'Build Status Update',

    // Admin
    ROLE_UPDATE: 'Update Role',
    API_TOKEN_GENERATED: 'API Token Generated',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
export const AUDIT_ACTION_LIST = Object.values(AUDIT_ACTIONS);

// ===== LOG TYPES =====
export const LOG_TYPES = {
    AUTOMATIC: 'automatic',
    CUSTOM: 'custom',
} as const;

export type LogType = (typeof LOG_TYPES)[keyof typeof LOG_TYPES];

// ===== TARGET TYPES =====
export const TARGET_TYPES = {
    USER: 'User',
    PROJECT: 'Project',
    REPO: 'Repo',
    SPRINT: 'Sprint',
    TASK: 'Task',
    TASK_COMMENT: 'TaskComment',
    ATTACHMENT: 'Attachment',
    BRANCH: 'Branch',
    PULL_REQUEST: 'PullRequest',
    BUILD: 'Build',
} as const;

export type TargetType = (typeof TARGET_TYPES)[keyof typeof TARGET_TYPES];
