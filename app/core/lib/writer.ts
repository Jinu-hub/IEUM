import fs from "node:fs";
import path from "node:path";

export interface Writer<T> {
  save(data: T): Promise<void>;
}

export class FileWriter<T> implements Writer<T> {
  constructor(private readonly outDir: string, private readonly filename: string) {}

  async save(data: T): Promise<void> {
    fs.mkdirSync(this.outDir, { recursive: true });
    const outputFile = path.join(this.outDir, this.filename);
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), "utf-8");
  }
}


