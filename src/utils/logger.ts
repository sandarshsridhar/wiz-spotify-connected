export class Logger {
  private readonly debugMode: boolean;

  constructor(debugMode: boolean) {
    this.debugMode = debugMode;
  }

  public info(message: string, ...optionalParams: any[]) {
    optionalParams.length > 0 ? console.info(message, optionalParams) : console.info(message);
  }

  public debug(message: string, ...optionalParams: any[]) {
    if (this.debugMode) {
      optionalParams.length > 0 ? console.debug(message, optionalParams) : console.debug(message);
    }
  }

  public warn(message: string, ...optionalParams: any[]) {
    optionalParams.length > 0 ? console.warn(message, optionalParams) : console.warn(message);
  }

  public error(message: string, ...optionalParams: any[]) {
    optionalParams.length > 0 ? console.error(message, optionalParams) : console.error(message);
  }
}
