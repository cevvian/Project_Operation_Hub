export interface ApiResponse<T = any> {
  code: number;
  message: string;
  result?: T;
}