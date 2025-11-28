import { HttpStatus } from '@nestjs/common';

export enum ErrorCode {
  USER_EMAIL_EXISTED = 1001,
  USER_NOT_EXISTED = 1002,
  OTP_INCORRECT = 1003,
  NAME_INVALID = 1004,
  UNAUTHORIZED = 1005,
  INVALID_KEY = 1006,
  USER_USERNAME_EXISTED = 1008,
  USER_PHONE_EXISTED = 1009,
  ONE_OF_USERS_NOT_FOUND = 1010,

  PROJECT_NOT_FOUND = 1700,
  PROJECT_ALREADY_EXISTED = 1701,
  PROJECT_NAME_ALREADY_EXISTED = 1702,
  PROJECT_KEY_ALREADY_EXISTED = 1703,
  PROJECT_NAME_OR_KEY_EXISTED = 1704,
  INVITATION_NOT_FOUND = 1603,
  USER_NOT_MEMBER = 1602,

  TASK_NOT_FOUND = 1800,
  TASK_ALREADY_EXISTED = 1801,
  TASK_KEY_ALREADY_EXISTED = 1802,
  INVALID_TASK_STATUS_TRANSITION = 1803,

  SPRINT_NOT_FOUND = 1900,
  SPRINT_ALREADY_EXISTED = 1901,

  TASK_COMMENT_NOT_FOUND = 2000,
  TASK_COMMENT_ALREADY_EXISTED = 2001,

  ATTACHMENT_NOT_FOUND = 2100,
  ATTACHMENT_ALREADY_EXISTED = 2101,

  BUG_NOT_FOUND = 2200,
  BUG_ALREADY_EXISTED = 2201,

  REPO_NOT_FOUND = 2300,

  COMMIT_NOT_FOUND = 2400,

  PR_NOT_FOUND = 2500,

  TEST_CASE_NOT_FOUND = 2600,

  TEST_RUN_NOT_FOUND = 2700,

  ENVIRONMENT_NOT_FOUND = 2800,

  DEPLOYMENT_NOT_FOUND = 2900,

  BUILD_NOT_FOUND = 3000,

  BRANCH_NOT_FOUND = 4000,

  // github
  GITHUB_API_ERROR = 5001,
  GITHUB_TOKEN_NOT_FOUND = 5002,
  GITHUB_WEBHOOK_CONFIG_INVALID = 5003,
  GITHUB_API_FAIL = 5004,
  GITHUB_USERNAME_NOT_FOUND = 5005,

  // auth
  USER_INACTIVE = 5100,
  PASSWORD_INCORRECT = 5102,
  INVALID_TOKEN = 5103,
  ALREADY_VERIFIED = 5104,
  CREATE_FAILED = 5105,
  REFRESH_TOKEN_REQUIRED = 5106,  

  INVALID_UUID_FORMAT = 9997,
  DELETE_FAIL = 9998,
  UNCATEGORIZED_EXCEPTION = 9999,
}

