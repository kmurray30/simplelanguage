declare module "kuroshiro" {
  export type KuroshiroConvertOptions = {
    to?: "hiragana" | "katakana" | "romaji";
    mode?: "normal" | "spaced" | "okurigana" | "furigana";
    romajiSystem?: "nippon" | "passport" | "hepburn";
    delimiter_start?: string;
    delimiter_end?: string;
  };

  export default class Kuroshiro {
    constructor();
    init(analyzer: unknown): Promise<void>;
    convert(str: string, options?: KuroshiroConvertOptions): Promise<string>;
  }
}

declare module "kuroshiro-analyzer-kuromoji" {
  export default class KuromojiAnalyzer {
    constructor(options?: { dictPath?: string });
    init(): Promise<void>;
    parse(str: string): Promise<unknown[]>;
  }
}
