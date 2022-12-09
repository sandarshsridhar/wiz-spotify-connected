import { LogOutput } from '../classes/type-definitions.js';
import { FileWriter } from './file-writer.js';
import * as path from 'path';

export class Logger {
  private readonly debugMode: boolean;
  private readonly logOutput: LogOutput;
  private readonly fileWriter: FileWriter;

  constructor(_debugMode: boolean, _logOutput: LogOutput, _fileWriter: FileWriter) {
    this.debugMode = _debugMode;
    this.logOutput = _logOutput;
    this.fileWriter = _fileWriter;

    const __dirname = path.resolve();
    _fileWriter.create(path.join(__dirname, 'logs/debug-logs.txt'));
  }

  public info(message: string, ...optionalParams: any[]) {
    if (optionalParams.length > 0) {
      console.info(message, optionalParams);
    } else {
      console.info(message);
    }

    if (this.logOutput === LogOutput.file) {
      this.fileWriter.append(message, optionalParams);
    }
  }

  public debug(message: string, ...optionalParams: any[]) {
    if (this.debugMode) {
      if (this.logOutput === LogOutput.file) {
        this.fileWriter.append(message, optionalParams);
      } else {
        if (optionalParams.length > 0) {
          console.debug(message, optionalParams);
        } else {
          console.debug(message);
        }
      }
    }
  }

  public warn(message: string, ...optionalParams: any[]) {
    if (optionalParams.length > 0) {
      console.warn(message, optionalParams);
    } else {
      console.warn(message);
    }

    if (this.logOutput === LogOutput.file) {
      this.fileWriter.append(message, optionalParams);
    }
  }

  public error(message: string, ...optionalParams: any[]) {
    if (optionalParams.length > 0) {
      console.error(message, optionalParams);
    } else {
      console.error(message);
    }

    if (this.logOutput === LogOutput.file) {
      this.fileWriter.append(message, optionalParams);
    }
  }
}
