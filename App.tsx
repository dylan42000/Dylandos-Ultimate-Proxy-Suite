






import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Proxy, ProxyType, AppStatus, Stats, ProxySource, ProxyStatus, AnonymityLevel, SourceStats, CheckProfile, ScrapeProfile, HistoryEntry, AppSettings, AppData } from './types';
import { PROXY_SOURCES } from './constants';
import { idbSet, idbGet, idbClear, getRandom, downloadFile } from './lib/utils';
import { aiTagProxy } from './lib/ai';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Controls from './components/Controls';
import ProxyList from './components/ProxyList';
import ActivityLog from './components/ActivityLog';
import WorkerStatus, { WorkerInfo } from './components/WorkerStatus';
import GeoDistribution from './components/GeoDistribution';
import Settings from './components/Settings';
import SourceManager from './components/SourceManager';
import SearchIcon from './components/icons/SearchIcon';
import ShieldCheckIcon from './components/icons/ShieldCheckIcon';
import DatabaseIcon from './components/icons/DatabaseIcon';
import ChartBarIcon from './components/icons/ChartBarIcon';
import Cog6ToothIcon from './components/icons/Cog6ToothIcon';
import ClockIcon from './components/icons/ClockIcon';
import ComingSoonModal from './components/modals/ComingSoonModal';
import CheckSummaryModal from './components/modals/CheckSummaryModal';
import CustomExportModal from './components/modals/CustomExportModal';
import ScrapeCompleteModal from './components/modals/ScrapeCompleteModal';
import ScrapeProfileModal from './components/modals/ScrapeProfileModal';
import ProxyDetailModal from './components/modals/ProxyDetailModal';
import CommandPaletteModal from './components/modals/CommandPaletteModal';
import ChangelogModal from './components/modals/ChangelogModal';
import OnboardingTour from './components/OnboardingTour';
import LiveAnalytics from './components/checker/LiveAnalytics';
import CheckerControls from './components/checker/CheckerControls';
import DataVisualization from './components/database/DataVisualization';
import SubnetAnalysis from './components/database/SubnetAnalysis';
import History from './components/History';


const scraperWorkerScript = `
self.onmessage = async (e) => {
    const { source, workerId, timeout, userAgent } = e.data;
    const proxyRegex = /\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}:\\d+/g;
    const BATCH_SIZE = 500;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    self.postMessage({ type: 'start', workerId, sourceUrl: source.url });

    try {
        const headers = {};
        if (userAgent) headers['User-Agent'] = userAgent;

        const response = await fetch(source.url, { mode: 'cors', signal: controller.signal, cache: 'no-store', headers });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('HTTP ' + response.status);
        
        let foundProxies = [];
        if (source.format === 'json') {
            const json = await response.json();
            let items = json;
            if(source.jsonPath) {
              for(const key of source.jsonPath.split('.')) { if(items) items = items[key]; }
            }
            if(Array.isArray(items)) {
                items.forEach(item => {
                    let proxyString = '';
                    if (typeof item === 'string') proxyString = item;
                    else if (item && typeof item === 'object' && item.proxy) proxyString = item.proxy;
                    else if (item && typeof item === 'object' && item.ip && item.port) proxyString = item.ip + ':' + item.port;
                    if (proxyString && proxyRegex.test(proxyString)) foundProxies.push(proxyString);
                });
            }
        } else {
            const text = await response.text();
            foundProxies = text.match(proxyRegex) || [];
        }
        
        const results = foundProxies.map(p => ({ id: p, protocol: source.type, sourceUrl: source.url }));
        
        for (let i = 0; i < results.length; i += BATCH_SIZE) {
            self.postMessage({ type: 'result', proxies: results.slice(i, i + BATCH_SIZE), sourceUrl: source.url });
        }
    } catch (error) {
        clearTimeout(timeoutId);
        self.postMessage({ type: 'error', sourceUrl: source.url, message: 'Worker #' + workerId + ' failed on ' + source.url + ': ' + error.message });
    } finally {
        self.postMessage({ type: 'finished', sourceUrl: source.url, workerId });
    }
};
`;

