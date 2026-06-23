export class Logger {
  constructor(private context: string) {}

  private format(level: 'info' | 'warn' | 'error', message: string, meta?: any): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...(meta ? { meta } : {}),
    });
  }

  info(message: string, meta?: any): void {
    console.log(this.format('info', message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.format('warn', message, meta));
  }

  error(message: string, error?: any, meta?: any): void {
    const errorDetails = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
    console.error(this.format('error', message, { error: errorDetails, ...meta }));
  }
}
