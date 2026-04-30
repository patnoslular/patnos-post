export interface NewsItem {
  id: string;
  title: {
    tr: string;
    ku: string;
  };
  content: {
    tr: string;
    ku: string;
  };
  category: string;
  author: string;
  date: string;
  imageUrl: string;
  readTime: string;
  status?: 'published' | 'draft';
  isBreaking?: boolean;
  updatedAt?: string;
}

export interface HeaderSettings {
  logoUrl?: string;
  siteName: string;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
}
