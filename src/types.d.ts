declare module 'google-trends-api' {
  interface TrendsOptions {
    keyword: string;
    geo?: string;
    hl?: string;
    startTime?: Date;
    endTime?: Date;
  }

  function interestOverTime(options: TrendsOptions): Promise<string>;
  function relatedQueries(options: TrendsOptions): Promise<string>;
  function relatedTopics(options: TrendsOptions): Promise<string>;
  function interestByRegion(options: TrendsOptions): Promise<string>;

  export default {
    interestOverTime,
    relatedQueries,
    relatedTopics,
    interestByRegion,
  };
}

declare module 'stopword' {
  export const ptbr: string[];
  export const porBr: string[];
  export function removeStopwords(tokens: string[], stopwords?: string[]): string[];
}
