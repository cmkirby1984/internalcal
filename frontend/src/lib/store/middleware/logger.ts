/**
 * Logging Middleware for Zustand
 * Logs actions and state changes in development mode
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Simple logging utility for Zustand stores
 * Usage: Call logStateChange in your store actions when debugging
 */
export const logStateChange = <T>(storeName: string, prevState: T, nextState: T): void => {
  if (!isDevelopment) return;

  console.groupCollapsed(
    `%c${storeName} %cState Change`,
    'color: #9E9E9E; font-weight: bold;',
    'color: #03A9F4; font-weight: bold;'
  );
  console.log('%cPrev State:', 'color: #9E9E9E; font-weight: bold;', prevState);
  console.log('%cNext State:', 'color: #4CAF50; font-weight: bold;', nextState);
  console.groupEnd();
};

/**
 * Create a logging wrapper for store actions
 */
export const createLogger = (storeName: string) => ({
  log: (action: string, data?: unknown) => {
    if (!isDevelopment) return;
    console.log(`[${storeName}] ${action}`, data ?? '');
  },
  error: (action: string, error: unknown) => {
    console.error(`[${storeName}] ${action} failed:`, error);
  },
  warn: (action: string, message: string) => {
    if (!isDevelopment) return;
    console.warn(`[${storeName}] ${action}: ${message}`);
  },
});

// Placeholder export for compatibility
// The devtools middleware from zustand provides better logging
export const logger = {
  log: logStateChange,
  createLogger,
};

