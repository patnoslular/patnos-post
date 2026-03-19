import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { NewsItem, NEWS_DATA } from '../constants';

export const useNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetchNews();

    // Real-time subscription
    const channel = supabase
      .channel('news_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'news' }, () => {
        fetchNews();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setNews(data as NewsItem[]);
      } else {
        setNews(NEWS_DATA);
      }
    } catch (error) {
      console.error('Supabase fetch error:', error);
      setNews(NEWS_DATA);
    } finally {
      setLoading(false);
    }
  };

  const addNews = async (item: Omit<NewsItem, 'id'>) => {
    try {
      const { error } = await supabase
        .from('news')
        .insert([{
          ...item,
          createdAt: new Date().toISOString()
        }]);
      
      if (error) throw error;
    } catch (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
  };

  const editNews = async (id: string, item: Partial<NewsItem>) => {
    try {
      const { error } = await supabase
        .from('news')
        .update({
          ...item,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
  };

  const removeNews = async (id: string) => {
    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
  };

  return { news, loading, addNews, editNews, removeNews };
};
