import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { HeaderSettings } from '../constants';

const DEFAULT_SETTINGS: HeaderSettings = {
  leftImageUrl: '',
  rightImageUrl: ''
};

export const useSettings = () => {
  const [settings, setSettings] = useState<HeaderSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'header_settings')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      if (data) {
        setSettings(data.value as HeaderSettings);
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('header_settings');
        if (saved) {
          setSettings(JSON.parse(saved));
        }
      }
    } catch (error) {
      console.error('Supabase settings fetch error:', error);
      const saved = localStorage.getItem('header_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: HeaderSettings) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ id: 'header_settings', value: newSettings });

      if (error) throw error;
      
      setSettings(newSettings);
      localStorage.setItem('header_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Supabase settings update error:', error);
      setSettings(newSettings);
      localStorage.setItem('header_settings', JSON.stringify(newSettings));
    }
  };

  return { settings, loading, updateSettings };
};
