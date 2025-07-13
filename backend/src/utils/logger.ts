const logger: {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
} = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

export default logger; 