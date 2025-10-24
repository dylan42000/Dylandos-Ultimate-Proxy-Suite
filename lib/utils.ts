


import { Proxy, AnonymityLevel } from '../types';

// --- IndexedDB Helpers ---
const DB_NAME = 'ProxySuiteDB';
const STORE_NAME = 'proxies';

// Check for IndexedDB support
const isIdbSupported = 'indexedDB' in window;

function openDB(): Promise<IDBDatabase> {
    if (!isIdbSupported) return Promise.reject("IndexedDB not supported");
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => reject("Error opening DB");
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

export async function idbSet(key: string, value: any): Promise<void> {
    if (!isIdbSupported) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
    if (!isIdbSupported) return undefined;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function idbClear(): Promise<void> {
    if (!isIdbSupported) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

// --- Other Utils ---

export function convertToCSV(proxies: Proxy[]): string {
    if (proxies.length === 0) {
        return '';
    }
    const headers = 'ip,port,protocol,status,latency,country,city,isp,asn,anonymity,google_passed,last_checked,quality_score,uptime,tags,notes';
    const rows = proxies.map(p => {
        const [ip, port] = p.id.split(':');
        return [
            ip,
            port,
            p.protocol,
            p.status,
            p.latency ?? '',
            p.country ?? '',
            p.city ?? '',
            p.isp ?? '',
            p.asn ?? '',
            p.anonymity,
            p.googlePassed ?? '',
            p.lastChecked ? new Date(p.lastChecked).toISOString() : '',
            p.qualityScore ?? '',
            p.uptime ? `${(p.uptime.passed / p.uptime.checks * 100).toFixed(2)}%` : 'N/A',
            p.tags.join(';'),
            p.notes || ''
        ].join(',');
    });
    return [headers, ...rows].join('\n');
}

export function downloadFile(content: string, fileName: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function calculateProxyScore(
    latency: number | null, 
    anonymity: AnonymityLevel, 
    uptime: { checks: number; passed: number; }
): number {
    if (latency === null) return 0;

    const latencyScore = Math.max(0, 40 * (1 - (Math.max(0, latency - 50)) / 1950));
    
    let anonymityScore = 0;
    if (anonymity === AnonymityLevel.ELITE) anonymityScore = 30;
    else if (anonymity === AnonymityLevel.ANONYMOUS) anonymityScore = 20;
    else if (anonymity === AnonymityLevel.TRANSPARENT) anonymityScore = 5;

    const uptimeRatio = uptime.checks > 0 ? uptime.passed / uptime.checks : 0;
    const uptimeScore = 30 * uptimeRatio;

    return Math.round(latencyScore + anonymityScore + uptimeScore);
}

export function applyTierTags(proxy: Proxy): Proxy {
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

export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function formatEtr(seconds: number): string {
    if (seconds < 0 || !isFinite(seconds)) return '...';
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}m ${remainingSeconds}s`;
}

export function getRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}