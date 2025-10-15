import { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  context?: Record<string, unknown>;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: unknown, context?: Record<string, unknown>): AppError {
    const appError = this.parseError(error, context);
    this.logError(appError);
    return appError;
  }

  private parseError(error: unknown, context?: Record<string, unknown>): AppError {
    const timestamp = new Date();

    if (this.isPostgrestError(error)) {
      return this.handlePostgrestError(error, timestamp, context);
    }

    if (error instanceof Error) {
      return this.handleStandardError(error, timestamp, context);
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: String(error),
      userMessage: 'An unexpected error occurred. Please try again.',
      severity: 'medium',
      timestamp,
      context
    };
  }

  private isPostgrestError(error: unknown): error is PostgrestError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      'details' in error
    );
  }

  private handlePostgrestError(
    error: PostgrestError,
    timestamp: Date,
    context?: Record<string, unknown>
  ): AppError {
    const errorMap: Record<string, { userMessage: string; severity: AppError['severity'] }> = {
      '23505': {
        userMessage: 'This record already exists. Please check your input.',
        severity: 'low'
      },
      '23503': {
        userMessage: 'Cannot complete this action due to related records.',
        severity: 'medium'
      },
      '42501': {
        userMessage: 'You do not have permission to perform this action.',
        severity: 'high'
      },
      'PGRST301': {
        userMessage: 'You do not have permission to access this resource.',
        severity: 'high'
      },
      '23502': {
        userMessage: 'Required fields are missing. Please fill in all required information.',
        severity: 'low'
      },
      '23514': {
        userMessage: 'Invalid data provided. Please check your input.',
        severity: 'low'
      }
    };

    const mappedError = errorMap[error.code] || {
      userMessage: 'Database error occurred. Please try again.',
      severity: 'medium' as const
    };

    return {
      code: error.code,
      message: error.message,
      userMessage: mappedError.userMessage,
      severity: mappedError.severity,
      timestamp,
      context: {
        ...context,
        details: error.details,
        hint: error.hint
      }
    };
  }

  private handleStandardError(
    error: Error,
    timestamp: Date,
    context?: Record<string, unknown>
  ): AppError {
    const errorMap: Record<string, { userMessage: string; severity: AppError['severity'] }> = {
      'Network error': {
        userMessage: 'Network connection lost. Please check your internet connection.',
        severity: 'high'
      },
      'Failed to fetch': {
        userMessage: 'Unable to connect to server. Please try again later.',
        severity: 'high'
      },
      'Timeout': {
        userMessage: 'Request took too long. Please try again.',
        severity: 'medium'
      }
    };

    for (const [key, value] of Object.entries(errorMap)) {
      if (error.message.includes(key)) {
        return {
          code: 'NETWORK_ERROR',
          message: error.message,
          userMessage: value.userMessage,
          severity: value.severity,
          timestamp,
          context
        };
      }
    }

    return {
      code: 'APP_ERROR',
      message: error.message,
      userMessage: 'Something went wrong. Please try again.',
      severity: 'medium',
      timestamp,
      context: {
        ...context,
        stack: error.stack
      }
    };
  }

  private logError(error: AppError): void {
    this.errorLog.push(error);

    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-50);
    }

    if (error.severity === 'critical' || error.severity === 'high') {
      console.error('[CRITICAL ERROR]', {
        code: error.code,
        message: error.message,
        timestamp: error.timestamp,
        context: error.context
      });
    } else {
      console.warn('[ERROR]', {
        code: error.code,
        message: error.message,
        timestamp: error.timestamp
      });
    }
  }

  getRecentErrors(count: number = 10): AppError[] {
    return this.errorLog.slice(-count);
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }

  getErrorStats(): {
    total: number;
    byCode: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const byCode: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    this.errorLog.forEach(error => {
      byCode[error.code] = (byCode[error.code] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });

    return {
      total: this.errorLog.length,
      byCode,
      bySeverity
    };
  }
}

export const handleError = (error: unknown, context?: Record<string, unknown>): AppError => {
  return ErrorHandler.getInstance().handleError(error, context);
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError;
};

export const withErrorHandling = <T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: Record<string, unknown>
): T => {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleError(error, context);
      throw new Error(appError.userMessage);
    }
  }) as T;
};
