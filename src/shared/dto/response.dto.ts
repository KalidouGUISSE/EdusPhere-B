export interface ResponseDto<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}