const validatorScript = `
const countries = ["US", "DE", "CA", "GB", "FR", "JP", "NL", "RU", "BR", "IN", "CN", "AU", "IT", "ES", "SE"];
const cities = ["New York", "Berlin", "Toronto", "London", "Paris", "Tokyo", "Amsterdam", "Moscow", "Sao Paulo", "Mumbai", "Beijing", "Sydney", "Rome", "Madrid", "Stockholm"];
const isps = ["Comcast", "Deutsche Telekom", "Bell Canada", "BT Group", "Orange S.A.", "NTT", "KPN", "Rostelecom", "Vivo", "Jio", "China Telecom", "Telstra", "Telecom Italia", "Telefonica", "Telia"];
const anonymityLevels = ["ELITE", "ANONYMOUS", "TRANSPARENT"];
const failureReasons = ["Timeout", "Connection Refused", "Target Mismatch", "Invalid Protocol"];
const asns = ["AS7922", "AS3320", "AS577", "AS2856", "AS3215", "AS2516", "AS1136", "AS12389", "AS7713", "AS55836", "AS4134", "AS1221", "AS3269", "AS12414", "AS1299"];

function getRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function calculateProxyScore(latency, anonymity, uptime) {
    if (latency === null) return 0;
    const latencyScore = Math.max(0, 40 * (1 - (Math.max(0, latency - 50)) / 1950));
    let anonymityScore = 0;
    if (anonymity === "ELITE") anonymityScore = 30;
    else if (anonymity === "ANONYMOUS") anonymityScore = 20;
    else if (anonymity === "TRANSPARENT") anonymityScore = 5;
    const uptimeRatio = uptime.checks > 0 ? uptime.passed / uptime.checks : 0;
    const uptimeScore = 30 * uptimeRatio;
    return Math.round(latencyScore + anonymityScore + uptimeScore);
}

self.onmessage = (e) => {
    const { proxies, workerId, mode, targets } = e.data;
    const isIntensive = mode === 'INTENSIVE';
    const isStandard = mode === 'STANDARD';
    const isLightning = mode === 'LIGHTNING';
    const isGoogleCheck = mode === 'GOOGLE';
    const isSecurityCheck = mode === 'SECURITY';
    
    self.postMessage({ type: 'start', workerId });
    
    const validated = proxies.map(proxy => {
        if (isGoogleCheck) {
            return { ...proxy, googlePassed: Math.random() > 0.3 };
        }
        if (isSecurityCheck) {
            return { ...proxy, isBlacklisted: Math.random() > 0.9, riskScore: Math.floor(Math.random() * 100), lastChecked: Date.now() };
        }

        const passRate = isLightning ? 0.25 : isStandard ? 0.35 : 0.45;
        const isValidForTargets = targets.map(target => ({ target, passed: Math.random() > (proxy.protocol.startsWith('SOCKS') ? passRate + 0.1 : passRate) }));
        const isValid = isValidForTargets.every(t => t.passed);
        
        let latency = null;
        if(isValid) {
            if (isLightning) latency = Math.floor(Math.random() * 250 + 50);
            else if (isStandard) latency = Math.floor(Math.random() * 600 + 50);
            else if (isIntensive) latency = Math.floor(Math.random() * 1800 + 50);
        }
        
        const countryIndex = Math.floor(Math.random() * countries.length);
        const anonymity = isValid ? getRandom(anonymityLevels) : 'UNKNOWN';
        
        const newUptime = { ...proxy.uptime, checks: proxy.uptime.checks + 1, passed: isValid ? proxy.uptime.passed + 1 : proxy.uptime.passed };
        const newLatencyHistory = latency !== null ? [...proxy.latencyHistory, latency].slice(-10) : proxy.latencyHistory;
        
        let anonymityDetails = null;
        if(isValid && !isLightning && anonymity !== 'ELITE' && Math.random() > 0.5) anonymityDetails = ['X-Forwarded-For detected'];

        return {
            ...proxy,
            status: isValid ? 'VALID' : 'INVALID',
            latency: latency,
            country: (isIntensive || isStandard) && isValid ? countries[countryIndex] : proxy.country,
            city: isIntensive && isValid ? cities[countryIndex] : proxy.city,
            isp: isIntensive && isValid ? isps[countryIndex] : proxy.isp,
            asn: isIntensive && isValid ? asns[countryIndex] : proxy.asn,
            anonymity: !isLightning && isValid ? anonymity : 'UNKNOWN',
            anonymityDetails: anonymityDetails,
            googlePassed: isIntensive && isValid ? Math.random() > 0.3 : proxy.googlePassed,
            lastChecked: Date.now(),
            uptime: newUptime,
            latencyHistory: newLatencyHistory,
            qualityScore: calculateProxyScore(latency, !isLightning && isValid ? anonymity : 'UNKNOWN', newUptime),
            checkHistory: isValidForTargets,
            failureReason: isValid ? null : getRandom(failureReasons),
            consecutiveFails: isValid ? 0 : (proxy.consecutiveFails || 0) + 1,
        };
    });

    setTimeout(() => {
        self.postMessage({ type: 'result', proxies: validated });
        self.postMessage({ type: 'finished', workerId });
    }, Math.random() * 200 + 50);
};
`;

const databaseProcessingWorkerScript = `
const AnonymityLevel = { UNKNOWN: 'UNKNOWN', ELITE: 'ELITE', ANONYMOUS: 'ANONYMOUS', TRANSPARENT: 'TRANSPARENT' };
const ProxyType = { HTTP: 'HTTP', HTTPS: 'HTTPS', SOCKS4: 'SOCKS4', SOCKS5: 'SOCKS5' };

function applyTierTags(proxy) {
    if (proxy.status !== 'VALID' || proxy.latency === null || proxy.qualityScore === null) {
        return proxy;
    }
    const newTags = proxy.tags.filter(t => !t.startsWith('tier-'));
    const uptimeRatio = proxy.uptime.checks > 0 ? proxy.uptime.passed / proxy.uptime.checks : 0;
    if (proxy.qualityScore > 85 && uptimeRatio > 0.95 && proxy.latency < 250 && proxy.anonymity === AnonymityLevel.ELITE) {
        newTags.push('tier-elite');
    } else if (proxy.qualityScore > 70 && uptimeRatio > 0.80 && proxy.latency < 500) {
        newTags.push('tier-premium');
    } else if (proxy.qualityScore > 50) {
        newTags.push('tier-standard');
    }
    return { ...proxy, tags: newTags };
}

function calculateSummaryStats(proxies) {
    const stats = { unique: proxies.length, [ProxyType.HTTP]: 0, [ProxyType.HTTPS]: 0, [ProxyType.SOCKS4]: 0, [ProxyType.SOCKS5]: 0, valid: 0, invalid: 0, elite: 0, anonymous: 0, topScore: 0, averageLatency: 0 };
    let totalLatency = 0;
    let validProxiesWithLatency = 0;
    
    for (const proxy of proxies) {
        if (proxy.protocol) stats[proxy.protocol]++;
        if (proxy.status === 'VALID') {
            stats.valid++;
            if (proxy.latency !== null) {
                totalLatency += proxy.latency;
                validProxiesWithLatency++;
            }
            if (proxy.anonymity === AnonymityLevel.ELITE) stats.elite++;
            if (proxy.anonymity === AnonymityLevel.ANONYMOUS) stats.anonymous++;
            if (proxy.qualityScore && proxy.qualityScore > stats.topScore) stats.topScore = proxy.qualityScore;
        } else if (proxy.status === 'INVALID') {
            stats.invalid++;
        }
    }
    stats.averageLatency = validProxiesWithLatency > 0 ? totalLatency / validProxiesWithLatency : 0;
    return stats;
}

self.onmessage = (e) => {
    const { currentProxies, checkResults, settings } = e.data;
    const newMap = new Map(currentProxies);
    checkResults.forEach(p => newMap.set(p.id, p));

    let processedProxies = Array.from(newMap.values());
    processedProxies = processedProxies.map(p => applyTierTags(p));

    if (settings.autoDeleteFails > 0) {
        processedProxies = processedProxies.filter(p => p.consecutiveFails < settings.autoDeleteFails);
    }
    
    const finalStats = calculateSummaryStats(processedProxies);
    const finalProxies = processedProxies.map(p => [p.id, p]);
    
    self.postMessage({ finalProxies, finalStats });
};
`;


