import { WaCalculator } from "@glaivepro/wa-calculator";
import { markToSecs, range, read, write } from "./util.mjs";
import { DL_START } from "./const.mjs";
import { Events, TopScore } from "./types.mjs";
import { stringify } from "csv-stringify/sync";
import fs from "fs";

// write(
//   "disciplines",
//   new WaCalculator({ edition: "2022", gender: "f" }).getDisciplines()
// );
// if (!0) process.exit();

const sexWordToCode = {
  "Men's": "m",
  "Women's": "f",
  "Boy's": "m",
  "Girl's": "f",
};

const disciplineToCode = {
  "100m": "100m",
  "200m": "200m",
  "300m": "300m",
  "400m": "400m",
  // 500m
  "600m": "600m",
  "800m": "800m",
  "1000m": "1000m",
  "1500m": "1500m",
  Mile: "1mile",
  "2000m": "2000m",
  "3000m": "3000m",
  "2 Miles": "2miles",
  "5000m": "5000m",
  "10,000m": "10000m",
  "100mH": "100mh",
  "110mH": "110mh",
  "400mH": "400mh",
  // 2000mSt
  "3000mSC": "3000mSt",
  "4x100m": "4x100m",
  "4x200m": "4x200m",
  "4x400m": "4x400m",
  // 10km
  "15,000m": "15km", // track -> road equivalence?
  "10 Miles": "10miles",
  "20,000m": "20km",
  // half_marathon
  "25,000m": "25km",
  "30,000m": "30km",
  // marathon
  // 100km
  "3000m Race Walk": "3000mW",
  "5000m Race Walk": "5000mW",
  // 10kmW
  // 20kmW
  // 30kmW
  // 35kmW
  // 50kmW
  "High Jump": "high_jump",
  "Pole Vault": "pole_vault",
  "Long Jump": "long_jump",
  "Triple Jump": "triple_jump",
  "Shot Put": "shot_put",
  "Discus Throw": "discus_throw",
  "Hammer Throw": "hammer_throw",
  "Javelin Throw": "javelin_throw",
  // heptathlon
  // decathlon
};

const meetingIds = read("meetingIds");
const rankedMeets: {
  name: string;
  year: number;
  top3: number;
  top8: number;
  topScores: TopScore[];
}[] = [];
for (const id in meetingIds) {
  for (const year of range(DL_START, new Date().getFullYear())) {
    const fname = `data/${year}_${id}`;
    const evts: Events = read(fname);
    if (!evts["Diamond Discipline"]) continue;
    const topScores: TopScore[] = [];
    for (const { title, detail, data, category } of Object.values(
      evts
    ).flat()) {
      const wind = detail.match(/wind: [+-]?([\d\.]+)$/)?.[1];
      if (wind && +wind > 2.0) continue;
      if (category === "Split times") continue;
      const [sexWord, ...rest] = title.split(" ");
      const gender: string = sexWordToCode[sexWord];
      let disciplineWords = rest.join(" ").split(" - ")[0];
      const venueType = disciplineWords.includes("indoor")
        ? "indoor"
        : "outdoor";
      if (venueType === "indoor")
        disciplineWords = disciplineWords
          .split(" ")
          .filter((w) => w !== "indoor")
          .join(" ");
      const discipline: string = disciplineToCode[disciplineWords];
      const calc = new WaCalculator({
        edition: "2022",
        gender,
        venueType,
        discipline,
      });
      const mark = data.find((res) => !res.doping)?.mark ?? "0";
      const score = calc.evaluate(+markToSecs(mark));
      topScores.push({ title, mark, detail, score });
    }
    topScores.sort((a, b) => b.score - a.score);
    const top3 =
      topScores.length >= 3
        ? topScores.slice(0, 3).reduce((acc, x) => acc + x.score, 0)
        : 0;
    const top8 =
      topScores.length >= 8
        ? topScores.slice(0, 8).reduce((acc, x) => acc + x.score, 0)
        : 0;
    if (top3)
      rankedMeets.push({ name: meetingIds[id], year, top3, top8, topScores });
  }
}
rankedMeets.sort((a, b) => b.top3 - a.top3);
write("rankedMeets", rankedMeets);
const csvRankedMeets = rankedMeets.map(
  ({ name, year, top3, top8, topScores }) => {
    const result = {
      name,
      year,
      top3,
      top8,
    };
    for (let i = 0; i < 3; i++) {
      const id = i + 1;
      const { title, mark, score } = topScores[i];
      result["evt" + id] = title.split(" - ")[0];
      result["mark" + id] = mark;
      result["score" + id] = score;
    }
    return result;
  }
);
fs.writeFileSync(
  "rankedMeets.csv",
  stringify(csvRankedMeets, { header: true })
);
