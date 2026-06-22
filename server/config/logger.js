const winston = require('winston');

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

const format = IS_PROD
    ? winston.format.combine(
        winston.format.timestamp(),
        winston.format.json() // Structured JSON logs in production
    )
    : winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
            (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
    );

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (IS_PROD ? 'info' : 'debug'),
    format,
    transports: [
        new winston.transports.Console()
    ]
});

// A stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: (message) => {
        // morgan adds a newline character at the end, so we trim it
        logger.info(message.trim());
    },
};

module.exports = logger;
