import { parse } from "@ctrl/golang-template";
import { promises as fs, existsSync } from "fs";
import { resolve } from "path";

export interface TemplateOptions {
  var: string;
  file: string;
  env: string;
}

export function templateFileLocations(): string[] {
  return [
    resolve(__dirname, "../templates"),
    process.cwd(),
  ];
}

export async function generateTemplate(template: string, options: TemplateOptions): Promise<string> {
  const file = `${template}.tmpl`;
  for (const location of templateFileLocations()) {
    if (!existsSync(resolve(location, file))) continue;
    const contents = await fs.readFile(resolve(location, file), "utf-8");
    return parse(contents, options);
  }
  throw new Error(`No such template: ${file}`);
}
