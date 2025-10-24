

import React, { useMemo } from 'react';

// A highly simplified world map SVG for demonstration purposes.
// In a real application, you would use a more detailed map or a library like D3.js.
const WorldMapSVG: React.FC<{onClick: () => void}> = ({ onClick }) => (
    <svg viewBox="0 0 1000 500" className="w-full h-full cursor-pointer" onClick={onClick}>
      <path d="M499.999 499.303c-124.56 0-234.992-49.495-316.666-129.351C101.66 290.096 49.999 181.166 50 75.002 50.001 33.58 83.58 0 125 0h750c41.42 0 75 33.58 75 75.002v.001c-.001 106.164-51.66 215.094-133.333 294.95-81.675 79.856-192.107 129.35-316.668 129.35z" fill="#1a1a2e"/>
      <path d="M125 0h750c41.42 0 75 33.58 75 75.002v.001c-.001 106.164-51.66 215.094-133.333 294.95-81.675 79.856-192.107 129.35-316.668 129.35-124.56 0-234.992-49.495-316.666-129.351C101.66 290.096 49.999 181.166 50 75.002 50.001 33.58 83.58 0 125 0z" stroke="#2d2d3d" strokeWidth="2" fill="none"/>
    </svg>
);

interface InteractiveMapProps {
  data: Record<string, number>;
  onCountrySelect: (countryCode: string | null) => void;
}

// Simple pseudo-mercator projection for mapping lat/lon to SVG coordinates
const project = (lat: number, lon: number): [number, number] => {
  const x = (lon + 180) * (1000 / 360);
  const y = 500 - ((lat + 90) * (500 / 180));
  return [x, y];
};

// A small, non-comprehensive list of country centroids for visualization
const countryCentroids: Record<string, { lat: number, lon: number }> = {
    US: { lat: 39.8, lon: -98.6 },
    CA: { lat: 56.1, lon: -106.3 },
    BR: { lat: -14.2, lon: -51.9 },
    DE: { lat: 51.2, lon: 10.4 },
    FR: { lat: 46.6, lon: 2.2 },
    GB: { lat: 55.4, lon: -3.4 },
    IT: { lat: 41.9, lon: 12.6 },
    ES: { lat: 40.5, lon: -3.7 },
    NL: { lat: 52.1, lon: 5.3 },
    SE: { lat: 60.1, lon: 18.6 },
    RU: { lat: 61.5, lon: 105.3 },
    CN: { lat: 35.9, lon: 104.2 },
    JP: { lat: 36.2, lon: 138.3 },
    IN: { lat: 20.6, lon: 78.9 },
    AU: { lat: -25.3, lon: 133.8 },
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({ data, onCountrySelect }) => {
  const maxCount = useMemo(() => Math.max(1, ...(Object.values(data) as number[])), [data]);

  return (
    <div className="relative w-full h-full">
      <WorldMapSVG onClick={() => onCountrySelect(null)}/>
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 1000 500">
        {(Object.entries(data) as [string, number][]).map(([countryCode, count]) => {
          const centroid = countryCentroids[countryCode];
          if (!centroid) return null;

          const [x, y] = project(centroid.lat, centroid.lon);
          const radius = 3 + (count / maxCount) * 12;

          return (
            <g key={countryCode} transform={`translate(${x}, ${y})`} className="cursor-pointer group pointer-events-auto" onClick={(e) => { e.stopPropagation(); onCountrySelect(countryCode); }}>
                <circle cx="0" cy="0" r={radius} fill="var(--color-accent)" fillOpacity="0.3" className="transition-all group-hover:r-[25]"/>
                <circle cx="0" cy="0" r={radius/2} fill="var(--color-accent)" />
                <title>{`${countryCode}: ${count} proxies`}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default InteractiveMap;