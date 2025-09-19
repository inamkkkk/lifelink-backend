const chalk = require('chalk');

const logger = {
  info: (message) => console.log(chalk.blue(`[INFO] ${new Date().toISOString()}: ${message}`)),
  warn: (message) => console.log(chalk.yellow(`[WARN] ${new Date().toISOString()}: ${message}`)),
  error: (message, error = null) => {
    console.error(chalk.red(`[ERROR] ${new Date().toISOString()}: ${message}`));
    if (error) {
      // Log the error stack trace or the error object itself if no stack is available.
      console.error(chalk.red(error.stack || error));
    }
  },
  debug: (message) => {
    // Only log debug messages in development environment.
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.magenta(`[DEBUG] ${new Date().toISOString()}: ${message}`));
    }
  },
};

module.exports = logger;