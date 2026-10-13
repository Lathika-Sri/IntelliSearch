/**
 * Structured console logger for development and production observability.
 */
const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    console.log(`[${timestamp}] [INFO] ${message}${metaStr}`);
  },
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    console.warn(`[${timestamp}] [WARN] ${message}${metaStr}`);
  },
  error: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    console.error(`[${timestamp}] [ERROR] ${message}${metaStr}`);
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      console.debug(`[${timestamp}] [DEBUG] ${message}${metaStr}`);
    }
  }
};

module.exports = logger;