export const ErrorMessage: Record<ErrorCode, string> = {
  [ErrorCode.USER_EMAIL_EXISTED]: 'Email already exists',
  [ErrorCode.USER_NOT_EXISTED]: 'User not exists',
  [ErrorCode.OTP_INCORRECT]: 'OTP incorrect',
  [ErrorCode.NAME_INVALID]: 'Name must be at least 5 characters',
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized',
  [ErrorCode.INVALID_KEY]: 'Invalid key',
  [ErrorCode.USER_USERNAME_EXISTED]: 'Username already exists',
  [ErrorCode.USER_PHONE_EXISTED]: 'Phone number already exists',
  [ErrorCode.ONE_OF_USERS_NOT_FOUND]: 'One or more users do not exist',

  [ErrorCode.PROJECT_NOT_FOUND]: 'Project not exists',
  [ErrorCode.PROJECT_ALREADY_EXISTED]: 'Project already eixsted',
  [ErrorCode.PROJECT_NAME_ALREADY_EXISTED]: 'Project name already eixsted',
  [ErrorCode.PROJECT_KEY_ALREADY_EXISTED]: 'Project key already eixsted',
  [ErrorCode.PROJECT_NAME_OR_KEY_EXISTED]: 'Project key or name already existed',
  [ErrorCode.INVITATION_NOT_FOUND]: 'Invitation not found',
  [ErrorCode.USER_NOT_MEMBER]: 'User is not a member of this project',

  [ErrorCode.TASK_NOT_FOUND]: 'Task not exists',
  [ErrorCode.TASK_ALREADY_EXISTED]: 'Task already eixsted',
  [ErrorCode.TASK_KEY_ALREADY_EXISTED]: 'Task key already eixsted',
  [ErrorCode.INVALID_TASK_STATUS_TRANSITION]: 'Cant move from this status to new status',

  [ErrorCode.SPRINT_NOT_FOUND]: 'Sprint not exists',
  [ErrorCode.SPRINT_ALREADY_EXISTED]: 'Sprint already eixsted',

  [ErrorCode.TASK_COMMENT_NOT_FOUND]: 'Task comment not exists',
  [ErrorCode.TASK_COMMENT_ALREADY_EXISTED]: 'Task comment already eixsted',

  [ErrorCode.ATTACHMENT_NOT_FOUND]: 'Attachment not exists',
  [ErrorCode.ATTACHMENT_ALREADY_EXISTED]: 'Attachment already eixsted',

  [ErrorCode.BUG_NOT_FOUND]: 'Bug not exists',
  [ErrorCode.BUG_ALREADY_EXISTED]: 'Bug already eixsted',

  [ErrorCode.REPO_NOT_FOUND]: 'Repo not exists',

  [ErrorCode.COMMIT_NOT_FOUND]: 'Commit not exists',

  [ErrorCode.PR_NOT_FOUND]: 'Pull request not exists',

  [ErrorCode.TEST_CASE_NOT_FOUND]: 'Test case not exists',

  [ErrorCode.TEST_RUN_NOT_FOUND]: 'Test run not exists',

  [ErrorCode.ENVIRONMENT_NOT_FOUND]: 'Environment not exists',

  [ErrorCode.DEPLOYMENT_NOT_FOUND]: 'Deployment not exists',

  [ErrorCode.BUILD_NOT_FOUND]: 'Build not exists',

  [ErrorCode.BRANCH_NOT_FOUND]: 'Branch not exists',
  
  [ErrorCode.GITHUB_API_ERROR]: 'GitHub API error - check organization name and token permissions',
  [ErrorCode.GITHUB_TOKEN_NOT_FOUND]: 'GitHub token not found for organization',
  [ErrorCode.GITHUB_WEBHOOK_CONFIG_INVALID]: 'Webhook URL or secret not set',
  [ErrorCode.GITHUB_API_FAIL]: 'Connect to GitHub failed',
  [ErrorCode.GITHUB_USERNAME_NOT_FOUND]: 'GitHub username not found',

  [ErrorCode.USER_INACTIVE]: 'User account is inactive',
  [ErrorCode.PASSWORD_INCORRECT]: 'Password is incorrect',
  [ErrorCode.INVALID_TOKEN]: 'Invalid or expired token',
  [ErrorCode.ALREADY_VERIFIED]: 'Email already verified',
  [ErrorCode.CREATE_FAILED]: 'Create account admin failed',
  [ErrorCode.REFRESH_TOKEN_REQUIRED]: 'Refresh token is required',

  [ErrorCode.INVALID_UUID_FORMAT]: 'Invalid ID format',
  [ErrorCode.DELETE_FAIL]: 'Delete failed',
  [ErrorCode.UNCATEGORIZED_EXCEPTION]: 'Uncategorized exception',
};

