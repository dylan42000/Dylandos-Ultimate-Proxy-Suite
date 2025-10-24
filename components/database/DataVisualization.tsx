


import React, { useMemo } from 'react';
import { Proxy } from '../../types';

interface DataVisualizationProps {
    proxies: Map<string, Proxy>;
    setExternalFilters: (filters: Record<string, any>) => void;
}

const Chart: React.FC<{ title: string; data: Record<string, number>; onBarClick?: (key: string, value: string) => void }> = ({ title, data, onBarClick }) => {
    const sortedData = useMemo(() => {
        const dataEntries = Object.entries(data) as [string, number][];
        if (title.toLowerCase().includes('latency')) {
            const order = ['< 100ms', '100-300ms', '300-1000ms', '> 1000ms'];
            dataEntries.sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
        } else {
            dataEntries.sort(([, a], [, b]) => b - a);
        }
        return dataEntries.slice(0, 5);
    }, [data, title]);

    const maxVal = useMemo(() => Math.max(1, ...sortedData.map(([, val]) => val)), [sortedData]);

    return (
        <div className="p-4 bg-primary/30 border border-border-color rounded-lg h-full flex flex-col">
            <h4 className="text-md font-bold text-text-primary mb-3">{title}</h4>
            <div className="flex-grow space-y-2 text-xs">
                {sortedData.map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 group" onClick={() => onBarClick && onBarClick(title.toLowerCase().includes('country') ? 'country' : 'isp', key)} >
                        <span className="w-24 truncate text-text-secondary text-right" title={key}>{key}</span>
                        <div className={`flex-grow bg-border-color rounded-full h-4 ${onBarClick ? 'cursor-pointer' : ''}`}>
                            <div
                                className="bg-accent h-4 rounded-full text-primary text-center font-bold flex items-center justify-center transition-all duration-500 group-hover:brightness-125"
                                style={{ width: `${(value / maxVal) * 100}%` }}
                            >
                               {value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const DataVisualization: React.FC<DataVisualizationProps> = ({ proxies, setExternalFilters }) => {
    const validProxies = useMemo(() => Array.from(proxies.values()).filter((p: Proxy) => p.status === 'VALID'), [proxies]);

    const countryData = useMemo(() => validProxies.reduce((acc, p) => { if (p.country) acc[p.country] = (acc[p.country] || 0) + 1; return acc; }, {} as Record<string, number>), [validProxies]);
    const ispData = useMemo(() => validProxies.reduce((acc, p) => { if (p.isp) acc[p.isp] = (acc[p.isp] || 0) + 1; return acc; }, {} as Record<string, number>), [validProxies]);
    const latencyData = useMemo(() => validProxies.reduce((acc, p) => { if (p.latency !== null) { if (p.latency < 100) acc['< 100ms'] = (acc['< 100ms'] || 0) + 1; else if (p.latency < 300) acc['100-300ms'] = (acc['100-300ms'] || 0) + 1; else if (p.latency < 1000) acc['300-1000ms'] = (acc['300-1000ms'] || 0) + 1; else acc['> 1000ms'] = (acc['> 1000ms'] || 0) + 1; } return acc; }, {} as Record<string, number>), [validProxies]);

    const handleBarClick = (filterKey: string, filterValue: string) => {
        if (filterKey === 'isp') {
            setExternalFilters({ searchText: filterValue });
        } else {
            setExternalFilters({ [filterKey]: filterValue });
        }
    };

    return (
        <div className="p-4">
            <h3 className="text-xl font-bold mb-4">Database Analytics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Chart title="Top Countries" data={countryData} onBarClick={handleBarClick} />
                <Chart title="Top ISPs" data={ispData} onBarClick={handleBarClick} />
                <Chart title="Latency Distribution" data={latencyData} />
            </div>
        </div>
    );
};

export default DataVisualization;