// @ts-nocheck
type TLevel = "error" | "warn" | "log" | "info";

const levels: Array<TLevel> = ["error", "warn", "log", "info"];
let level: TLevel = "log";

type Ilogger = Record<TLevel,  (...args: Array<string>) => void>;

function debug(method, ...args) {
  if (
    levels.indexOf(method) <= levels.indexOf(level) &&
    process.env.NODE_ENV !== "production"
  ) {
    console[method](...args); // eslint-disable-line no-console
  }
}

function namespace(ns: string): Ilogger {
  return levels.reduce((logger, method) => {
    logger[method] = debug.bind(console, method, ns);

    return logger;
  }, {} as Ilogger);
}

namespace.level = (newLevel) => {
  level = newLevel;
};
debug.level = namespace.level;

export default namespace;
