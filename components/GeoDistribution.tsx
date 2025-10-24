

import React, { useMemo } from 'react';
import { Proxy } from '../types';
import GlobeIcon from './icons/GlobeIcon';
import InteractiveMap from './InteractiveMap';

interface GeoDistributionProps {
    proxies: Map<string, Proxy>;
    onCountrySelect: (countryCode: string | null) => void;
}

const GeoDistribution: React.FC<GeoDistributionProps> = ({ proxies, onCountrySelect }) => {
    const countryData = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const proxy of proxies.values()) {
            if (proxy.status === 'VALID' && proxy.country) {
                const countryCode = proxy.country;
                counts[countryCode] = (counts[countryCode] || 0) + 1;
            }
        }
        return counts;
    }, [proxies]);

    return (
        <div className="p-4 bg-secondary border border-border-color rounded-lg">
            <h3 className="text-lg font-bold mb-3 text-text-primary flex items-center gap-2">
                <GlobeIcon className="w-5 h-5" />
                Interactive Geo-Distribution
            </h3>
            <p className="text-sm text-text-secondary mb-3">
                Click a country on the map to filter the proxy database. Click the map background to clear.
            </p>
            <div className="h-64 rounded-lg overflow-hidden border border-border-color bg-primary">
                 <InteractiveMap data={countryData} onCountrySelect={onCountrySelect} />
            </div>
        </div>
    );
};

export default GeoDistribution;