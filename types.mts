export type MeetOption = {
  label: string;
  path: string;
  selected: boolean;
  hasResults: boolean;
};
export type Result = {
  place?: string;
  athlete?: string;
  id?: string;
  nat?: string;
  birthYear?: number;
  mark?: string;
  doping?: string;
};
export type Heat = {
  category: string;
  title: string;
  detail: string;
  data: Result[];
};
