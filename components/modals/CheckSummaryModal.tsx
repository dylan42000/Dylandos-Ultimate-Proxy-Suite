
import React from 'react';
import XMarkIcon from '../icons/XMarkIcon';
import { Stats, ProxyType, AnonymityLevel } from '../../types';

interface CheckSummaryModalProps {
    stats: Partial<Stats>;
    onClose: () => void;
}

const StatItem: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="flex justify-between items-baseline py-2 border-b border-border-color">
        <span className="text-text-secondary">{label}</span>
        <span className="font-bold text-lg text-text-primary">{value}</span>
    </div>
);

const CheckSummaryModal: React.FC<CheckSummaryModalProps> = ({ stats, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-secondary p-8 rounded-lg border border-border-color shadow-2xl max-w-md w-full relative transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-bold text-accent mb-4">Check Complete</h2>
                <p className="text-text-secondary mb-6">Here's a summary of the validation results.</p>
                
                <div className="space-y-2">
                    <StatItem label="Valid Proxies" value={stats.valid?.toLocaleString() ?? 0} />
                    <StatItem label="Invalid Proxies" value={stats.invalid?.toLocaleString() ?? 0} />
                    <StatItem label="Average Latency" value={stats.averageLatency ? `${stats.averageLatency.toFixed(0)}ms` : 'N/A'} />
                    <StatItem label="Highest Quality Score" value={stats.topScore ?? 0} />
                    <div className="pt-2 text-sm">
                        <div className="flex justify-between"><span className="text-text-secondary">Elite:</span> <span>{stats.elite?.toLocaleString() ?? 0}</span></div>
                        <div className="flex justify-between"><span className="text-text-secondary">Anonymous:</span> <span>{stats.anonymous?.toLocaleString() ?? 0}</span></div>
                        <div className="flex justify-between"><span className="text-text-secondary">HTTP:</span> <span>{stats[ProxyType.HTTP]?.toLocaleString() ?? 0}</span></div>
                        <div className="flex justify-between"><span className="text-text-secondary">HTTPS:</span> <span>{stats[ProxyType.HTTPS]?.toLocaleString() ?? 0}</span></div>
                        <div className="flex justify-between"><span className="text-text-secondary">SOCKS4:</span> <span>{stats[ProxyType.SOCKS4]?.toLocaleString() ?? 0}</span></div>
                        <div className="flex justify-between"><span className="text-text-secondary">SOCKS5:</span> <span>{stats[ProxyType.SOCKS5]?.toLocaleString() ?? 0}</span></div>
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="mt-8 w-full bg-accent text-primary font-bold py-3 rounded-lg hover:brightness-110 transition-colors"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default CheckSummaryModal;