const noop = () => {};

const toConsole = (level) => (payload, message) => {
  const entry = { ...payload };
  if (message) {
    entry.msg = message;
  }
  const log = console[level] ?? console.log;
  log.call(console, entry);
};

const pino = () => ({
  info: toConsole("info"),
  warn: toConsole("warn"),
  error: toConsole("error"),
});

module.exports = pino;
module.exports.default = pino;
