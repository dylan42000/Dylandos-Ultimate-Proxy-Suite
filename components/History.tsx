
import React from 'react';
import { HistoryEntry } from '../types';
import { formatEtr } from '../lib/utils';

interface HistoryProps {
    history: HistoryEntry[];
}

const History: React.FC<HistoryProps> = ({ history }) => {
    const scrapeHistory = history.filter(h => h.type === 'scrape');
    const checkHistory = history.filter(h => h.type === 'check');

    return (
        <div className="my-6 p-6 bg-secondary border border-border-color rounded-lg shadow-lg space-y-8">
            <div>
                <h2 className="text-2xl font-bold mb-4">Scrape History</h2>
                <div className="overflow-x-auto max-h-[40vh]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-secondary uppercase bg-primary/30 sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Profile</th>
                                <th className="px-4 py-3 text-right">Sources</th>
                                <th className="px-4 py-3 text-right">Found</th>
                                <th className="px-4 py-3 text-right">Errors</th>
                                <th className="px-4 py-3 text-right">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {scrapeHistory.map(h => (
                                <tr key={h.id} className="hover:bg-border-color/20">
                                    <td className="px-4 py-2">{new Date(h.date).toLocaleString()}</td>
                                    <td className="px-4 py-2">{h.details.profile}</td>
                                    <td className="px-4 py-2 text-right font-mono">{h.details.sources}</td>
                                    <td className="px-4 py-2 text-right font-mono text-success">{h.details.found}</td>
                                    <td className="px-4 py-2 text-right font-mono text-danger">{h.details.errors}</td>
                                    <td className="px-4 py-2 text-right font-mono">{formatEtr(h.duration)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {scrapeHistory.length === 0 && <p className="text-center text-sm text-text-secondary p-8">No scrape history yet.</p>}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">Check History</h2>
                 <div className="overflow-x-auto max-h-[40vh]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-secondary uppercase bg-primary/30 sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Mode</th>
                                <th className="px-4 py-3 text-right">Checked</th>
                                <th className="px-4 py-3 text-right">Valid</th>
                                <th className="px-4 py-3 text-right">Invalid</th>
                                <th className="px-4 py-3 text-right">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {checkHistory.map(h => (
                                <tr key={h.id} className="hover:bg-border-color/20">
                                    <td className="px-4 py-2">{new Date(h.date).toLocaleString()}</td>
                                    <td className="px-4 py-2 uppercase">{h.details.mode}</td>
                                    <td className="px-4 py-2 text-right font-mono">{h.details.checked}</td>
                                    <td className="px-4 py-2 text-right font-mono text-success">{h.details.valid}</td>
                                    <td className="px-4 py-2 text-right font-mono text-danger">{h.details.invalid}</td>
                                    <td className="px-4 py-2 text-right font-mono">{formatEtr(h.duration)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {checkHistory.length === 0 && <p className="text-center text-sm text-text-secondary p-8">No check history yet.</p>}
                </div>
            </div>
        </div>
    );
};

export default History;
