
import React from 'react';
import { Stats } from '../../types';
import { formatEtr } from '../../lib/utils';

const StatBox: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = 'text-text-primary' }) => (
    <div className="px-4 text-center">
        <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
        <p className="text-xs text-text-secondary uppercase tracking-wider">{label}</p>
    </div>
);

const LiveAnalytics: React.FC<{ stats: Stats }> = ({ stats }) => {
    const { checkedCount, totalToCheck, valid, invalid, proxiesPerSecond, etr } = stats;

    const progress = totalToCheck > 0 ? (checkedCount / totalToCheck) * 100 : 0;

    return (
        <div className="p-4 border-y border-border-color bg-primary/30">
            <div className="w-full bg-secondary rounded-full h-2.5 border border-border-color overflow-hidden relative mb-4">
                <div 
                    className="bg-accent h-full rounded-full transition-all duration-300 ease-linear" 
                    style={{ width: `${progress}%` }}
                />
                 <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary mix-blend-lighten">
                   {progress.toFixed(1)}%
                </span>
            </div>
            <div className="flex justify-around items-center">
                <StatBox label="Checked" value={`${checkedCount.toLocaleString()}/${totalToCheck.toLocaleString()}`} />
                <StatBox label="Valid" value={valid.toLocaleString()} color="text-success" />
                <StatBox label="Invalid" value={invalid.toLocaleString()} color="text-danger" />
                <StatBox label="Throughput" value={`${Math.round(proxiesPerSecond || 0)}/s`} color="text-accent"/>
                <StatBox label="ETR" value={formatEtr(etr)} />
            </div>
        </div>
    );
};

export default LiveAnalytics;