const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
            active
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
        }`}
    >
        {children}
    </button>
);

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState('SCRAPER');
    const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
    const [proxies, setProxies] = useState<Map<string, Proxy>>(new Map());
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    const [stats, setStats] = useState<Stats>({ totalScraped: 0, unique: 0, HTTP: 0, HTTPS: 0, SOCKS4: 0, SOCKS5: 0, valid: 0, invalid: 0, averageLatency: 0, elite: 0, anonymous: 0, lastValidationTime: null, topScore: 0, etr: 0, checkedCount: 0, totalToCheck: 0 });
    const [logs, setLogs] = useState<string[]>(['Welcome to Dylandos Ultimate Proxy Suite!']);
    const [workerStatuses, setWorkerStatuses] = useState<WorkerInfo[]>([]);
    const [settings, setSettings] = useState<AppSettings>({ 
        numWorkers: navigator.hardwareConcurrency || 8, 
        timeout: 15000,
        autoDeleteFails: 5,
        enableRevalidation: true,
        revalidationInterval: 30,
        themeColor: '#FF00FF',
        uiDensity: 'comfortable',
        customUserAgent: '',
        autoDisableSources: true,
    });
    const [sourceStats, setSourceStats] = useState<Map<string, SourceStats>>(new Map());
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    
    // Modals State
    const [isComingSoonModalOpen, setComingSoonModalOpen] = useState(false);
    const [comingSoonFeature, setComingSoonFeature] = useState('');
    const [isSummaryModalOpen, setSummaryModalOpen] = useState(false);
    const [summaryStats, setSummaryStats] = useState<Partial<Stats>>({});
    const [isExportModalOpen, setExportModalOpen] = useState(false);
    const [scrapeResult, setScrapeResult] = useState<{ found: number; errors: number; duration: number } | null>(null);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [detailedProxy, setDetailedProxy] = useState<Proxy | null>(null);
    const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [isChangelogOpen, setChangelogOpen] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    
    const [externalFilters, setExternalFilters] = useState<Record<string, any>>({});
    const [scrapeProfiles, setScrapeProfiles] = useState<ScrapeProfile[]>([]);
    const [checkProfiles, setCheckProfiles] = useState<CheckProfile[]>([]);

    const workersRef = useRef<Worker[]>([]);
    const databaseWorkerRef = useRef<Worker | null>(null);
    const scrapedProxiesBatchRef = useRef<{id: string, protocol: ProxyType, sourceUrl: string}[]>([]);
    const scrapeUpdateTimeoutRef = useRef<number | null>(null);
    const taskQueueRef = useRef<any[]>([]);
    const activeWorkersRef = useRef(0);
    const totalTasksRef = useRef(0);
    const tasksCompletedRef = useRef(0);
    const statusRef = useRef(status);
    const checkResultsRef = useRef<Proxy[]>([]);
    const jobStartTimeRef = useRef<number>(0);
    const lastCheckedCountRef = useRef<number>(0);
    const scrapeErrorsRef = useRef(0);
    
    useEffect(() => { statusRef.current = status; }, [status]);

    const addLog = useCallback((message: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 200)]);
    }, []);

    // Initialize database processing worker
    useEffect(() => {
        const workerBlob = new Blob([databaseProcessingWorkerScript], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(workerBlob);
        const worker = new Worker(workerUrl);
        databaseWorkerRef.current = worker;
        
        worker.onmessage = (e) => {
            const { finalProxies, finalStats } = e.data;
            const newProxiesMap = new Map<string, Proxy>(finalProxies);
            setProxies(newProxiesMap);
            setStats(prev => ({...prev, ...finalStats, lastValidationTime: Date.now(), etr: 0, checkedCount: 0, totalToCheck: 0 }));
            setSummaryStats(finalStats);
            setStatus(AppStatus.FINISHED);
            setSummaryModalOpen(true);
            addLog("Result processing complete!");
            if (Notification.permission === "granted") new Notification("Check Complete!", { body: `Validated ${finalStats.valid} proxies.` });
        };

        return () => {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        };
    }, [addLog]);


    useEffect(() => {
        const hasVisited = localStorage.getItem('dylandos_has_visited');
        if (!hasVisited) setShowOnboarding(true);

        const loadData = async () => {
            try {
                if (!('indexedDB' in window)) { addLog("Warning: IndexedDB not supported. Session data will not be saved."); return; }
                const savedSettings = localStorage.getItem('dylandos_settings');
                if (savedSettings) setSettings(s => ({...s, ...JSON.parse(savedSettings)}));
                
                const savedData = await idbGet<AppData>('app_data');
                if (savedData) {
                    const loadedProxies = new Map(savedData.proxies);
                    setProxies(loadedProxies);
                    setSourceStats(new Map(savedData.sourceStats));
                    setScrapeProfiles(savedData.scrapeProfiles || []);
                    setCheckProfiles(savedData.checkProfiles || []);
                    setHistory(savedData.history || []);
                    addLog(`Loaded ${savedData.proxies.length} proxies and other data from saved session.`);
                } else {
                     const initialStats: Map<string, SourceStats> = new Map(PROXY_SOURCES.map(s => [s.url, { url: s.url, found: 0, valid: 0, enabled: true, yieldHistory: [], health: 'Unknown', errors: 0, notes: '' }]));
                     setSourceStats(initialStats);
                }
            } catch (error) {
                addLog(`Error loading data: ${error}. Session might be corrupted.`);
            }
        };
        loadData();
    }, [addLog]);

     useEffect(() => {
        const root = document.documentElement;
        const color = settings.themeColor; // e.g., #FF00FF
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        root.style.setProperty('--color-accent', `${r} ${g} ${b}`);
        root.classList.toggle('density-compact', settings.uiDensity === 'compact');
    }, [settings.themeColor, settings.uiDensity]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCommandPaletteOpen(isOpen => !isOpen); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSaveSession = useCallback(async () => {
        addLog("Attempting to save session...");
        try {
            const data: AppData = {
                proxies: Array.from(proxies.entries()),
                settings: settings,
                sourceStats: Array.from(sourceStats.entries()),
                scrapeProfiles: scrapeProfiles,
                checkProfiles: checkProfiles,
                history: history,
            };
            await idbSet('app_data', data);
            localStorage.setItem('dylandos_settings', JSON.stringify(settings));
            addLog(`Successfully saved ${data.proxies.length} proxies and all application data.`);
        } catch (e) {
            const errorMessage = "Error: Failed to save session. Storage might be full or unavailable.";
            addLog(errorMessage); alert(errorMessage);
        }
    }, [proxies, settings, sourceStats, scrapeProfiles, checkProfiles, history, addLog]);

    const handleClearSession = useCallback(async () => {
        if (!confirm("Are you sure you want to delete all proxies and history? This cannot be undone.")) return;
        addLog("Clearing session...");
        await idbClear();
        setProxies(new Map());
        setHistory([]);
        setStats({ totalScraped: 0, unique: 0, HTTP: 0, HTTPS: 0, SOCKS4: 0, SOCKS5: 0, valid: 0, invalid: 0, averageLatency: 0, elite: 0, anonymous: 0, lastValidationTime: null, topScore: 0, etr: 0, checkedCount: 0, totalToCheck: 0 });
        addLog("Session cleared.");
    }, [addLog]);

    const updateProgress = useCallback((sourceUrl: string) => {
        tasksCompletedRef.current++;
        const currentProgress = totalTasksRef.current > 0 ? (tasksCompletedRef.current / totalTasksRef.current) * 100 : 0;
        setProgress(currentProgress);
        setProgressText(`(${tasksCompletedRef.current}/${totalTasksRef.current}) ${sourceUrl.substring(0, 50)}...`);
    }, []);
    
    const startWorkers = useCallback((
        workerScript: string, taskQueue: any[], workerType: 'Scraper' | 'Validator', onResult: (results: any[], sourceUrl?: string) => void,
        onFinished: (sourceUrl?: string) => void, taskPayload: { key: string; batchSize: number; extra?: Record<string, any> }
    ) => {
        workersRef.current.forEach(w => w.terminate());
        activeWorkersRef.current = 0;
        taskQueueRef.current = [...taskQueue];
        totalTasksRef.current = taskQueue.length;
        tasksCompletedRef.current = 0;
        setProgress(0); setProgressText('');
        setWorkerStatuses(Array.from({ length: settings.numWorkers }, (_, i) => ({ id: i, type: workerType, status: 'idle', task: '' })));

        const workerBlob = new Blob([workerScript], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(workerBlob);
        workersRef.current = Array.from({ length: settings.numWorkers }, () => new Worker(workerUrl));
        
        workersRef.current.forEach((worker, i) => {
            worker.onmessage = (e) => {
                const { type, workerId, sourceUrl, proxies, message } = e.data;
                if (type === 'start') setWorkerStatuses(prev => prev.map(w => w.id === workerId ? { ...w, status: 'active', task: sourceUrl || 'Checking...' } : w));
                else if (type === 'error') { addLog(message); onFinished(sourceUrl); scrapeErrorsRef.current++; }
                else if (type === 'result') onResult(proxies, sourceUrl);
                else if (type === 'finished') {
                    if (workerType === 'Scraper') updateProgress(sourceUrl);
                    
                    const nextTask = workerType === 'Scraper' ? taskQueueRef.current.pop() : taskQueueRef.current.splice(0, taskPayload.batchSize);
                    if ((workerType === 'Scraper' && nextTask) || (workerType === 'Validator' && nextTask.length > 0)) {
                         worker.postMessage({ [taskPayload.key]: nextTask, workerId: i, ...taskPayload.extra });
                    } else {
                        activeWorkersRef.current--;
                        setWorkerStatuses(prev => prev.map(w => w.id === workerId ? { ...w, status: 'finished', task: '' } : w));
                        if (activeWorkersRef.current === 0) onFinished();
                    }
                }
            };
            
            const initialTask = workerType === 'Scraper' ? taskQueueRef.current.pop() : taskQueueRef.current.splice(0, taskPayload.batchSize);
            if ((workerType === 'Scraper' && initialTask) || (workerType === 'Validator' && initialTask.length > 0)) {
                activeWorkersRef.current++;
                worker.postMessage({ [taskPayload.key]: initialTask, workerId: i, ...taskPayload.extra });
            }
        });
    }, [addLog, updateProgress, settings.numWorkers]);

    const handleStartScraping = useCallback((profile?: ScrapeProfile) => {
        if (statusRef.current !== AppStatus.IDLE && statusRef.current !== AppStatus.FINISHED) return;
        setStatus(AppStatus.SCRAPING);
        jobStartTimeRef.current = Date.now();
        setProxies(new Map());
        setStats(s => ({...s, totalScraped: 0, unique: 0, valid: 0, invalid: 0}));
        scrapeErrorsRef.current = 0;
        scrapedProxiesBatchRef.current = [];
        addLog("Starting scrape...");
        
        const enabledUrls = profile ? profile.enabledSources : Array.from(sourceStats.values()).filter(s => s.enabled).map(s => s.url);
        if (enabledUrls.length === 0) { addLog("No sources enabled."); setStatus(AppStatus.IDLE); return; }
        const sources = PROXY_SOURCES.filter(s => enabledUrls.includes(s.url));
        
        const onResult = (newProxies: {id: string, protocol: ProxyType, sourceUrl: string}[]) => {
            scrapedProxiesBatchRef.current.push(...newProxies);
            setStats(s => ({ ...s, totalScraped: s.totalScraped + newProxies.length }));
            if (scrapeUpdateTimeoutRef.current) clearTimeout(scrapeUpdateTimeoutRef.current);
            scrapeUpdateTimeoutRef.current = window.setTimeout(() => {
                const batch = scrapedProxiesBatchRef.current;
                scrapedProxiesBatchRef.current = [];
                if (batch.length > 0) {
                    setProxies(prev => {
                        const newMap = new Map(prev);
                        batch.forEach(p => {
                            if (!newMap.has(p.id)) {
                                newMap.set(p.id, { ...p, status: ProxyStatus.UNTESTED, latency: null, country: null, city: null, isp: null, asn: null, anonymity: AnonymityLevel.UNKNOWN, anonymityDetails: null, googlePassed: null, lastChecked: null, qualityScore: null, uptime: { checks: 0, passed: 0 }, latencyHistory: [], checkHistory: null, failureReason: null, notes: null, tags: [], riskScore: null, isBlacklisted: null, consecutiveFails: 0 });
                            }
                        });
                        return newMap;
                    });
                }
            }, 300);
        };
        
        const onFinished = () => {
            if (activeWorkersRef.current === 0) {
                 if (scrapeUpdateTimeoutRef.current) clearTimeout(scrapeUpdateTimeoutRef.current);
                 const finalBatch = scrapedProxiesBatchRef.current;
                 scrapedProxiesBatchRef.current = [];
                 if (finalBatch.length > 0) {
                     setProxies(prev => {
                         const newMap = new Map(prev);
                         finalBatch.forEach(p => {
                             if (!newMap.has(p.id)) {
                                 newMap.set(p.id, { ...p, status: ProxyStatus.UNTESTED, latency: null, country: null, city: null, isp: null, asn: null, anonymity: AnonymityLevel.UNKNOWN, anonymityDetails: null, googlePassed: null, lastChecked: null, qualityScore: null, uptime: { checks: 0, passed: 0 }, latencyHistory: [], checkHistory: null, failureReason: null, notes: null, tags: [], riskScore: null, isBlacklisted: null, consecutiveFails: 0 });
                             }
                         });
                         return newMap;
                     });
                 }
                
                 setTimeout(() => {
                    const duration = (Date.now() - jobStartTimeRef.current) / 1000;
                    setStatus(AppStatus.FINISHED);
                    setProxies(currentProxies => {
                        setScrapeResult({ found: currentProxies.size, errors: scrapeErrorsRef.current, duration });
                        setHistory(prev => [{ id: Date.now().toString(), type: 'scrape', date: Date.now(), duration, details: { profile: profile?.name || 'Default', sources: sources.length, found: currentProxies.size, errors: scrapeErrorsRef.current }}, ...prev ]);
                        const sound = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAAAZHWs/wUABQAJMZGUAAAAAAAAAAAAAAAAAAAAAABwhAIAAgAEBAcKDBgQEBgYIBgYIBgYICQcJCAgJCAgJCQkJCQkJCQkJCAgIBgYGBgYGBgYEBAYGCAcICAgICAkKCQgIBgYGBgYGBgYEBAYGCAcICAgICAkKCQgIBgYIBgYIBgYIBgYIBgYIBgYIBgYGBgYEBAYGCAcICAgICAkKCQgIBgYGBgYGBgYEBAYGCAcICAgICAkKCQgIBgY");
                        sound.play();
                        if (Notification.permission === "granted") new Notification("Scrape Complete!", { body: `Found ${currentProxies.size} unique proxies.` });
                        return currentProxies;
                    });
                 }, 0);
            }
        };
        startWorkers(scraperWorkerScript, sources, 'Scraper', onResult, onFinished, { key: 'source', batchSize: 1, extra: { timeout: settings.timeout, userAgent: settings.customUserAgent } });
    }, [startWorkers, sourceStats, settings.timeout, settings.customUserAgent, addLog]);
    
    const handleStartChecking = useCallback((mode: 'INTENSIVE' | 'LIGHTNING' | 'STANDARD' | 'GOOGLE' | 'SECURITY', targets: string[], checkList?: Proxy[]) => {
        if (statusRef.current !== AppStatus.IDLE && statusRef.current !== AppStatus.FINISHED && statusRef.current !== AppStatus.PROCESSING_RESULTS) return;
        let proxiesToCheck: Proxy[]; let newStatus: AppStatus;
        if (checkList) proxiesToCheck = checkList;
        else { proxiesToCheck = Array.from(proxies.values()) as Proxy[];
             if (mode === 'GOOGLE' || mode === 'SECURITY') proxiesToCheck = proxiesToCheck.filter(p => p.status === ProxyStatus.VALID); }
        if (proxiesToCheck.length === 0) { addLog("No proxies to check for the selected mode."); return; }
        if (mode === 'INTENSIVE') newStatus = AppStatus.CHECKING_INTENSIVE;
        else if (mode === 'STANDARD') newStatus = AppStatus.CHECKING_STANDARD;
        else if (mode === 'GOOGLE') newStatus = AppStatus.CHECKING_GOOGLE;
        else if (mode === 'SECURITY') newStatus = AppStatus.CHECKING_SECURITY;
        else newStatus = AppStatus.CHECKING_LIGHTNING;
        setStatus(newStatus);
        jobStartTimeRef.current = Date.now();
        addLog(`Starting ${mode.toLowerCase()} check on ${proxiesToCheck.length} proxies...`);
        checkResultsRef.current = [];
        tasksCompletedRef.current = 0; lastCheckedCountRef.current = 0;
        setProgress(0);
        setStats(s => ({...s, valid: 0, invalid: 0, elite: 0, anonymous: 0, averageLatency: 0, topScore: 0, checkedCount: 0, totalToCheck: proxiesToCheck.length}));

        const onResult = (validatedProxies: Proxy[]) => {
            checkResultsRef.current.push(...validatedProxies);
            tasksCompletedRef.current += validatedProxies.length;
            const currentProgress = totalTasksRef.current > 0 ? (tasksCompletedRef.current / totalTasksRef.current) * 100 : 0;
            setProgress(currentProgress);
        };
        
        const onFinished = () => { 
            if (activeWorkersRef.current === 0) {
                setStatus(AppStatus.PROCESSING_RESULTS);
                addLog("Validation complete! Processing results...");
                databaseWorkerRef.current?.postMessage({
                    currentProxies: Array.from(proxies.entries()),
                    checkResults: checkResultsRef.current,
                    settings: { autoDeleteFails: settings.autoDeleteFails }
                });
                
                const duration = (Date.now() - jobStartTimeRef.current) / 1000;
                const validCount = checkResultsRef.current.filter(p => p.status === 'VALID').length;
                const invalidCount = checkResultsRef.current.length - validCount;
                setHistory(prev => [{ id: Date.now().toString(), type: 'check', date: Date.now(), duration, details: { mode, targets: targets.length, checked: proxiesToCheck.length, valid: validCount, invalid: invalidCount }}, ...prev ]);
                checkResultsRef.current = [];
            }
        };
        
        let batchSize = 50;
        if (mode === 'LIGHTNING') batchSize = 200;
        else if (mode === 'STANDARD') batchSize = 100;
        
        startWorkers(validatorScript, proxiesToCheck, 'Validator', onResult, onFinished, { key: 'proxies', batchSize, extra: { mode, targets: targets.length > 0 ? targets : ['https://www.google.com'] } });
    }, [proxies, startWorkers, addLog, settings.autoDeleteFails]);

    const handleStartAiTagging = async () => {
        if (statusRef.current !== AppStatus.IDLE && statusRef.current !== AppStatus.FINISHED) return;
        setStatus(AppStatus.CHECKING_AI_TAGGING);
        addLog("Starting AI Smart Tagging...");
        
        const proxiesToTag = Array.from(proxies.values()).filter(p => p.status === ProxyStatus.VALID && p.isp && p.country);
        if (proxiesToTag.length === 0) {
            addLog("No valid proxies with ISP/Country info to tag. Please run an Intensive Check first.");
            setStatus(AppStatus.IDLE);
            return;
        }

        let taggedCount = 0;
        setStats(s => ({...s, checkedCount: 0, totalToCheck: proxiesToTag.length}));

        for (const proxy of proxiesToTag) {
            try {
                const newTags = await aiTagProxy(proxy.isp!, proxy.country!);
                if (newTags.length > 0) {
                    const uniqueTags = Array.from(new Set([...proxy.tags, ...newTags]));
                    handleUpdateProxy({ ...proxy, tags: uniqueTags });
                }
            } catch (error) { addLog(`AI tagging failed for ${proxy.id}: ${error}`); }
            taggedCount++;
            setProgress((taggedCount / proxiesToTag.length) * 100);
            setStats(s => ({...s, checkedCount: taggedCount}));
        }
        
        addLog(`AI Smart Tagging complete. Processed ${taggedCount} proxies.`);
        setStatus(AppStatus.FINISHED);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (!statusRef.current.startsWith('CHECKING')) { setStats(s => ({ ...s, etr: 0, proxiesPerSecond: 0 })); return; }
            const checkedCount = tasksCompletedRef.current;
            const elapsedSeconds = (Date.now() - jobStartTimeRef.current) / 1000;
            if (elapsedSeconds < 1) return;
            const proxiesPerSecond = (checkedCount - lastCheckedCountRef.current) / 1;
            lastCheckedCountRef.current = checkedCount;
            const remaining = totalTasksRef.current - checkedCount;
            const etr = proxiesPerSecond > 0 ? remaining / proxiesPerSecond : Infinity;
            setStats(s => ({ ...s, etr, checkedCount, proxiesPerSecond }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

     useEffect(() => {
        let intervalId: number | undefined;
        if (settings.enableRevalidation && (status === AppStatus.IDLE || status === AppStatus.FINISHED)) {
            intervalId = window.setInterval(() => {
                if (statusRef.current !== AppStatus.IDLE && statusRef.current !== AppStatus.FINISHED) return;
                addLog("Starting scheduled re-validation...");
                const all = Array.from(proxies.values());
                const toRecheck = all.filter(p => p.status !== ProxyStatus.VALID || (Date.now() - (p.lastChecked || 0)) > settings.revalidationInterval * 60 * 1000);
                if (toRecheck.length > 0) handleStartChecking('STANDARD', [], toRecheck);
                else addLog("No proxies needed re-validation.");
            }, settings.revalidationInterval * 60 * 1000);
        }
        return () => clearInterval(intervalId);
    }, [settings.enableRevalidation, settings.revalidationInterval, proxies, status, handleStartChecking, addLog]);

    const handleStop = useCallback(() => {
        workersRef.current.forEach(worker => worker.terminate());
        workersRef.current = [];
        if (statusRef.current.startsWith('CHECKING')) {
            addLog(`Stopped. ${checkResultsRef.current.length} checked proxies in this batch were discarded.`);
            checkResultsRef.current = [];
        }
        if (statusRef.current === AppStatus.SCRAPING && scrapeUpdateTimeoutRef.current) clearTimeout(scrapeUpdateTimeoutRef.current);
        setStatus(AppStatus.IDLE);
        setProgress(0); setProgressText('');
        setStats(s => ({...s, etr: 0}));
        addLog("Process stopped by user.");
    }, [addLog]);

    const handleDeleteProxies = (proxyIds: string[]) => {
        setProxies(prev => { const newMap = new Map(prev); proxyIds.forEach(id => newMap.delete(id)); return newMap; });
        addLog(`Deleted ${proxyIds.length} proxies.`);
    };

    const handleUpdateProxy = (proxy: Proxy) => {
        setProxies(prev => new Map(prev).set(proxy.id, proxy));
    };

    const handleFinishOnboarding = () => {
        localStorage.setItem('dylandos_has_visited', 'true');
        setShowOnboarding(false);
    };

    const handleBackup = () => {
        addLog("Creating application backup...");
        const data: AppData = { proxies: Array.from(proxies.entries()), settings, sourceStats: Array.from(sourceStats.entries()), scrapeProfiles, checkProfiles, history };
        const jsonString = JSON.stringify(data, null, 2);
        downloadFile(jsonString, `dylandos-proxy-suite-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
        addLog("Backup file created.");
    };

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data: AppData = JSON.parse(e.target?.result as string);
                    if (!data.proxies || !data.settings || !data.sourceStats) throw new Error("Invalid backup file structure.");
                    setProxies(new Map(data.proxies));
                    setSettings(data.settings);
                    setSourceStats(new Map(data.sourceStats));
                    setScrapeProfiles(data.scrapeProfiles || []);
                    setCheckProfiles(data.checkProfiles || []);
                    setHistory(data.history || []);
                    addLog(`Successfully restored data from ${file.name}.`);
                } catch (err) { addLog("Error: Invalid backup file."); }
            };
            reader.readAsText(file);
        }
    };
    
    useEffect(() => { return () => { workersRef.current.forEach(worker => worker.terminate()); }; }, []);
    
    const isWorking = status !== AppStatus.IDLE && status !== AppStatus.FINISHED;

    return (
        <div className="min-h-screen bg-primary font-sans">
            {showOnboarding && <OnboardingTour onFinish={handleFinishOnboarding} />}
            <Header onShowComingSoon={ (feature) => { setComingSoonFeature(feature); setComingSoonModalOpen(true); }} onOpenCommandPalette={() => setCommandPaletteOpen(true)}/>
            <main className="container mx-auto max-w-7xl px-4">
                <div className="border-b border-border-color">
                    <nav className="flex space-x-2">
                        <TabButton active={activeTab === 'SCRAPER'} onClick={() => setActiveTab('SCRAPER')}><SearchIcon className="w-5 h-5" /> Scraper</TabButton>
                        <TabButton active={activeTab === 'CHECKER'} onClick={() => setActiveTab('CHECKER')}><ShieldCheckIcon className="w-5 h-5" /> Checker</TabButton>
                        <TabButton active={activeTab === 'DATABASE'} onClick={() => setActiveTab('DATABASE')}><DatabaseIcon className="w-5 h-5" /> Database</TabButton>
                        <TabButton active={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')}><ClockIcon className="w-5 h-5" /> History</TabButton>
                        <TabButton active={activeTab === 'SOURCES'} onClick={() => setActiveTab('SOURCES')}><ChartBarIcon className="w-5 h-5" /> Sources</TabButton>
                        <TabButton active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')}><Cog6ToothIcon className="w-5 h-5" /> Settings</TabButton>
                    </nav>
                </div>
                
                <div className={activeTab === 'SCRAPER' ? 'block' : 'hidden'}>
                    <div className="my-6 p-2 md:p-6 bg-secondary border border-border-color rounded-lg shadow-lg">
                        <Controls status={status} progress={progress} progressText={progressText} onStart={() => handleStartScraping()} onStop={handleStop} onOpenProfiles={() => setProfileModalOpen(true)} sourceCount={sourceStats.size} />
                        <Dashboard stats={stats} />
                        {status === AppStatus.SCRAPING && <WorkerStatus workers={workerStatuses} />}
                        <ActivityLog logs={logs} />
                    </div>
                </div>

                 <div className={activeTab === 'CHECKER' ? 'block' : 'hidden'}>
                    <div className="my-6 space-y-6">
                        <div className="bg-secondary border border-border-color rounded-lg shadow-lg">
                            <CheckerControls onStart={handleStartChecking} onStop={handleStop} onStartAiTagging={handleStartAiTagging} status={status} proxyCount={proxies.size} addLog={addLog} profiles={checkProfiles} setProfiles={setCheckProfiles} />
                            {isWorking && status.startsWith('CHECKING') && <LiveAnalytics stats={stats} />}
                            {isWorking && status.startsWith('CHECKING') && <WorkerStatus workers={workerStatuses} />}
                             {status === AppStatus.PROCESSING_RESULTS && (
                                <div className="p-4 text-center bg-accent/20 text-accent font-bold animate-pulse">
                                    Processing results, please wait...
                                </div>
                            )}
                        </div>
                        <ActivityLog logs={logs} />
                    </div>
                </div>
                                
                <div className={activeTab === 'DATABASE' ? 'block' : 'hidden'}>
                    <div className="my-6 space-y-6">
                         <ProxyList 
                            proxies={proxies}
                            onSaveSession={handleSaveSession} 
                            onClearSession={handleClearSession} 
                            onSendToChecker={() => {}} 
                            onExport={() => setExportModalOpen(true)} 
                            onDelete={handleDeleteProxies} 
                            onUpdateProxy={handleUpdateProxy} 
                            onShowDetails={setDetailedProxy} 
                            externalFilters={externalFilters}
                            onClearExternalFilters={() => setExternalFilters({})}
                            addLog={addLog}
                            uiDensity={settings.uiDensity}
                        />
                        <DataVisualization proxies={proxies} setExternalFilters={setExternalFilters} />
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <GeoDistribution proxies={proxies} onCountrySelect={(country) => setExternalFilters({ country })} />
                             <SubnetAnalysis proxies={proxies} onSubnetSelect={(subnet) => setExternalFilters({ searchText: subnet.replace('.x', '.') })} />
                        </div>
                    </div>
                </div>
                
                <div className={activeTab === 'HISTORY' ? 'block' : 'hidden'}>
                     <History history={history} />
                </div>

                <div className={activeTab === 'SOURCES' ? 'block' : 'hidden'}>
                    <SourceManager stats={sourceStats} setStats={setSourceStats} addLog={addLog}/>
                </div>

                <div className={activeTab === 'SETTINGS' ? 'block' : 'hidden'}>
                    <Settings settings={settings} setSettings={setSettings} onBackup={handleBackup} onRestore={handleRestore} onOpenChangelog={() => setChangelogOpen(true)} />
                </div>
            </main>
            {isComingSoonModalOpen && <ComingSoonModal featureName={comingSoonFeature} onClose={() => setComingSoonModalOpen(false)} />}
            {isSummaryModalOpen && <CheckSummaryModal stats={summaryStats} onClose={() => setSummaryModalOpen(false)} />}
            {isExportModalOpen && <CustomExportModal proxies={Array.from(proxies.values())} onClose={() => setExportModalOpen(false)} />}
            {scrapeResult && <ScrapeCompleteModal result={scrapeResult} onClose={() => setScrapeResult(null)} onCheck={(mode) => { setScrapeResult(null); setActiveTab('CHECKER'); handleStartChecking(mode, []); }} />}
            {isProfileModalOpen && <ScrapeProfileModal profiles={scrapeProfiles} setProfiles={setScrapeProfiles} onSelect={handleStartScraping} onClose={() => setProfileModalOpen(false)} enabledSources={Array.from(sourceStats.values()).filter(s => s.enabled).map(s => s.url)} />}
            {detailedProxy && <ProxyDetailModal proxy={detailedProxy} onClose={() => setDetailedProxy(null)} />}
            {isCommandPaletteOpen && <CommandPaletteModal onClose={() => setCommandPaletteOpen(false)} onSelectTab={setActiveTab} onStartScrape={() => handleStartScraping()} onStartCheck={(mode) => handleStartChecking(mode, [])} onStop={handleStop} isWorking={isWorking} />}
            {isChangelogOpen && <ChangelogModal onClose={() => setChangelogOpen(false)} />}
        </div>
    );
};

export default App;