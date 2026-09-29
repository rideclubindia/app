export const TOMTOM_API_KEY = 'GkjXLzDVKuB5KI8iXmBBYKVtYTDu6LhJ';

export const fetchTomTomRoute = async (coords: number[][], mode: string) => {
  // mode map: foot-walking -> pedestrian, motorcycle -> motorcycle, driving-car -> car, public-transport -> bus
  let travelMode = 'car';
  if (mode === 'foot-walking') travelMode = 'pedestrian';
  if (mode === 'motorcycle') travelMode = 'motorcycle';
  if (mode === 'public-transport') travelMode = 'bus';

  // Deduplicate adjacent coordinates to prevent TomTom 400 errors
  const uniqueCoords = coords.filter((c, i) => {
    if (i === 0) return true;
    const prev = coords[i - 1];
    return c[0] !== prev[0] || c[1] !== prev[1];
  });

  if (uniqueCoords.length < 2) {
    throw new Error('At least two unique locations are required for routing');
  }

  const locationsStr = uniqueCoords.map(c => `${c[1]},${c[0]}`).join(':');
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${locationsStr}/json?key=${TOMTOM_API_KEY}&traffic=true&travelMode=${travelMode}&instructionsType=text`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TomTom API error: ${res.statusText}`);
  }
  const data = await res.json();
  return tomtomToGeoJSON(data);
};

// Main route plus up to `alternatives` alternatives, each as the same GeoJSON Feature shape as fetchTomTomRoute
export const fetchTomTomRoutes = async (coords: number[][], mode: string, alternatives = 2) => {
  const travelMode = mode === 'foot-walking' ? 'pedestrian' : mode === 'motorcycle' ? 'motorcycle' : 'car';
  const unique = coords.filter((c, i) => i === 0 || c[0] !== coords[i - 1][0] || c[1] !== coords[i - 1][1]);
  if (unique.length < 2) throw new Error('At least two unique locations are required for routing');
  const loc = unique.map((c) => `${c[1]},${c[0]}`).join(':');
  // TomTom only returns alternatives for two-point routes
  const alt = unique.length === 2 ? `&maxAlternatives=${alternatives}` : '';
  const res = await fetch(`https://api.tomtom.com/routing/1/calculateRoute/${loc}/json?key=${TOMTOM_API_KEY}&traffic=true&travelMode=${travelMode}&instructionsType=text${alt}`);
  if (!res.ok) throw new Error(`TomTom API error: ${res.statusText}`);
  const data = await res.json();
  return (data.routes || []).map((_: any, i: number) => tomtomToGeoJSON(data, i)).filter(Boolean) as NonNullable<ReturnType<typeof tomtomToGeoJSON>>[];
};

export const tomtomToGeoJSON = (data: any, routeIndex = 0) => {
  if (!data.routes || data.routes.length <= routeIndex) return null;
  const route = data.routes[routeIndex];
  
  let coordinates: number[][] = [];
  if (route.legs) {
    route.legs.forEach((leg: any) => {
      if (leg.points) {
        leg.points.forEach((p: any) => {
          coordinates.push([p.longitude, p.latitude]);
        });
      }
    });
  }

  let steps: any[] = [];
  if (route.guidance && route.guidance.instructions) {
    steps = route.guidance.instructions.map((inst: any, index: number) => {
      const nextInst = route.guidance.instructions[index + 1];
      const dist = nextInst ? (nextInst.routeOffsetInMeters - inst.routeOffsetInMeters) : (route.summary.lengthInMeters - inst.routeOffsetInMeters);
      
      let type = 6; // straight
      const m = inst.maneuver || '';
      if (m.includes('LEFT')) {
        if (m.includes('SHARP')) type = 2;
        else if (m.includes('SLIGHT')) type = 4;
        else type = 0;
      } else if (m.includes('RIGHT')) {
        if (m.includes('SHARP')) type = 3;
        else if (m.includes('SLIGHT')) type = 5;
        else type = 1;
      } else if (m === 'ARRIVE') type = 10;
      
      return {
        distance: dist,
        instruction: inst.message || m,
        type: type,
        way_points: [inst.pointIndex, nextInst ? nextInst.pointIndex : Math.max(0, coordinates.length - 1)]
      };
    });
  }

  return {
    type: 'Feature' as const,
    properties: {
      summary: {
        distance: route.summary.lengthInMeters,
        duration: route.summary.travelTimeInSeconds,
        trafficDelay: route.summary.trafficDelayInSeconds || 0
      },
      segments: [{
        steps: steps
      }],
      legs: route.legs || []
    },
    geometry: {
      type: 'LineString' as const,
      coordinates: coordinates
    },
    bbox: coordinates.length > 0 ? [
      Math.min(...coordinates.map((c: number[]) => c[0])), // minLng
      Math.min(...coordinates.map((c: number[]) => c[1])), // minLat
      Math.max(...coordinates.map((c: number[]) => c[0])), // maxLng
      Math.max(...coordinates.map((c: number[]) => c[1]))  // maxLat
    ] as [number, number, number, number] : undefined
  };
};
