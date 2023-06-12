import fs from 'fs';

export const range = (start: number, end: number) => {
  return [...Array(end - start + 1)].map((_, i) => start + i);
};

export const write = (fname: string, data: any) =>
  fs.writeFileSync(fname + ".json", JSON.stringify(data, null, 2));
export const read = (fname: string) => {
  try {
    return JSON.parse(fs.readFileSync(fname + ".json", "utf-8") ?? "{}");
  } catch {
    return null;
  }
};
export const exists = (fname: string) => fs.existsSync(fname + ".json");