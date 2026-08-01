import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Car, Ban, Waves, Shield, Hammer, AlertTriangle, MoreHorizontal, Flame } from 'lucide-react';
import { VibeCheckIcon } from '../components/VibeCheckIcon';

export interface IncidentCategory {
  id: string;
  iconName: string;
  color: string;
  bg: string;
}

const DEFAULT_CATEGORIES: IncidentCategory[] = [
  { id: 'Traffic Jam', iconName: 'Car', color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'Accident', iconName: 'Car', color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'Road Closed', iconName: 'Ban', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'Flood', iconName: 'Waves', color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'Vibe Check', iconName: 'Shield', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'Construction', iconName: 'Hammer', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'Hazard', iconName: 'Flame', color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'Other', iconName: 'MoreHorizontal', color: 'text-gray-600', bg: 'bg-gray-100' }
];

export const incidentIconMap: Record<string, any> = {
  Car,
  Ban,
  Waves,
  Shield,
  Hammer,
  AlertTriangle,
  MoreHorizontal,
  Flame,
  Fire: Flame
};

export function useIncidentCategories() {
  const [categories, setCategories] = useState<IncidentCategory[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('incident_categories')
          .select('value, icon_name, color_class, bg_class')
          .order('display_order');
          
        if (data && data.length > 0 && !error) {
          const mapped = data.map(d => ({
            id: d.value,
            iconName: d.icon_name || 'MoreHorizontal',
            color: d.color_class,
            bg: d.bg_class
          }));
          setCategories(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch incident categories', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return { categories, loading };
}
