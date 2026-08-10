import maplibregl from 'maplibre-gl';

export const renderRiderPresence = (map: maplibregl.Map, riders: any[]) => {
  // Logic to render 48px radial fields
  riders.forEach(rider => {
    const el = document.createElement('div');
    el.className = 'w-[48px] h-[48px] rounded-full pointer-events-auto cursor-pointer';
    el.style.background = 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0) 70%)';
    
    // Core dot
    const dot = document.createElement('div');
    dot.className = 'w-[8px] h-[8px] bg-[#F97316] rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    el.appendChild(dot);

    el.addEventListener('click', () => {
      // Show info
    });

    new maplibregl.Marker({ element: el })
      .setLngLat([rider.lng, rider.lat])
      .addTo(map);
  });
};
