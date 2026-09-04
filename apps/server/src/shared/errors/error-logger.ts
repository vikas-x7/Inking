/**
 * Centralized structured error logging.
 *
 * Every entry is emitted as a single JSON line so log aggregators can parse it.
 * The supported levels mirror the requirements:
 * - warn   expected operational errors (validation, not-found, 401s, ...)
 * - error  unexpected errors (internal server errors, database faults)
 * - fatal  process-level failures that precede a shutdown
 *
 * Safety contract: this logger is only ever given fields it is designed to log.
 * Do not pass headers, cookies, tokens, passwords, database URLs, or raw
 * LaTeX content here.
 */

export type LogLevel = 'warn' | 'error' | 'fatal';

export type ErrorLogFields = {
  level: LogLevel;
  message: string;
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  errorCode?: string;
  errorName?: string;
  userId?: string;
  service?: string;
  durationMs?: number;
  isRetryable?: boolean;
  stack?: string;
};

const MAX_VALUE_LENGTH = 2_000;

const serialize = (fields: ErrorLogFields): Record<string, unknown> => {
  const entry: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level: fields.level,
    message: truncate(fields.message, MAX_VALUE_LENGTH),
  };

  for (const key of [
    'requestId',
    'method',
    'path',
    'statusCode',
    'errorCode',
    'errorName',
    'userId',
    'service',
    'durationMs',
    'isRetryable',
    'stack',
  ] as const) {
    const value = fields[key];
    if (value === undefined || value === null || value === '') continue;
    entry[key] = typeof value === 'string' ? truncate(value, MAX_VALUE_LENGTH) : value;
  }

  return entry;
};

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max)}…(truncated)` : value;

const write = (fields: ErrorLogFields) => {
  const line = JSON.stringify(serialize(fields));
  if (fields.level === 'error' || fields.level === 'fatal') {
    console.error(line);
  } else if (fields.level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
};

export const errorLogger = {
  log: write,
  warn: (fields: Omit<ErrorLogFields, 'level'>) => write({ ...fields, level: 'warn' }),
  error: (fields: Omit<ErrorLogFields, 'level'>) => write({ ...fields, level: 'error' }),
  fatal: (fields: Omit<ErrorLogFields, 'level'>) => write({ ...fields, level: 'fatal' }),
};
