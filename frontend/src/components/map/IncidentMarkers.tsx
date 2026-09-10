import React from 'react';
import { createRoot } from 'react-dom/client';
import maplibregl from 'maplibre-gl';
import { AlertTriangle } from 'lucide-react';
import { incidentIconMap, type IncidentCategory } from '../../hooks/useIncidentCategories';

/**
 * Renders a category icon incident marker (white circle + colored icon + pointer tail)
 * and returns the created MapLibre marker.
 */
export function addIncidentMarker(
  map: maplibregl.Map,
  opts: {
    id: string;
    lng: number;
    lat: number;
    category?: string;
    iconName?: string | null;
    categories: IncidentCategory[];
    markersRef: { [key: string]: maplibregl.Marker };
    onClick?: () => void;
  }
): maplibregl.Marker | null {
  if (opts.markersRef[opts.id]) return null;

  const cat = opts.categories.find(c => c.id === opts.category);
  // A custom "Other" report carries its own icon_name; everything else
  // falls back to the fixed category icon.
  const IconComp = (opts.iconName && incidentIconMap[opts.iconName])
    || (cat ? incidentIconMap[cat.iconName] : AlertTriangle);
  const colorClass = cat?.color || 'text-red-500';

  const el = document.createElement('div');
  el.className = 'cursor-pointer hover:scale-110 transition-transform active:scale-95';
  const root = createRoot(el);
  root.render(
    <div className="relative flex flex-col items-center">
      <div className="flex flex-col items-center drop-shadow-md">
        <div className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center bg-white">
          <IconComp className={`w-4 h-4 ${colorClass}`} />
        </div>
        <div className="w-2 h-2 bg-white rotate-45 -mt-1 rounded-[1px] shadow-sm"></div>
      </div>
    </div>
  );

  const marker = new maplibregl.Marker({ element: el })
    .setLngLat([opts.lng, opts.lat])
    .addTo(map);

  if (opts.onClick) {
    marker.getElement().addEventListener('click', opts.onClick);
  }

  opts.markersRef[opts.id] = marker;
  return marker;
}

/** Removes markers whose ids are no longer present in currentIds. */
export function pruneIncidentMarkers(
  markersRef: { [key: string]: maplibregl.Marker },
  currentIds: Set<string>
) {
  Object.keys(markersRef).forEach(id => {
    if (!currentIds.has(id)) {
      markersRef[id].remove();
      delete markersRef[id];
    }
  });
}
