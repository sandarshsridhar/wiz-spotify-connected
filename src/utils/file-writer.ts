import { WriteStream } from 'node:fs';
import * as fs from 'node:fs/promises';

export class FileWriter {
    private fileHandler: fs.FileHandle;
    private fileStream: WriteStream;

    public async create(path: string): Promise<void> {
        this.fileHandler = await fs.open(path, 'w');
        this.fileStream = this.fileHandler.createWriteStream({
            autoClose: false
        });
        this.fileStream.write(JSON.stringify({
            message: 'START',
            timestamp: new Date().toUTCString()
        }, null, 2));
    }

    public async append(str: string, optionalParams?: any[]): Promise<void> {
        let textToWrite: { message: any, args?: any[] } = {
            message: str
        };

        if (optionalParams && optionalParams.length > 0) {
            textToWrite.args = optionalParams;
        }

        this.fileStream.write(JSON.stringify(textToWrite, null, 2));
    }
}
