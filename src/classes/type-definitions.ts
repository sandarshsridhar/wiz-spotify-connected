
export type Ran<T extends number> = number extends T ? number : _Range<T, []>;
type _Range<T extends number, R extends unknown[]> = R['length'] extends T ? R[number] : _Range<T, [R['length'], ...R]>;

export type Bulb = {
  state: boolean,
  color?: {
    red: number,
    green: number,
    blue: number,
  },
  coldWhite?: number,
  warmWhite?: number,
  brightness?: number,
  temp?: number
}

export type Beats = {
  beatsPerSec: number;
  relativeLoudness: number;
  key: Ran<12>;
};

export enum ColorSpace {
  purple,
  pink,
  red,
  orange,
  yellow,
  green,
  blue
}

export type Color = {
  red: number;
  green: number;
  blue: number;
}

export type Lights = {
  delayMs: number;
  colorSpace: ColorSpace,
  brightness: number;
}

export enum LogOutput {
  console,
  file
}
