const chalk = require('chalk'); // Consider adding chalk for colored logs (install it)

const logger = {
  info: (message) => console.log(chalk.blue(`[INFO] ${new Date().toISOString()}: ${message}`)),
  warn: (message) => console.log(chalk.yellow(`[WARN] ${new Date().toISOString()}: ${message}`)),
  error: (message, error = null) => {
    console.error(chalk.red(`[ERROR] ${new Date().toISOString()}: ${message}`));
    if (error) console.error(chalk.red(error.stack || error));
  },
  debug: (message) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.magenta(`[DEBUG] ${new Date().toISOString()}: ${message}`));
    }
  },
};

module.exports = logger;
