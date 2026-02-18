const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const isProd = process.env.NODE_ENV === 'production';
const logToFile = process.env.LOG_TO_FILE === '1' || process.env.LOG_TO_FILE === 'true';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [
    new transports.Console({
      level: isProd ? 'info' : 'debug',
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const rest = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `[${timestamp}] ${level}: ${message} ${rest}`;
        })
      ),
    }),
    ...(logToFile
      ? [
          new DailyRotateFile({
            filename: 'logs/app-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxFiles: '14d',
            level: 'info',
          }),
        ]
      : []),
  ],
  exitOnError: false,
});

module.exports = logger;
