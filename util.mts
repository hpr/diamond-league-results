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

export const markToSecs = (mark: string) => {
  if (mark.includes('(')) mark = mark.slice(0, mark.indexOf('(')).trim();
  mark = mark.replaceAll('h', '').replaceAll('+', '').replaceAll('*', '').trim();
  const groups = mark.split(':');
  let res: string | number = 0;
  if (groups.length === 1) res = +mark;
  if (groups.length === 2) res = +groups[0] * 60 + +groups[1];
  if (groups.length === 3) res = +groups[0] * 60 * 60 + +groups[1] * 60 + +groups[2];
  res = String(Math.round(res * 100) / 100);
  if (res.includes('.')) return res.slice(0, res.lastIndexOf('.') + 3);
  return res;
};
