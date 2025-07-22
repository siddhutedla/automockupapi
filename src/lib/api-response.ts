import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ApiResponseHandler {
  static success<T>(data: T, message?: string, requestId?: string): NextResponse<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId
    };

    return NextResponse.json(response, { status: 200 });
  }

  static error(message: string, statusCode: number = 400, requestId?: string): NextResponse<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
      requestId
    };

    return NextResponse.json(response, { status: statusCode });
  }

  static validationError(errors: string[], requestId?: string): NextResponse<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      error: 'Validation failed',
      message: errors.join(', '),
      timestamp: new Date().toISOString(),
      requestId
    };

    return NextResponse.json(response, { status: 422 });
  }

  static notFound(message: string = 'Resource not found', requestId?: string): NextResponse<ApiResponse> {
    return this.error(message, 404, requestId);
  }

  static unauthorized(message: string = 'Unauthorized', requestId?: string): NextResponse<ApiResponse> {
    return this.error(message, 401, requestId);
  }

  static forbidden(message: string = 'Forbidden', requestId?: string): NextResponse<ApiResponse> {
    return this.error(message, 403, requestId);
  }

  static serverError(message: string = 'Internal server error', requestId?: string): NextResponse<ApiResponse> {
    return this.error(message, 500, requestId);
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    requestId?: string
  ): NextResponse<PaginatedResponse<T>> {
    const totalPages = Math.ceil(total / limit);
    
    const response: PaginatedResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    return NextResponse.json(response, { status: 200 });
  }
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateRequiredFields(data: Record<string, unknown> | { [key: string]: unknown } | unknown, requiredFields: string[]): string[] {
  const errors: string[] = [];
  
  // Type guard to ensure data is an object
  if (typeof data !== 'object' || data === null) {
    return requiredFields.map(field => `${field} is required`);
  }
  
  const dataObj = data as Record<string, unknown>;
  
  for (const field of requiredFields) {
    if (!dataObj[field] || (typeof dataObj[field] === 'string' && dataObj[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  }
  
  return errors;
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
} 