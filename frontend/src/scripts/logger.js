import log from 'loglevel';

// Set log level based on environment
const NODE_ENV = import.meta.env.VITE_NODE_ENV || 'development';
if (NODE_ENV === 'development') {
    log.setLevel('debug', false);
} else {
    log.setLevel('error', false);
}

// Enable prefixes for better readability (optional but recommended)
//log.enableAll(false);

// Optional: Create a prefixed logger for different modules
export const apiLogger = log.getLogger('API');
export const dbLogger = log.getLogger('DB');
export const uiLogger = log.getLogger('UI');

// Export the main logger
export default log;

log.info(`mode: ${NODE_ENV} logevel: ${log.getLevel()}`);
