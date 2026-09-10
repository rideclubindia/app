import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Car, Ban, Waves, Shield, Hammer, AlertTriangle, MoreHorizontal, Flame,
  Utensils, PartyPopper, Music, ShoppingBag, Fuel, Coffee, CalendarDays,
  ParkingCircle, Store, Drama, Landmark, Pencil
} from 'lucide-react';
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
  Fire: Flame,
  // Custom icons a rider can pick for an "Other" report — the marker on the
  // map uses whichever one they chose instead of a generic fallback.
  Utensils,
  PartyPopper,
  Music,
  ShoppingBag,
  Fuel,
  Coffee,
  CalendarDays,
  ParkingCircle,
  Store,
  Drama,
  Landmark,
  Pencil
};

export interface CustomIconOption {
  key: string;
  label: string;
}

// The picker shown when a rider selects "Other" — keep this list small and
// add to it here as new custom incident types come up.
export const CUSTOM_ICON_OPTIONS: CustomIconOption[] = [
  { key: 'Utensils', label: 'Food' },
  { key: 'PartyPopper', label: 'Festival' },
  { key: 'Music', label: 'Music' },
  { key: 'ShoppingBag', label: 'Shopping' },
  { key: 'Fuel', label: 'Fuel' },
  { key: 'Coffee', label: 'Cafe' },
  { key: 'CalendarDays', label: 'Event' },
  { key: 'ParkingCircle', label: 'Parking' },
  { key: 'Store', label: 'Store' },
  { key: 'Drama', label: 'Entertainment' },
  { key: 'Landmark', label: 'Attraction' },
  { key: 'Pencil', label: 'Custom' },
];

// Every screen that renders a pin (map markers, list rows, detail pages)
// should resolve its icon through this: a custom "Other" report carries its
// own icon_name, everything else falls back to the fixed category icon.
export function resolvePinIcon(
  pin: { category?: string; icon_name?: string | null },
  categories: IncidentCategory[]
): any {
  if (pin.icon_name && incidentIconMap[pin.icon_name]) {
    return incidentIconMap[pin.icon_name];
  }
  const cat = categories.find(c => c.id === pin.category) || categories.find(c => c.id === 'Other');
  return cat ? incidentIconMap[cat.iconName] || MoreHorizontal : MoreHorizontal;
}

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
