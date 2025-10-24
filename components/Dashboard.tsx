
import React from 'react';
import { Stats, ProxyType } from '../types';
import ServerIcon from './icons/ServerIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import { formatEtr } from '../lib/utils';

interface DashboardProps {
    stats: Stats;
}

const StatCard: React.FC<{ title: string, value: string | number, icon?: React.ReactNode, colorClass?: string, tooltip?: string }> = ({ title, value, icon, colorClass = 'text-accent', tooltip }) => (
    <div className="bg-secondary p-4 rounded-lg border border-border-color flex items-center gap-4 transition-all hover:border-accent/50" title={tooltip}>
        {icon && <div className={colorClass}>{icon}</div>}
        <div>
            <p className="text-sm text-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-text-primary transition-all duration-300">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
    const latency = stats.averageLatency > 0 ? `${stats.averageLatency.toFixed(0)}ms` : 'N/A';
    
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
            <StatCard title="Total Scraped" value={stats.totalScraped} icon={<ServerIcon className="w-8 h-8"/>} />
            <StatCard title="Unique Proxies" value={stats.unique} icon={<CheckBadgeIcon className="w-8 h-8"/>} />
            <StatCard title="Valid" value={stats.valid} icon={<CheckBadgeIcon className="w-8 h-8"/>} colorClass="text-success" />
            <StatCard title="Invalid" value={stats.invalid} icon={<CheckBadgeIcon className="w-8 h-8"/>} colorClass="text-danger" />
            <StatCard title="Top Score" value={stats.topScore} icon={<span className="text-2xl font-bold">★</span>} colorClass="text-yellow-400" tooltip="Highest Proxy Quality Score" />
            <StatCard title="ETR" value={formatEtr(stats.etr)} icon={<span className="text-lg font-bold">◷</span>} tooltip="Estimated Time Remaining" />
            
            <div className="col-span-2 md:col-span-4 lg:col-span-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                <StatCard title="Avg. Latency" value={latency} icon={<span className="text-lg font-bold">ms</span>} />
                <StatCard title="Elite" value={stats.elite} />
                <StatCard title="Anonymous" value={stats.anonymous} />
                <div className="col-span-2 md:col-span-4 lg:col-span-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-4">
                    <StatCard title="HTTP" value={stats[ProxyType.HTTP]} />
                    <StatCard title="HTTPS" value={stats[ProxyType.HTTPS]} />
                    <StatCard title="SOCKS4" value={stats[ProxyType.SOCKS4]} />
                    <StatCard title="SOCKS5" value={stats[ProxyType.SOCKS5]} />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;