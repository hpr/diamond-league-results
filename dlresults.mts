import { JSDOM } from "jsdom";

type MeetOption = {
  label: string;
  path: string;
  selected: boolean;
  hasResults: boolean;
};
type Heat = {
  category: string;
  title: string;
  detail: string;
  data: HTMLTableElement;
};

const MEET_SELECTOR = "#id2";
const FN_NAME = "onLoad";
const DL_START = 2010;

const meetingIds: { [k: number]: string } = {};
const initialUrl = "https://dl.all-athletics.com/dlra/en/2/1967/all";

const range = (start: number, end: number) => {
  return [...Array(end - start + 1)].map((_, i) => start + i);
};

const getDlResults = async () => {
  const { document } = new JSDOM(await (await fetch(initialUrl)).text()).window;
  const script =
    [...document.querySelectorAll("script")].at(-1)?.textContent ?? "";
  Function(
    "$",
    script + `;${FN_NAME}();`
  )((selector: string) => ({
    athletesSelector: (meets: MeetOption[]) => {
      if (selector === MEET_SELECTOR) {
        for (const { label, path } of meets) {
          const id = path.match(/^en\/(\d+)\/\d+\/all$/)?.[1] ?? NaN;
          meetingIds[id] = label;
        }
      }
    },
  }));
  for (const year of range(DL_START, new Date().getFullYear())) {
    for (const id in meetingIds) {
      const url = `https://dl.all-athletics.com/dlra/en/${id}/${year}/all`;
      console.log(meetingIds[id], url);
      const { document } = new JSDOM(await (await fetch(url)).text()).window;
      const headers = [...document.querySelectorAll("h2")].filter(
        (h2) => h2.nextElementSibling?.tagName === "H2"
      );
      const evts: { [k: string]: Heat[] } = {};
      for (const hdr of headers) {
        const hdrText = hdr.textContent ?? "";
        evts[hdrText] = [];
        let ptr: Element | null | undefined = hdr;
        let heat: Partial<Heat> = {};
        let lastTitle = "";
        while (
          ptr &&
          (ptr === hdr || !headers.includes(ptr as HTMLHeadingElement))
        ) {
          ptr = ptr?.nextElementSibling;
          if (ptr?.tagName === "H2") {
            heat.title = ptr?.textContent ?? "";
            lastTitle = heat.title;
          }
          if (ptr?.tagName === "H3") heat.detail = ptr?.textContent ?? "";
          if (ptr?.tagName === "TABLE") {
            heat.data = ptr as HTMLTableElement;
            heat.title ??= lastTitle;
            heat.category = hdrText;
            evts[hdrText].push(heat as Heat);
            heat = {};
          }
        }
      }
      console.log(evts);
      break;
    }
    break;
  }
};
await getDlResults();
