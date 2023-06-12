import { JSDOM } from "jsdom";
import { read, write, range, exists } from "./util.mjs";
import { Heat, MeetOption, Result } from "./types.mjs";
import { initialUrl, FN_NAME, MEET_SELECTOR, DL_START } from "./const.mjs";

let meetingIds: { [k: number]: string } | null = read("meetingIds");

const parseTable = (tbl: HTMLTableElement): Result[] => {
  return [...tbl.querySelectorAll("tbody tr")].map((tr) => {
    const achiever = tr.querySelector(".achiever");
    const birthYear = +(tr.querySelector(".birthdate")?.textContent ?? NaN);
    const results = tr.querySelectorAll(".result");
    return {
      place: tr.querySelector(".place")?.textContent ?? "",
      athlete: achiever?.textContent ?? "",
      id:
        achiever
          ?.querySelector("a")
          ?.href.match(
            /^http:\/\/www.diamondleague.com\/athletes\/(\d+).htm/
          )?.[1] ?? "",
      nat: tr.querySelector(".nationality")?.textContent ?? "",
      birthYear: birthYear < 100 ? 1900 + birthYear : birthYear,
      mark: results[0]?.textContent ?? "",
      doping: results[1]?.textContent ?? "",
    };
  });
};

const getDlResults = async () => {
  const { document } = new JSDOM(await (await fetch(initialUrl)).text()).window;
  if (!meetingIds) {
    meetingIds = {};
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
            meetingIds![id] = label;
          }
        }
      },
    }));
    write("meetingIds", meetingIds);
  }
  for (const year of range(DL_START, new Date().getFullYear())) {
    for (const id in meetingIds) {
      const fname = `data/${year}_${id}`;
      if (exists(fname)) continue;
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
            heat.data = parseTable(ptr as HTMLTableElement);
            heat.title ??= lastTitle;
            heat.category = hdrText;
            evts[hdrText].push(heat as Heat);
            heat = {};
          }
        }
      }
      console.log(evts);
      write(fname, evts);
    }
  }
};
await getDlResults();
