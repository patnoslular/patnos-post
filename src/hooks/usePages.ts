import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export interface PageContent {
  id: string;
  title: {
    tr: string;
    ku: string;
  };
  content: {
    tr: string;
    ku: string;
  };
  updatedAt?: string;
}

export const usePages = () => {
  const [pages, setPages] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*');

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePage = async (id: string, updates: Partial<PageContent>) => {
    try {
      const { error } = await supabase
        .from('pages')
        .upsert({
          id,
          ...updates,
          updatedAt: new Date().toISOString()
        });

      if (error) throw error;
      await fetchPages();
    } catch (error) {
      console.error('Error updating page:', error);
      throw error;
    }
  };

  return { pages, loading, updatePage };
};
