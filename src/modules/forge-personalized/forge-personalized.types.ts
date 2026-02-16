export interface ForgePersonalizedRequest {
  url?: string;
  title?: string;
  summary?: string;
  rawContent?: string;
  category?: string;
  themeId: string;
  userId: string;
  productMode?: boolean;
  productDescription?: string;
  ctaText?: string;
}

export interface ForgePersonalizedBatchRequest {
  count: number;
  themeId: string;
  userId: string;
}
