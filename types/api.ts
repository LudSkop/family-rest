// Формат помилки бекенда: розгалужуємось за code, не за message
export interface ApiError {
  code: string;
  message: string;
  retry_after?: number;
}
