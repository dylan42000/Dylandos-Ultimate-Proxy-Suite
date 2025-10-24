


import React, { useMemo } from 'react';
import { Proxy } from '../../types';
import ServerIcon from '../icons/ServerIcon';

interface SubnetAnalysisProps {
    proxies: Map<string, Proxy>;
    onSubnetSelect: (subnet: string) => void;
}

const SubnetAnalysis: React.FC<SubnetAnalysisProps> = ({ proxies, onSubnetSelect }) => {
    const subnetData = useMemo(() => {
        const subnets: Record<string, { total: number, valid: number, scores: number[] }> = {};
        for (const proxy of proxies.values()) {
            const subnetMatch = proxy.id.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3})\./);
            if (subnetMatch) {
                const subnet = `${subnetMatch[1]}.x`;
                if (!subnets[subnet]) subnets[subnet] = { total: 0, valid: 0, scores: [] };
                subnets[subnet].total++;
                if (proxy.status === 'VALID') {
                    subnets[subnet].valid++;
                    if (proxy.qualityScore !== null) subnets[subnet].scores.push(proxy.qualityScore);
                }
            }
        }
        
        return Object.entries(subnets)
            .map(([subnet, data]) => ({
                subnet,
                ...data,
                avgScore: data.scores.length > 0 ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0,
            }))
            .sort((a, b) => b.valid - a.valid)
            .slice(0, 10);

    }, [proxies]);

    return (
        <div className="p-4 bg-secondary border border-border-color rounded-lg h-full flex flex-col">
            <h3 className="text-lg font-bold mb-3 text-text-primary flex items-center gap-2">
                <ServerIcon className="w-5 h-5" />
                Subnet & Provider Analysis
            </h3>
            <div className="flex-grow overflow-y-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-secondary uppercase bg-primary/30 sticky top-0">
                        <tr>
                            <th className="px-4 py-2">Subnet (/24)</th>
                            <th className="px-4 py-2 text-right">Valid</th>
                            <th className="px-4 py-2 text-right">Total</th>
                            <th className="px-4 py-2 text-right">Avg. Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color font-mono">
                        {subnetData.map((data) => (
                            <tr key={data.subnet} className="hover:bg-border-color/20 cursor-pointer" onClick={() => onSubnetSelect(data.subnet)}>
                                <td className="px-4 py-2">{data.subnet}</td>
                                <td className="px-4 py-2 text-right text-success">{data.valid}</td>
                                <td className="px-4 py-2 text-right text-text-secondary">{data.total}</td>
                                <td className="px-4 py-2 text-right text-accent">{data.avgScore.toFixed(0)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {subnetData.length === 0 && <p className="text-center text-sm text-text-secondary p-8">No valid proxies to analyze.</p>}
            </div>
        </div>
    );
};

export default SubnetAnalysis;