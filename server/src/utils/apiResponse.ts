/**
 * API Response Utility
 * Chức năng: Định nghĩa cấu trúc chuẩn cho các phản hồi từ API (thành công/thất bại).
 */
/**
 * Standard API Response Format cho Android + Web Client
 * Giúp client dễ dàng parse response và xử lý error
 */

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Success Response
 * @example
 * res.json(sendSuccess(data, 'User created', 201));
 */
export const sendSuccess = <T>(
  data: T,
  message: string = "Success",
  statusCode: number = 200,
): ApiResponse<T> => ({
  success: true,
  statusCode,
  message,
  data,
  timestamp: new Date().toISOString(),
});

/**
 * Error Response
 * @example
 * res.status(400).json(sendError('Invalid email', 400));
 */
export const sendError = (
  error: string,
  statusCode: number = 500,
  message?: string,
): ApiResponse => ({
  success: false,
  statusCode,
  message: message || "Error",
  error,
  timestamp: new Date().toISOString(),
});

/**
 * Pagination Response
 * @example
 * res.json(sendPaginated(items, total, page, limit));
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export const sendPaginated = <T>(
  data: T[],
  total: number,
  page: number = 1,
  limit: number = 10,
  message: string = "Success",
): PaginatedResponse<T> => {
  const pages = Math.ceil(total / limit);
  return {
    success: true,
    statusCode: 200,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      pages,
    },
    timestamp: new Date().toISOString(),
  } as any;
};
