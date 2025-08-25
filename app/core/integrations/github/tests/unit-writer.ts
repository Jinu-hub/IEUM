import fs from "node:fs";
import path from "node:path";
import { FileWriter } from "../../../lib/writer";

export function registerWriterTests({ test, assert }: { test: (n: string, f: () => any) => void; assert: (c: unknown, m: string) => void; }) {
  test("FileWriter writes JSON file", async () => {
    const tmpDir = path.join(process.cwd(), ".tmp-test");
    const filename = "out.json";
    const writer = new FileWriter(tmpDir, filename);
    const data = { hello: "world", n: 1 };
    await writer.save(data);
    const full = path.join(tmpDir, filename);
    assert(fs.existsSync(full), "file should exist");
    const content = fs.readFileSync(full, "utf-8");
    const parsed = JSON.parse(content);
    assert(parsed.hello === "world" && parsed.n === 1, "content matches");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
}


