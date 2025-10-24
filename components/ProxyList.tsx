



import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Proxy, ProxyStatus, ProxyType, AnonymityLevel } from '../types';
import { getCountryFlag } from '../lib/utils';
import { parseNaturalLanguageQuery } from '../lib/ai';
import DocumentDuplicateIcon from './icons/DocumentDuplicateIcon';
import TrashIcon from './icons/TrashIcon';
import Sparkline from './Sparkline';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import TagIcon from './icons/TagIcon';
import SparklesIcon from './icons/SparklesIcon';
import SearchIcon from './icons/SearchIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import BulkEditModal from './modals/BulkEditModal';

interface ProxyListProps {
    proxies: Map<string, Proxy>;
    onSaveSession: () => void;
    onClearSession: () => void;
    onSendToChecker: (proxies: Proxy[]) => void;
    onExport: () => void;
    onDelete: (proxyIds: string[]) => void;
    onUpdateProxy: (proxy: Proxy) => void;
    onShowDetails: (proxy: Proxy) => void;
    externalFilters: Record<string, any>;
    onClearExternalFilters: () => void;
    addLog: (message: string) => void;
    uiDensity: 'comfortable' | 'compact';
}

type SortKey = 'id' | 'latency' | 'country' | 'anonymity' | 'qualityScore' | 'uptime' | 'isp' | 'lastChecked';
type SortDirection = 'asc' | 'desc';
type FilterPreset = { name: string; filters: any };

const ROW_HEIGHT_COMFORTABLE = 42;
const ROW_HEIGHT_COMPACT = 34;

const proxyListWorkerScript = `
let proxies = [];

const processData = (filters, sort) => {
    let result = proxies;

    if (filters.external.country) result = result.filter(p => p.country === filters.external.country);
    if (filters.external.searchText) result = result.filter(p => p.id.startsWith(filters.external.searchText));

    if (filters.status !== 'ALL') result = result.filter(p => p.status === filters.status);
    if (filters.type !== 'ALL') result = result.filter(p => p.protocol === filters.type);
    if (filters.anonymity !== 'ALL') result = result.filter(p => p.anonymity === filters.anonymity);
    if (filters.minScore > 0) result = result.filter(p => p.qualityScore >= filters.minScore);
    if (filters.maxLatency < Infinity) result = result.filter(p => p.latency !== null && p.latency <= filters.maxLatency);
    if (filters.searchText) {
        const search = filters.searchText.toLowerCase();
        result = result.filter(p =>
            p.id.includes(search) ||
            (p.isp && p.isp.toLowerCase().includes(search)) ||
            (p.country && p.country.toLowerCase().includes(search)) ||
            p.tags.some(t => t.toLowerCase().includes(search))
        );
    }

    result.sort((a, b) => {
        let valA, valB;
        if (sort.key === 'latency') { valA = a.latency ?? Infinity; valB = b.latency ?? Infinity; }
        else if (sort.key === 'qualityScore') { valA = a.qualityScore ?? 0; valB = b.qualityScore ?? 0; }
        else if (sort.key === 'lastChecked') { valA = a.lastChecked ?? 0; valB = b.lastChecked ?? 0; }
        else if (sort.key === 'uptime') {
            valA = a.uptime.checks > 0 ? a.uptime.passed / a.uptime.checks : 0;
            valB = b.uptime.checks > 0 ? b.uptime.passed / b.uptime.checks : 0;
        } else { valA = a[sort.key]; valB = b[sort.key]; }
        
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
    });
    return result;
}

self.onmessage = (e) => {
    const { type, payload } = e.data;
    let result;
    switch (type) {
        case 'INIT':
        case 'UPDATE_DATA':
            proxies = payload.proxies;
            result = processData(payload.filters, payload.sort);
            self.postMessage({ type: 'RESULT', payload: result });
            break;
        case 'PROCESS':
            result = processData(payload.filters, payload.sort);
            self.postMessage({ type: 'RESULT', payload: result });
            break;
    }
};
`;

