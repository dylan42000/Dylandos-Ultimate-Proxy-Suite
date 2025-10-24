

import React from 'react';
import { Proxy } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import Sparkline from '../Sparkline';
import { getCountryFlag } from '../../lib/utils';

interface ProxyDetailModalProps {
    proxy: Proxy;
    onClose: () => void;
}

const DetailItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="py-2">
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="text-lg text-text-primary font-mono">{children}</p>
    </div>
);

const ProxyDetailModal: React.FC<ProxyDetailModalProps> = ({ proxy, onClose }) => {
    const getRiskScoreColor = (score: number | null) => {
        if (score === null) return 'text-text-primary';
        if (score > 75) return 'text-danger';
        if (score > 40) return 'text-yellow-400';
        return 'text-success';
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-secondary p-8 rounded-lg border border-border-color shadow-2xl max-w-2xl w-full relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"><XMarkIcon className="w-6 h-6" /></button>
                <h2 className="text-3xl font-bold text-accent mb-1 font-mono">{proxy.id}</h2>
                <p className="text-text-secondary mb-6">Detailed Proxy Analysis</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2">
                    <DetailItem label="Status">{proxy.status}</DetailItem>
                    <DetailItem label="Protocol">{proxy.protocol}</DetailItem>
                    <DetailItem label="Quality Score">{proxy.qualityScore ?? 'N/A'}</DetailItem>
                    <DetailItem label="Latency">{proxy.latency ? `${proxy.latency}ms` : 'N/A'}</DetailItem>
                    <DetailItem label="Anonymity">{proxy.anonymity}</DetailItem>
                    <DetailItem label="Uptime">{proxy.uptime.checks > 0 ? `${(proxy.uptime.passed / proxy.uptime.checks * 100).toFixed(0)}%` : 'N/A'} ({proxy.uptime.passed}/{proxy.uptime.checks})</DetailItem>
                    <DetailItem label="Country">{getCountryFlag(proxy.country || '')} {proxy.country ?? 'N/A'}</DetailItem>
                    <DetailItem label="ISP">{proxy.isp ?? 'N/A'}</DetailItem>
                    <DetailItem label="Last Checked">{proxy.lastChecked ? new Date(proxy.lastChecked).toLocaleString() : 'Never'}</DetailItem>
                    <DetailItem label="Risk Score">
                        <span className={getRiskScoreColor(proxy.riskScore)}>{proxy.riskScore ?? 'N/A'}</span>
                    </DetailItem>
                    <DetailItem label="Blacklisted">
                        {proxy.isBlacklisted === null ? 'N/A' : (proxy.isBlacklisted ? <span className="text-danger">YES</span> : <span className="text-success">NO</span>)}
                    </DetailItem>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-lg font-semibold text-text-primary mb-2">Latency History (ms)</h4>
                        <div className="p-4 bg-primary rounded-lg border border-border-color">
                            {proxy.latencyHistory.length > 1 ? <Sparkline data={proxy.latencyHistory} width={300} height={60} /> : <p className="text-sm text-text-secondary">Not enough data.</p>}
                        </div>
                    </div>
                     <div>
                        <h4 className="text-lg font-semibold text-text-primary mb-2">Check History</h4>
                        <div className="p-2 bg-primary rounded-lg border border-border-color h-24 overflow-y-auto text-xs font-mono">
                            {proxy.checkHistory && proxy.checkHistory.length > 0 ? proxy.checkHistory.map((h, i) => (
                                <p key={i} className={h.passed ? 'text-success' : 'text-danger'}>
                                    {h.passed ? 'PASS' : 'FAIL'} - {h.target}
                                </p>
                            )) : <p className="text-sm text-text-secondary">No recent check history.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProxyDetailModal;