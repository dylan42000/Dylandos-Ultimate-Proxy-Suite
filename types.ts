



export enum ProxyType {
  HTTP = 'HTTP',
  HTTPS = 'HTTPS',
  SOCKS4 = 'SOCKS4',
  SOCKS5 = 'SOCKS5',
}

export enum AppStatus {
  IDLE = 'IDLE',
  SCRAPING = 'SCRAPING',
  CHECKING_INTENSIVE = 'CHECKING_INTENSIVE',
  CHECKING_LIGHTNING = 'CHECKING_LIGHTNING',
  CHECKING_STANDARD = 'CHECKING_STANDARD',
  CHECKING_GOOGLE = 'CHECKING_GOOGLE',
  CHECKING_SECURITY = 'CHECKING_SECURITY',
  CHECKING_AI_TAGGING = 'CHECKING_AI_TAGGING',
  PROCESSING_RESULTS = 'PROCESSING_RESULTS',
  FINISHED = 'FINISHED',
}

export enum ProxyStatus {
  UNTESTED = 'UNTESTED',
  VALID = 'VALID',
  INVALID = 'INVALID',
}

export enum AnonymityLevel {
  UNKNOWN = 'UNKNOWN',
  ELITE = 'ELITE',
  ANONYMOUS = 'ANONYMOUS',
  TRANSPARENT = 'TRANSPARENT',
}

export interface Proxy {
  id: string; // ip:port
  protocol: ProxyType;
  status: ProxyStatus;
  latency: number | null; // in ms
  country: string | null;
  city: string | null;
  isp: string | null;
  asn: string | null;
  anonymity: AnonymityLevel;
  anonymityDetails: string[] | null;
  googlePassed: boolean | null;
  lastChecked: number | null; // Timestamp
  qualityScore: number | null;
  uptime: { checks: number; passed: number; };
  latencyHistory: number[];
  sourceUrl: string;
  checkHistory: { target: string; passed: boolean }[] | null;
  failureReason: string | null;
  notes: string | null;
  tags: string[];
  // New fields for advanced database features
  riskScore: number | null;
  isBlacklisted: boolean | null;
  consecutiveFails: number;
}

export interface ProxySource {
  url: string;
  type: ProxyType;
  format: 'txt' | 'json';
  jsonPath?: string; // e.g., "data.proxies"
}

export interface SourceStats {
  url: string;
  found: number;
  valid: number;
  enabled: boolean;
  yieldHistory: number[];
  health: 'Good' | 'Average' | 'Poor' | 'Unknown';
  errors: number;
  notes?: string;
}

export interface Stats {
  totalScraped: number;
  unique: number;
  [ProxyType.HTTP]: number;
  [ProxyType.HTTPS]: number;
  [ProxyType.SOCKS4]: number;
  [ProxyType.SOCKS5]: number;
  valid: number;
  invalid: number;
  averageLatency: number;
  elite: number;
  anonymous: number;
  lastValidationTime: number | null;
  topScore: number;
  etr: number; // Estimated time remaining in seconds
  checkedCount: number;
  totalToCheck: number;
  proxiesPerSecond?: number;
}

export interface CheckProfile {
    name: string;
    targets: string[];
    mode: 'INTENSIVE' | 'LIGHTNING' | 'STANDARD' | 'GOOGLE' | 'SECURITY';
}

export interface ScrapeProfile {
    name: string;
    enabledSources: string[];
}

export interface HistoryEntry {
    id: string;
    type: 'scrape' | 'check';
    date: number;
    duration: number; // in seconds
    details: Record<string, any>;
}

export interface AppSettings {
    numWorkers: number;
    timeout: number;
    autoDeleteFails: number;
    enableRevalidation: boolean;
    revalidationInterval: number; // in minutes
    themeColor: string;
    uiDensity: 'comfortable' | 'compact';
    customUserAgent: string;
    autoDisableSources: boolean;
}

export interface AppData {
    proxies: [string, Proxy][];
    settings: AppSettings;
    sourceStats: [string, SourceStats][];
    scrapeProfiles: ScrapeProfile[];
    checkProfiles: CheckProfile[];
    history: HistoryEntry[];
}