export const ErrorStatus: Record<ErrorCode, HttpStatus> = {
  [ErrorCode.USER_EMAIL_EXISTED]: HttpStatus.BAD_REQUEST,
  [ErrorCode.USER_NOT_EXISTED]: HttpStatus.NOT_FOUND,
  [ErrorCode.OTP_INCORRECT]: HttpStatus.BAD_REQUEST,
  [ErrorCode.NAME_INVALID]: HttpStatus.BAD_REQUEST,
  [ErrorCode.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.INVALID_KEY]: HttpStatus.BAD_REQUEST,
  [ErrorCode.USER_USERNAME_EXISTED]: HttpStatus.BAD_REQUEST,
  [ErrorCode.USER_PHONE_EXISTED]: HttpStatus.BAD_REQUEST,
  [ErrorCode.ONE_OF_USERS_NOT_FOUND]: HttpStatus.BAD_REQUEST,

  [ErrorCode.PROJECT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.PROJECT_ALREADY_EXISTED]: HttpStatus.CONFLICT,
  [ErrorCode.PROJECT_NAME_ALREADY_EXISTED]: HttpStatus.CONFLICT,
  [ErrorCode.PROJECT_KEY_ALREADY_EXISTED]: HttpStatus.CONFLICT,
  [ErrorCode.PROJECT_NAME_OR_KEY_EXISTED]: HttpStatus.CONFLICT,
  [ErrorCode.INVITATION_NOT_FOUND]: HttpStatus.BAD_REQUEST,
  [ErrorCode.USER_NOT_MEMBER]: HttpStatus.NOT_FOUND,

  [ErrorCode.TASK_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.TASK_ALREADY_EXISTED]: HttpStatus.CONFLICT,
  [ErrorCode.TASK_KEY_ALREADY_EXISTED]: HttpStatus.CONFLICT,
  [ErrorCode.INVALID_TASK_STATUS_TRANSITION]: HttpStatus.CONFLICT,

  [ErrorCode.SPRINT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.SPRINT_ALREADY_EXISTED]: HttpStatus.CONFLICT,

  [ErrorCode.TASK_COMMENT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.TASK_COMMENT_ALREADY_EXISTED]: HttpStatus.CONFLICT,

  [ErrorCode.ATTACHMENT_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.ATTACHMENT_ALREADY_EXISTED]: HttpStatus.CONFLICT,

  [ErrorCode.BUG_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.BUG_ALREADY_EXISTED]: HttpStatus.CONFLICT,

  [ErrorCode.REPO_NOT_FOUND]: HttpStatus.NOT_FOUND,

  [ErrorCode.COMMIT_NOT_FOUND]: HttpStatus.NOT_FOUND,

  [ErrorCode.PR_NOT_FOUND]: HttpStatus.NOT_FOUND,

  [ErrorCode.TEST_CASE_NOT_FOUND]: HttpStatus.NOT_FOUND,

  [ErrorCode.TEST_RUN_NOT_FOUND]: HttpStatus.NOT_FOUND,

  [ErrorCode.ENVIRONMENT_NOT_FOUND]: HttpStatus.NOT_FOUND,

  [ErrorCode.DEPLOYMENT_NOT_FOUND]: HttpStatus.NOT_FOUND,

  [ErrorCode.BUILD_NOT_FOUND]: HttpStatus.NOT_FOUND,

  [ErrorCode.BRANCH_NOT_FOUND]: HttpStatus.NOT_FOUND,

  [ErrorCode.GITHUB_API_ERROR]: HttpStatus.BAD_REQUEST,
  [ErrorCode.GITHUB_TOKEN_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ErrorCode.GITHUB_WEBHOOK_CONFIG_INVALID]: HttpStatus.BAD_REQUEST,
  [ErrorCode.GITHUB_API_FAIL]: HttpStatus.BAD_GATEWAY,
  [ErrorCode.GITHUB_USERNAME_NOT_FOUND]: HttpStatus.NOT_FOUND ,

  [ErrorCode.USER_INACTIVE]: HttpStatus.CONFLICT,
  [ErrorCode.PASSWORD_INCORRECT]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.INVALID_TOKEN]: HttpStatus.UNAUTHORIZED,
  [ErrorCode.ALREADY_VERIFIED]: HttpStatus.CONFLICT,
  [ErrorCode.CREATE_FAILED]: HttpStatus.CONFLICT,
  [ErrorCode.REFRESH_TOKEN_REQUIRED]: HttpStatus.BAD_REQUEST,

  [ErrorCode.INVALID_UUID_FORMAT]: HttpStatus.BAD_REQUEST,
  [ErrorCode.DELETE_FAIL]: HttpStatus.INTERNAL_SERVER_ERROR,
  [ErrorCode.UNCATEGORIZED_EXCEPTION]: HttpStatus.INTERNAL_SERVER_ERROR,
};

//Giải thích:
//BAD_REQUEST (400): Được sử dụng cho các lỗi do dữ liệu đầu vào không hợp lệ hoặc vi phạm yêu cầu của hệ thống (ví dụ: NAME_INVALID, PASSWORD_INVALID, EMAIL_INVALID).
//NOT_FOUND (404): Được sử dụng khi tài nguyên không tồn tại (ví dụ: USER_NOT_EXISTED, CATEGORY_NOT_EXIST).
//CONFLICT (409): Được sử dụng khi có xung đột trong thao tác dữ liệu (ví dụ: EMAIL_EXISTED, CATEGORY_EXISTED).
//FORBIDDEN (403): Được sử dụng khi người dùng không có quyền thực hiện một thao tác (ví dụ: ACCOUNT_BANNED, NOT_ENOUGH_POINT_TO_DOWNLOAD).
//UNAUTHORIZED (401): Được sử dụng khi yêu cầu không được xác thực đúng (ví dụ: UNAUTHENTICATED, PASSWORD_NOT_CORRECT).
//NO_CONTENT (204): Được sử dụng khi không có dữ liệu nào để trả về nhưng yêu cầu đã được xử lý thành công (ví dụ: ACCOUNT_EMPTY, LIST_EMPTY).
//INTERNAL_SERVER_ERROR (500): Được sử dụng cho các lỗi không xác định hoặc lỗi hệ thống bên trong (ví dụ: SEND_EMAIL_FAILED, UNCATEGORIZED_EXCEPTION).
