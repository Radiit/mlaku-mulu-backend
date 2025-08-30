export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface BaseResponse<T = any> {
  statusCode: number;
  message: string;
  data: T;
  meta?: any;
  validationErrors?: ValidationError[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> extends BaseResponse<T> {
  meta?: PaginationMeta;
} 