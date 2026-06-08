import log from 'loglevel';
import env from './env.js';

log.setLevel(env.log_level, false);

export default log;