/**
 * CENTRALIZED ERROR HANDLING UTILITIES
 *
 * Provides consistent error handling across the application with:
 * - User-friendly messages
 * - Detailed console logging for debugging
 * - Specific handling for common Supabase errors
 */

import type { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
  message: string;
  code?: string;
  details?: any;
  userMessage: string;
}

/**
 * Formats a Supabase Postgrest error into a user-friendly message
 */
export function handleSupabaseError(error: PostgrestError, context: string): AppError {
  console.error(`[${context}] Supabase error:`, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });

  let userMessage = 'An unexpected error occurred. Please try again.';

  // RLS Permission Errors
  if (error.code === '42501') {
    userMessage = 'You do not have permission to perform this action.';
    console.error(`[${context}] RLS policy denied operation - Policy may need adjustment`);
  }
  // Duplicate Key Errors
  else if (error.code === '23505') {
    userMessage = 'This item already exists. Please use a different name or identifier.';
    console.error(`[${context}] Duplicate key violation`);
  }
  // Foreign Key Violations
  else if (error.code === '23503') {
    userMessage = 'Cannot complete operation - related item not found.';
    console.error(`[${context}] Foreign key constraint violation`);
  }
  // Not Null Violations
  else if (error.code === '23502') {
    userMessage = 'Required field is missing. Please fill in all required fields.';
    console.error(`[${context}] Not null constraint violation`);
  }
  // Check Constraint Violations
  else if (error.code === '23514') {
    userMessage = 'Invalid value provided. Please check your input.';
    console.error(`[${context}] Check constraint violation`);
  }
  // Connection/Network Errors
  else if (error.message?.toLowerCase().includes('network') ||
           error.message?.toLowerCase().includes('connection')) {
    userMessage = 'Network error. Please check your connection and try again.';
    console.error(`[${context}] Network/connection error`);
  }
  // Generic database errors with custom message
  else if (error.message) {
    userMessage = `Operation failed: ${error.message}`;
  }

  return {
    message: error.message,
    code: error.code,
    details: error.details,
    userMessage,
  };
}

/**
 * Handles auth-specific errors
 */
export function handleAuthError(error: any, context: string): AppError {
  console.error(`[${context}] Auth error:`, error);

  let userMessage = 'Authentication failed. Please try again.';

  if (error.message?.includes('Invalid login credentials')) {
    userMessage = 'Invalid email or password. Please try again.';
  } else if (error.message?.includes('Email not confirmed')) {
    userMessage = 'Please verify your email before logging in.';
  } else if (error.message?.includes('User already registered')) {
    userMessage = 'This email is already registered. Please log in instead.';
  } else if (error.message?.includes('not enabled')) {
    userMessage = 'This login method is not available. Please try another method.';
  } else if (error.message?.includes('Password')) {
    userMessage = 'Password does not meet requirements. Use at least 6 characters.';
  } else if (error.message?.includes('network')) {
    userMessage = 'Network error. Please check your connection and try again.';
  } else if (error.message) {
    userMessage = error.message;
  }

  return {
    message: error.message,
    code: error.code || error.status,
    details: error,
    userMessage,
  };
}

/**
 * Generic error handler for non-Supabase errors
 */
export function handleGenericError(error: any, context: string): AppError {
  console.error(`[${context}] Error:`, error);

  let userMessage = 'An unexpected error occurred. Please try again.';

  if (error instanceof Error) {
    userMessage = error.message;
  } else if (typeof error === 'string') {
    userMessage = error;
  }

  return {
    message: error?.message || String(error),
    code: error?.code,
    details: error,
    userMessage,
  };
}

/**
 * Logs operation start for debugging
 */
export function logOperationStart(operation: string, data?: any) {
  console.log(`[${operation}] Starting...`, data ? { data } : '');
}

/**
 * Logs operation success for debugging
 */
export function logOperationSuccess(operation: string, data?: any) {
  console.log(`[${operation}] Success`, data ? { data } : '');
}

/**
 * Logs operation failure for debugging
 */
export function logOperationFailure(operation: string, error: any) {
  console.error(`[${operation}] Failed:`, error);
}

/**
 * Wraps an async operation with error handling
 */
export async function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  onError?: (error: AppError) => void
): Promise<T | null> {
  logOperationStart(operation);

  try {
    const result = await fn();
    logOperationSuccess(operation);
    return result;
  } catch (error: any) {
    const appError = handleGenericError(error, operation);
    logOperationFailure(operation, appError);

    if (onError) {
      onError(appError);
    }

    return null;
  }
}
