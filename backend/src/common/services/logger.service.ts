import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

/**
 * Winston Logger Service
 * Provides structured logging with file rotation, separate error logs,
 * and request ID tracking.
 */
@Injectable()
export class WinstonLoggerService implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    const logLevel = process.env.LOG_LEVEL || 'debug';
    const logPath = process.env.LOG_FILE_PATH || './logs';
    const isDevelopment = process.env.NODE_ENV !== 'production';

    const transports: winston.transport[] = [];

    // Console transport (always enabled in development)
    if (isDevelopment) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.colorize({ all: true }),
            winston.format.printf(({ level, message, timestamp, context, ...meta }) => {
              const contextStr = context ? `[${context}]` : '';
              const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
              return `${timestamp} ${level} ${contextStr} ${message}${metaStr}`;
            }),
          ),
        }),
      );
    } else {
      // Production console - JSON format
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      );
    }

    // Combined log file with rotation
    transports.push(
      new DailyRotateFile({
        filename: `${logPath}/combined-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: process.env.LOG_MAX_SIZE || '20m',
        maxFiles: process.env.LOG_MAX_FILES || '30d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );

    // Error log file with rotation
    transports.push(
      new DailyRotateFile({
        filename: `${logPath}/error-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: process.env.LOG_MAX_SIZE || '20m',
        maxFiles: process.env.LOG_MAX_FILES || '30d',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );

    this.logger = winston.createLogger({
      level: logLevel,
      defaultMeta: {
        service: 'bhd-marketplace-api',
        environment: process.env.NODE_ENV || 'development',
      },
      transports,
      // Handle uncaught exceptions
      exceptionHandlers: [
        new DailyRotateFile({
          filename: `${logPath}/exceptions-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
        }),
      ],
      // Handle unhandled promise rejections
      rejectionHandlers: [
        new DailyRotateFile({
          filename: `${logPath}/rejections-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxFiles: '30d',
        }),
      ],
    });
  }

  log(message: string, context?: string, meta?: Record<string, any>): void {
    this.logger.info(message, { context, ...meta });
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    meta?: Record<string, any>,
  ): void {
    this.logger.error(message, { context, trace, ...meta });
  }

  warn(message: string, context?: string, meta?: Record<string, any>): void {
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: string, context?: string, meta?: Record<string, any>): void {
    this.logger.debug(message, { context, ...meta });
  }

  verbose(message: string, context?: string, meta?: Record<string, any>): void {
    this.logger.verbose(message, { context, ...meta });
  }
}\n