const getAnonymityPill = (proxy: Proxy) => {
    const level = proxy.anonymity; const details = proxy.anonymityDetails?.join(', '); let colorClasses = '';
    switch (level) { case AnonymityLevel.ELITE: colorClasses = 'bg-success/20 text-success'; break; case AnonymityLevel.ANONYMOUS: colorClasses = 'bg-text-secondary/20 text-text-secondary'; break; case AnonymityLevel.TRANSPARENT: colorClasses = 'bg-yellow-400/20 text-yellow-400'; break; default: colorClasses = 'bg-gray-500/20 text-text-secondary'; break; }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colorClasses}`} title={details}>{level}</span>
}

const HeaderCell: React.FC<{ title: string, sortKey: SortKey, currentSortKey: SortKey, direction: SortDirection, onSort: (key: SortKey) => void }> = 
({ title, sortKey, currentSortKey, direction, onSort }) => {
    const getSortIndicator = () => currentSortKey !== sortKey ? '↕' : direction === 'asc' ? '↑' : '↓';
    return (<th className="px-4 py-3 cursor-pointer select-none" onClick={() => onSort(sortKey)}>{title} <span className="ml-1 text-text-secondary">{getSortIndicator()}</span></th>);
};

const ProxyList: React.FC<ProxyListProps> = ({ proxies, onSaveSession, onClearSession, onSendToChecker, onExport, onDelete, onUpdateProxy, onShowDetails, externalFilters, onClearExternalFilters, addLog, uiDensity }) => {
    const [filters, setFilters] = useState({ status: ProxyStatus.VALID as ProxyStatus | 'ALL', type: 'ALL' as ProxyType | 'ALL', anonymity: 'ALL' as AnonymityLevel | 'ALL', searchText: '', minScore: 0, maxLatency: '' as number | '' });
    const [aiQuery, setAiQuery] = useState('');
    const [isAiQuerying, setIsAiQuerying] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>('qualityScore');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [copyStatus, setCopyStatus] = useState('Copy');
    const [scrollTop, setScrollTop] = useState(0);
    const [displayedProxies, setDisplayedProxies] = useState<Proxy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [noteInput, setNoteInput] = useState('');
    const [isBulkEditOpen, setBulkEditOpen] = useState(false);
    const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const workerRef = useRef<Worker | null>(null);
    const isInitialLoadRef = useRef(true);
    const allProxies = useMemo(() => Array.from(proxies.values()), [proxies]);
    const rowHeight = uiDensity === 'compact' ? ROW_HEIGHT_COMPACT : ROW_HEIGHT_COMFORTABLE;
    
    useEffect(() => { const saved = localStorage.getItem('dylandos_filter_presets'); if (saved) setFilterPresets(JSON.parse(saved)); }, []);

    useEffect(() => {
        const workerBlob = new Blob([proxyListWorkerScript], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(workerBlob);
        const worker = new Worker(workerUrl);
        workerRef.current = worker;
        worker.onmessage = (e) => { if (e.data.type === 'RESULT') { setDisplayedProxies(e.data.payload); setIsLoading(false); } };
        return () => { worker.terminate(); URL.revokeObjectURL(workerUrl); };
    }, []);

    useEffect(() => {
        if (workerRef.current) {
            setIsLoading(true);
            const messageType = isInitialLoadRef.current ? 'INIT' : 'UPDATE_DATA';
            if (isInitialLoadRef.current) isInitialLoadRef.current = false;
            
            workerRef.current.postMessage({
                type: messageType,
                payload: {
                    proxies: allProxies,
                    filters: { ...filters, maxLatency: filters.maxLatency === '' ? Infinity : filters.maxLatency, external: externalFilters },
                    sort: { key: sortKey, direction: sortDirection }
                }
            });
        }
    }, [allProxies]);

    useEffect(() => {
        if (workerRef.current && !isInitialLoadRef.current) {
            setIsLoading(true);
            workerRef.current.postMessage({
                type: 'PROCESS',
                payload: {
                    filters: { ...filters, maxLatency: filters.maxLatency === '' ? Infinity : filters.maxLatency, external: externalFilters },
                    sort: { key: sortKey, direction: sortDirection }
                }
            });
        }
    }, [filters, externalFilters, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => { if (sortKey === key) setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc')); else { setSortKey(key); setSortDirection(['latency'].includes(key) ? 'asc' : 'desc'); } };
    
    const handleCopy = () => {
        const proxiesToCopy = selected.size > 0 ? displayedProxies.filter(p => selected.has(p.id)) : displayedProxies;
        if (proxiesToCopy.length === 0) return;
        navigator.clipboard.writeText(proxiesToCopy.map(p => p.id).join('\n')).then(() => { setCopyStatus('Copied!'); setTimeout(() => setCopyStatus('Copy'), 2000); });
    };

    const handleSelect = (id: string) => { setSelected(prev => { const newSet = new Set(prev); newSet.has(id) ? newSet.delete(id) : newSet.add(id); return newSet; }); };
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => { setSelected(e.target.checked ? new Set(displayedProxies.map(p => p.id)) : new Set()); };
    const onScroll = (e: React.UIEvent<HTMLDivElement>) => setScrollTop(e.currentTarget.scrollTop);
    const handleNoteDoubleClick = (proxy: Proxy) => { setEditingNoteId(proxy.id); setNoteInput(proxy.notes || ''); };
    const handleNoteBlur = () => {
        if (editingNoteId) { const proxy = proxies.get(editingNoteId); if (proxy && proxy.notes !== noteInput) onUpdateProxy({ ...proxy, notes: noteInput }); }
        setEditingNoteId(null);
    };

    const handleAiQuery = async (e: React.FormEvent) => {
        e.preventDefault(); if (!aiQuery) return; setIsAiQuerying(true); addLog(`AI Query: "${aiQuery}"`);
        try {
            const f = await parseNaturalLanguageQuery(aiQuery); addLog(`AI interpreted as: ${JSON.stringify(f)}`);
            setFilters(prev => ({ ...prev, status: f.status || 'ALL', type: f.type || 'ALL', anonymity: f.anonymity || 'ALL', minScore: f.minScore || 0, maxLatency: f.maxLatency || Infinity, searchText: f.searchText || '' }));
        } catch (error) { addLog(`AI Query Failed: ${error}`); } finally { setIsAiQuerying(false); }
    };

    const handleSavePreset = () => {
        const name = prompt("Enter a name for this filter preset:");
        if (name) {
            const newPreset = { name, filters };
            const updatedPresets = [...filterPresets.filter(p => p.name !== name), newPreset];
            setFilterPresets(updatedPresets);
            localStorage.setItem('dylandos_filter_presets', JSON.stringify(updatedPresets));
        }
    };
    const handleLoadPreset = (preset: FilterPreset) => { setFilters(preset.filters); };
    const handleDeletePreset = (name: string) => {
        const updatedPresets = filterPresets.filter(p => p.name !== name);
        setFilterPresets(updatedPresets);
        localStorage.setItem('dylandos_filter_presets', JSON.stringify(updatedPresets));
    };

    const totalHeight = displayedProxies.length * rowHeight;
    const startIndex = Math.floor(scrollTop / rowHeight);
    const visibleCount = containerRef.current ? Math.ceil(containerRef.current.clientHeight / rowHeight) : 20;
    const endIndex = Math.min(startIndex + visibleCount + 5, displayedProxies.length);
    const visibleProxies = displayedProxies.slice(startIndex, endIndex);
    const offsetY = startIndex * rowHeight;
    const getLatencyColor = (latency: number | null) => { if (latency === null) return 'text-text-secondary'; if (latency < 300) return 'text-success'; if (latency < 1000) return 'text-yellow-400'; return 'text-danger'; };

    return (
        <div className="p-4">
            <div className="bg-primary/50 border border-border-color rounded-lg overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border-color space-y-4">
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                        <h3 className="font-semibold text-lg">Proxy Database ({isLoading ? '...' : displayedProxies.length.toLocaleString()})</h3>
                         <div className="flex-grow flex items-center gap-2 max-w-lg">
                             <SearchIcon className="w-5 h-5 text-text-secondary flex-shrink-0" />
                             <input type="text" placeholder="Search IP, ISP, country, tags..." value={filters.searchText} onChange={e => setFilters(f => ({...f, searchText: e.target.value}))} className="bg-primary border border-border-color rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent w-full" />
                        </div>
                    </div>
                     {Object.keys(externalFilters).length > 0 && <div className="p-2 bg-accent/10 text-accent text-xs rounded-md flex justify-between items-center"><span>Filtered by: {JSON.stringify(externalFilters)}</span><button onClick={onClearExternalFilters} className="font-bold">Clear</button></div>}
                     <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                        <select value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value as any}))} className="bg-primary border border-border-color rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                            <option value="ALL">All Statuses</option><option value={ProxyStatus.VALID}>Valid</option><option value={ProxyStatus.INVALID}>Invalid</option><option value={ProxyStatus.UNTESTED}>Untested</option>
                        </select>
                        <select value={filters.type} onChange={e => setFilters(f => ({...f, type: e.target.value as any}))} className="bg-primary border border-border-color rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                            <option value="ALL">All Types</option><option value={ProxyType.HTTP}>HTTP</option><option value={ProxyType.HTTPS}>HTTPS</option><option value={ProxyType.SOCKS4}>SOCKS4</option><option value={ProxyType.SOCKS5}>SOCKS5</option>
                        </select>
                         <select value={filters.anonymity} onChange={e => setFilters(f => ({...f, anonymity: e.target.value as any}))} className="bg-primary border border-border-color rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                            <option value="ALL">All Anonymity</option><option value={AnonymityLevel.ELITE}>Elite</option><option value={AnonymityLevel.ANONYMOUS}>Anonymous</option><option value={AnonymityLevel.TRANSPARENT}>Transparent</option>
                        </select>
                         <div className="flex items-center gap-2"><label htmlFor="maxLatency" className="text-sm text-text-secondary">Max Latency:</label><input id="maxLatency" type="number" step="100" placeholder="ms" value={filters.maxLatency} onChange={e => setFilters(f => ({...f, maxLatency: e.target.value ? Number(e.target.value) : ''}))} className="w-20 bg-primary border border-border-color rounded-md p-1 text-sm"/></div>
                         <div className="flex items-center gap-2"><label htmlFor="minScore" className="text-sm text-text-secondary">Min Score:</label><input id="minScore" type="range" min="0" max="100" value={filters.minScore} onChange={e => setFilters(f => ({...f, minScore: Number(e.target.value)}))} className="w-24 accent-accent" /><span className="text-sm font-mono w-8">{filters.minScore}</span></div>
                    </div>
                     <div className="flex items-center gap-2">
                        <select onChange={(e) => { const p = filterPresets.find(p => p.name === e.target.value); if (p) handleLoadPreset(p); }} className="bg-primary border border-border-color rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent">
                            <option>Load Preset...</option>{filterPresets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                        <button onClick={handleSavePreset} className="text-xs px-2 py-1 border border-border-color rounded-md hover:bg-border-color">Save Preset</button>
                        {filterPresets.find(p => p.name === filterPresets[0]?.name) && <button onClick={() => handleDeletePreset(filterPresets[0].name)} className="text-xs text-danger">Delete</button>}
                     </div>
                     <form onSubmit={handleAiQuery} className="flex items-center gap-2">
                         <SparklesIcon className="w-5 h-5 text-accent flex-shrink-0" /><input type="text" placeholder="Or use AI Query: 'fast elite proxies in germany under 200ms'" value={aiQuery} onChange={e => setAiQuery(e.target.value)} className="bg-primary border border-border-color rounded-md px-3 py-1.5 text-sm w-full" disabled={isAiQuerying} /><button type="submit" className="px-4 py-1.5 text-sm font-bold text-primary bg-accent rounded-md" disabled={isAiQuerying}>{isAiQuerying ? '...' : 'Query'}</button>
                    </form>
                </div>
                <div className="p-4 flex flex-wrap gap-2 justify-between items-center border-b border-border-color bg-primary/30">
                    <div className="flex items-center gap-2">
                        <button onClick={() => onDelete(Array.from(selected))} disabled={selected.size === 0} className="bg-danger/20 text-danger text-xs font-bold py-2 px-3 rounded-md hover:bg-danger/40 flex items-center gap-1.5 disabled:opacity-50"><TrashIcon className="w-4 h-4" />Delete ({selected.size})</button>
                        <button onClick={() => setBulkEditOpen(true)} disabled={selected.size === 0} className="bg-yellow-400/20 text-yellow-400 text-xs font-bold py-2 px-3 rounded-md hover:bg-yellow-400/40 flex items-center gap-1.5 disabled:opacity-50"><TagIcon className="w-4 h-4" />Bulk Edit ({selected.size})</button>
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={handleCopy} className="bg-accent/20 text-accent text-xs font-bold py-2 px-3 rounded-md hover:bg-accent/40 flex items-center gap-1.5"><DocumentDuplicateIcon className="w-4 h-4" />{copyStatus}</button>
                        <button onClick={onExport} className="bg-accent/20 text-accent text-xs font-bold py-2 px-3 rounded-md hover:bg-accent/40 flex items-center gap-1.5"><ArrowUpTrayIcon className="w-4 h-4" />Export</button>
                    </div>
                </div>
                <div className="w-full text-sm text-left hidden md:block">
                    <table className="w-full">
                        <thead className="text-xs text-text-secondary uppercase sticky top-0 bg-secondary backdrop-blur-sm z-10">
                            <tr>
                                <th className="px-4 py-3"><input type="checkbox" onChange={handleSelectAll} checked={selected.size === displayedProxies.length && displayedProxies.length > 0} className="w-4 h-4 bg-primary border-border-color rounded text-accent focus:ring-accent" /></th>
                                <HeaderCell title="Proxy" sortKey="id" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} /><HeaderCell title="Score" sortKey="qualityScore" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} /><HeaderCell title="Anonymity" sortKey="anonymity" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} /><HeaderCell title="Latency" sortKey="latency" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} /><HeaderCell title="Country" sortKey="country" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} /><HeaderCell title="Notes" sortKey="id" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} /><HeaderCell title="Tags" sortKey="id" currentSortKey={sortKey} direction={sortDirection} onSort={handleSort} />
                            </tr>
                        </thead>
                    </table>
                    <div ref={containerRef} onScroll={onScroll} className="overflow-y-auto max-h-[60vh] relative">
                        {isLoading && ( <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm flex items-center justify-center z-20"><p className="text-lg animate-pulse">Filtering...</p></div> )}
                        <div className={isLoading ? 'opacity-50' : ''}>
                            {displayedProxies.length > 0 ? (
                                <div style={{ height: `${totalHeight}px` }}>
                                    <div style={{ transform: `translateY(${offsetY}px)` }}>
                                        {visibleProxies.map((p) => (
                                            <div key={p.id} onClick={() => onShowDetails(p)} className="grid grid-cols-[auto_2fr_1fr_1.5fr_1.5fr_1.5fr_2fr_2fr] font-mono border-b border-border-color hover:bg-border-color/30 items-center cursor-pointer" style={{ height: `${rowHeight}px` }}>
                                                <div className="px-4 py-2 flex items-center" onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(p.id)} onChange={() => handleSelect(p.id)} className="w-4 h-4 bg-primary border-border-color rounded text-accent focus:ring-accent" /></div>
                                                <div className="px-4 py-2 truncate">{p.id}</div>
                                                <div className="px-4 py-2 font-bold text-center">{p.qualityScore ?? 'N/A'}</div>
                                                <div className="px-4 py-2">{getAnonymityPill(p)}</div>
                                                <div className="px-4 py-2 flex items-center gap-2"><span className={getLatencyColor(p.latency)}>{p.latency !== null ? `${p.latency} ms` : 'N/A'}</span>{p.latencyHistory.length > 1 && <Sparkline data={p.latencyHistory} />}</div>
                                                <div className="px-4 py-2 truncate flex items-center gap-2"><span>{getCountryFlag(p.country || '')}</span>{p.country ?? 'N/A'}</div>
                                                <div className="px-4 py-2" onClick={e => e.stopPropagation()} onDoubleClick={() => handleNoteDoubleClick(p)}>{editingNoteId === p.id ? <input type="text" value={noteInput} onChange={e => setNoteInput(e.target.value)} onBlur={handleNoteBlur} onKeyDown={e => e.key === 'Enter' && handleNoteBlur()} autoFocus className="bg-primary border border-accent w-full text-xs p-1 rounded"/> : <span className="text-text-secondary italic truncate" title={p.notes || 'Dbl-click to add'}>{p.notes || '...'}</span>}</div>
                                                <div className="px-4 py-2 text-text-secondary flex flex-wrap gap-1 items-center">{p.tags.slice(0, 3).map(t => <span key={t} className="bg-border-color text-xs px-1.5 py-0.5 rounded">{t}</span>)}{p.tags.length > 3 && <span className="text-xs" title={p.tags.join(', ')}>+{p.tags.length - 3}</span>}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : !isLoading && <p className="text-center text-sm text-text-secondary p-8">{allProxies.length > 0 ? 'No proxies match your filters.' : 'No proxies in database.'}</p>}
                        </div>
                    </div>
                </div>
                 <div className="md:hidden p-2 space-y-2 max-h-[70vh] overflow-y-auto">
                    {displayedProxies.map(p => (
                         <div key={p.id} className="bg-primary/50 border border-border-color rounded-lg p-3 text-sm font-mono" onClick={() => onShowDetails(p)}>
                            <div className="flex justify-between items-start"><div className="flex items-center gap-2"><input type="checkbox" checked={selected.has(p.id)} onChange={() => handleSelect(p.id)} onClick={e => e.stopPropagation()} className="w-4 h-4 bg-primary border-border-color rounded text-accent" /><span className="font-bold text-text-primary">{p.id}</span></div><span className="text-xs text-text-secondary">{p.protocol}</span></div>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs"><div><span className="text-text-secondary">Score:</span> <span className="font-semibold text-accent">{p.qualityScore ?? 'N/A'}</span></div><div><span className="text-text-secondary">Latency:</span> <span className={getLatencyColor(p.latency)}>{p.latency !== null ? `${p.latency}ms` : 'N/A'}</span></div><div><span className="text-text-secondary">Country:</span> <span className="text-text-primary">{getCountryFlag(p.country || '')} {p.country ?? 'N/A'}</span></div><div>{getAnonymityPill(p)}</div></div>
                             {p.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{p.tags.map(t => <span key={t} className="bg-border-color text-xs px-1.5 py-0.5 rounded">{t}</span>)}</div>}
                         </div>
                    ))}
                 </div>
            </div>
            {isBulkEditOpen && <BulkEditModal
                proxies={allProxies.filter(p => selected.has(p.id))}
                onClose={() => setBulkEditOpen(false)}
                onUpdate={(id, update) => {
                    const proxy = proxies.get(id);
                    if(proxy) onUpdateProxy({...proxy, ...update});
                }}
            />}
        </div>
    );
};

export default ProxyList;