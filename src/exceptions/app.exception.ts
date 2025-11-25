import { ErrorCode } from "./error-code";



export class AppException extends Error {
  constructor(public readonly code: ErrorCode) {
    super();
  }
}