

import React, { useMemo, useState } from 'react';
import { ProxyType, SourceStats } from '../types';
import Sparkline from './Sparkline';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import SparklesIcon from './icons/SparklesIcon';
import { downloadFile } from '../lib/utils';
import { analyzeSourceContent } from '../lib/ai';


interface SourceManagerProps {
    stats: Map<string, SourceStats>;
    setStats: React.Dispatch<React.SetStateAction<Map<string, SourceStats>>>;
    addLog: (message: string) => void;
}

const SourceManager: React.FC<SourceManagerProps> = ({ stats, setStats, addLog }) => {
    const [customSourceUrl, setCustomSourceUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
    const [editingNoteUrl, setEditingNoteUrl] = useState<string | null>(null);
    const [noteInput, setNoteInput] = useState('');

    const filteredAndSortedStats = useMemo(() => {
        return Array.from(stats.values())
            .filter(s => {
                const searchMatch = s.url.toLowerCase().includes(searchTerm.toLowerCase());
                const filterMatch = filter === 'all' || (filter === 'enabled' && s.enabled) || (filter === 'disabled' && !s.enabled);
                return searchMatch && filterMatch;
            })
            .sort((a, b) => {
                const healthScore = (s: SourceStats) => {
                    if (s.health === 'Good') return 3; if (s.health === 'Average') return 2; if (s.health === 'Poor') return 1; return 0;
                };
                return healthScore(b) - healthScore(a);
            });
    }, [stats, searchTerm, filter]);

    const handleToggle = (url: string, enabled: boolean) => {
        setStats(prev => new Map(prev).set(url, { ...prev.get(url)!, enabled }));
    };

    const handleToggleAll = (enable: boolean) => {
        setStats(prev => {
            const newStats = new Map<string, SourceStats>();
            for (const [url, stat] of prev.entries()) {
                newStats.set(url, { ...stat, enabled: enable });
            }
            return newStats;
        });
    };

    const handleExport = () => {
        const dataToExport = { sources: Array.from(stats.values()).map(s => ({url: s.url, notes: s.notes})) };
        const jsonString = JSON.stringify(dataToExport, null, 2);
        downloadFile(jsonString, 'proxy-sources.json', 'application/json');
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                if (file.name.endsWith('.json')) {
                    const parsedData: { sources: {url: string, notes?: string}[] } = JSON.parse(content);
                    const newStats = new Map(stats);
                    let added = 0;
                    parsedData.sources.forEach(s => {
                        if (s.url && !newStats.has(s.url)) {
                            newStats.set(s.url, { url: s.url, notes: s.notes || '', found: 0, valid: 0, enabled: true, yieldHistory: [], health: 'Unknown', errors: 0 });
                            added++;
                        }
                    });
                    setStats(newStats);
                    addLog(`Imported ${added} new sources from JSON.`);
                } else if (file.name.endsWith('.txt')) {
                    const urls = content.split('\n').map(u => u.trim()).filter(Boolean);
                    const newStats = new Map(stats);
                    let added = 0;
                    urls.forEach(url => {
                         if (url && !newStats.has(url)) {
                            newStats.set(url, { url: url, found: 0, valid: 0, enabled: true, yieldHistory: [], health: 'Unknown', errors: 0 });
                            added++;
                        }
                    });
                     setStats(newStats);
                     addLog(`Imported ${added} new sources from TXT.`);
                }
            } catch (err) { addLog("Error: Invalid source file format."); }
        };
        reader.readAsText(file);
    };
    
    const handleAddCustomSource = (source: { url: string, type: ProxyType, format: 'txt' | 'json', jsonPath?: string }) => {
        if (!source.url || stats.has(source.url)) { addLog("Invalid or duplicate custom source URL."); return; }
        const newSourceStat: SourceStats = { url: source.url, found: 0, valid: 0, enabled: true, yieldHistory: [], health: 'Unknown', errors: 0, notes: 'AI Added' };
        setStats(prev => new Map(prev).set(source.url, newSourceStat));
        setCustomSourceUrl('');
        addLog(`Added custom source: ${source.url}`);
    };

    const handleAnalyzeSource = async () => {
        if (!customSourceUrl) return; setIsAnalyzing(true); addLog(`AI analyzing source: ${customSourceUrl}`);
        try {
            const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(customSourceUrl)}`);
            if (!response.ok) throw new Error(`Failed to fetch content, status: ${response.status}`);
            const content = await response.text();
            const result = await analyzeSourceContent(content);
            addLog(`AI analysis complete: Format is ${result.format}, Type is ${result.type}.`);
            if (confirm(`AI suggests this is a '${result.format}' list of '${result.type}' proxies. Add it?`)) {
                handleAddCustomSource({ url: customSourceUrl, type: result.type, format: result.format, jsonPath: result.jsonPath });
            }
        } catch(error) { addLog(`AI analysis failed: ${error}`); } finally { setIsAnalyzing(false); }
    };
    
    const handleNoteBlur = () => {
        if (editingNoteUrl) {
            setStats(prev => new Map(prev).set(editingNoteUrl, { ...prev.get(editingNoteUrl)!, notes: noteInput }));
            setEditingNoteUrl(null);
        }
    };

    const enabledCount = useMemo(() => Array.from(stats.values()).filter(s => s.enabled).length, [stats]);
    
    const getHealthIndicator = (health: SourceStats['health']) => {
        switch(health) {
            case 'Good': return <div className="w-3 h-3 rounded-full bg-success" title="Good Yield"></div>;
            case 'Average': return <div className="w-3 h-3 rounded-full bg-yellow-400" title="Average Yield"></div>;
            case 'Poor': return <div className="w-3 h-3 rounded-full bg-danger" title="Poor Yield"></div>;
            default: return <div className="w-3 h-3 rounded-full bg-gray-600" title="Unknown"></div>;
        }
    };

    return (
        <div className="my-6 p-6 bg-secondary border border-border-color rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold">Source Manager</h2>
            <p className="text-text-secondary mt-1 mb-6">Enable or disable proxy sources. Sources are ranked by historical effectiveness.</p>
            
             <div className="mb-6 p-4 border border-border-color rounded-lg bg-primary/30">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-accent"/> AI Source Discovery</h3>
                <div className="flex gap-2"><input type="url" value={customSourceUrl} onChange={e => setCustomSourceUrl(e.target.value)} placeholder="https://your-proxy-list.com/proxies.txt" className="w-full bg-primary p-2 border border-border-color rounded-md text-sm placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent" disabled={isAnalyzing} /><button onClick={handleAnalyzeSource} disabled={isAnalyzing || !customSourceUrl} className="px-4 py-2 text-sm font-bold text-primary bg-accent rounded-md hover:brightness-110 disabled:opacity-50 flex items-center gap-2">{isAnalyzing ? '...' : 'Analyze'}</button></div>
                <p className="text-xs text-text-secondary mt-2">Paste a URL and let AI determine the format and proxy type automatically.</p>
            </div>
            
             <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                 <input type="search" placeholder="Search sources..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-primary border border-border-color rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                <div className="flex items-center gap-2 text-sm">
                    <button onClick={() => setFilter('all')} className={filter === 'all' ? 'text-accent font-bold' : ''}>All</button>
                    <button onClick={() => setFilter('enabled')} className={filter === 'enabled' ? 'text-accent font-bold' : ''}>Enabled</button>
                    <button onClick={() => setFilter('disabled')} className={filter === 'disabled' ? 'text-accent font-bold' : ''}>Disabled</button>
                </div>
                 <div className="flex items-center gap-2">
                    <button onClick={handleExport} className="px-3 py-2 text-xs font-bold text-text-primary bg-primary border border-border-color rounded-md hover:bg-border-color flex items-center gap-2"><ArrowUpTrayIcon className="w-4 h-4" /> Export</button>
                    <label className="px-3 py-2 text-xs font-bold text-text-primary bg-primary border border-border-color rounded-md hover:bg-border-color cursor-pointer flex items-center gap-2"><ArrowDownTrayIcon className="w-4 h-4" /> Import<input type="file" accept=".json,.txt" onChange={handleImport} className="hidden" /></label>
                    <span className="text-sm font-bold text-accent bg-accent/20 px-3 py-2 rounded-md">{enabledCount} / {stats.size} Enabled</span>
                </div>
            </div>

            <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-secondary uppercase bg-primary/30 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 w-16"><input type="checkbox" onChange={e => handleToggleAll(e.target.checked)} checked={enabledCount === stats.size} /></th>
                            <th className="px-4 py-3">Source URL</th>
                            <th className="px-4 py-3">Notes</th>
                            <th className="px-4 py-3">Health</th>
                            <th className="px-4 py-3">Yield History</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {filteredAndSortedStats.map((stat) => (
                            <tr key={stat.url} className={`hover:bg-border-color/20 ${!stat.enabled && 'opacity-50'}`}>
                                <td className="px-4 py-2"><input type="checkbox" checked={stat.enabled} onChange={(e) => handleToggle(stat.url, e.target.checked)} className="w-4 h-4 bg-primary border-border-color rounded text-accent focus:ring-accent" /></td>
                                <td className="px-4 py-2 font-mono truncate max-w-sm" title={stat.url}>{stat.url}</td>
                                <td className="px-4 py-2" onDoubleClick={() => { setEditingNoteUrl(stat.url); setNoteInput(stat.notes || ''); }}>
                                    {editingNoteUrl === stat.url ? <input type="text" value={noteInput} onChange={e => setNoteInput(e.target.value)} onBlur={handleNoteBlur} onKeyDown={e => e.key === 'Enter' && handleNoteBlur()} autoFocus className="bg-primary border border-accent w-full text-xs p-1 rounded"/> : <span className="text-text-secondary italic text-xs truncate" title={stat.notes || 'Double-click to add notes'}>{stat.notes || '...'}</span>}
                                </td>
                                <td className="px-4 py-2 flex items-center gap-2">{getHealthIndicator(stat.health)} {stat.health}</td>
                                <td className="px-4 py-2">{stat.yieldHistory.length > 1 ? <Sparkline data={stat.yieldHistory} /> : <span className="text-text-secondary text-xs">N/A</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredAndSortedStats.length === 0 && <p className="text-center text-sm text-text-secondary p-8">No sources match your filters.</p>}
            </div>
        </div>
    );
};

export default SourceManager;