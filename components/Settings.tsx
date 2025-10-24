


import React, { useRef } from 'react';
import { AppSettings } from '../types';

interface SettingsProps {
    settings: AppSettings;
    setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
    onBackup: () => void;
    onRestore: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onOpenChangelog: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, setSettings, onBackup, onRestore, onOpenChangelog }) => {
    const maxWorkers = navigator.hardwareConcurrency || 16;
    const restoreInputRef = useRef<HTMLInputElement>(null);
    
    const handleValueChange = (key: keyof AppSettings, value: any) => {
        setSettings(s => ({ ...s, [key]: value }));
    };

    const themeColors = [
        { name: 'Neon Pink', value: '#FF00FF' },
        { name: 'Neon Green', value: '#39FF14' },
        { name: 'Neon Blue', value: '#00BFFF' },
        { name: 'Neon Orange', value: '#FF6600' },
    ];
    
    return (
        <div className="my-6 p-6 bg-secondary border border-border-color rounded-lg shadow-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Application Settings</h2>
            
            <div className="space-y-8 divide-y divide-border-color">

                <div className="pt-4">
                    <h3 className="text-xl font-bold text-accent mb-4">Appearance</h3>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold text-text-primary mb-2">Theme Color</label>
                            <div className="flex gap-4">
                                {themeColors.map(color => (
                                    <button key={color.value} onClick={() => handleValueChange('themeColor', color.value)} className={`w-10 h-10 rounded-full transition-all ${settings.themeColor === color.value ? 'ring-2 ring-offset-2 ring-offset-secondary ring-white' : ''}`} style={{ backgroundColor: color.value }} title={color.name}></button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                             <div>
                                <label htmlFor="uiDensity" className="text-lg font-semibold text-text-primary">UI Density</label>
                                <p className="text-sm text-text-secondary">Use compact spacing in lists to see more data at once.</p>
                            </div>
                             <button onClick={() => handleValueChange('uiDensity', settings.uiDensity === 'compact' ? 'comfortable' : 'compact')} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.uiDensity === 'compact' ? 'bg-accent' : 'bg-border-color'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.uiDensity === 'compact' ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    <h3 className="text-xl font-bold text-accent mb-4">Performance</h3>
                    <div>
                        <label htmlFor="numWorkers" className="block text-lg font-semibold text-text-primary mb-2">
                            Concurrent Workers: <span className="text-accent font-mono">{settings.numWorkers}</span>
                        </label>
                        <p className="text-sm text-text-secondary mb-3">Controls how many tasks (scraping, checking) are run in parallel. Higher values are faster but use more CPU.</p>
                        <input id="numWorkers" type="range" min="1" max={maxWorkers} step="1" value={settings.numWorkers} onChange={(e) => handleValueChange('numWorkers', Number(e.target.value))} className="w-full h-2 bg-primary rounded-lg appearance-none cursor-pointer accent-accent" />
                    </div>

                    <div className="mt-6">
                        <label htmlFor="timeout" className="block text-lg font-semibold text-text-primary mb-2">Network Timeout (ms)</label>
                        <input id="timeout" type="number" min="1000" max="60000" step="1000" value={settings.timeout} onChange={(e) => handleValueChange('timeout', Number(e.target.value))} className="w-full bg-primary p-3 border border-border-color rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>

                     <div className="mt-6">
                        <label htmlFor="customUserAgent" className="block text-lg font-semibold text-text-primary mb-2">Custom User-Agent</label>
                         <p className="text-sm text-text-secondary mb-3">Use a custom User-Agent for scraping to potentially bypass simple blocks. Leave blank for default.</p>
                        <input id="customUserAgent" type="text" placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..." value={settings.customUserAgent} onChange={(e) => handleValueChange('customUserAgent', e.target.value)} className="w-full bg-primary p-3 border border-border-color rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                </div>

                <div className="pt-8">
                    <h3 className="text-xl font-bold text-accent mb-4">Database Automation</h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                             <div>
                                <label htmlFor="enableRevalidation" className="text-lg font-semibold text-text-primary">Continuous Re-validation</label>
                                <p className="text-sm text-text-secondary">Automatically re-check proxies in the background.</p>
                            </div>
                             <input id="enableRevalidation" type="checkbox" checked={settings.enableRevalidation} onChange={(e) => handleValueChange('enableRevalidation', e.target.checked)} className="w-6 h-6 bg-primary border-border-color rounded text-accent focus:ring-accent accent-accent" />
                        </div>
                        
                        <div>
                            <label htmlFor="revalidationInterval" className="block text-lg font-semibold text-text-primary mb-2">Re-validation Interval</label>
                            <select id="revalidationInterval" value={settings.revalidationInterval} onChange={(e) => handleValueChange('revalidationInterval', Number(e.target.value))} disabled={!settings.enableRevalidation} className="w-full bg-primary p-3 border border-border-color rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50">
                                <option value="15">Every 15 minutes</option>
                                <option value="30">Every 30 minutes</option>
                                <option value="60">Every 60 minutes</option>
                            </select>
                        </div>

                         <div>
                            <label htmlFor="autoDeleteFails" className="block text-lg font-semibold text-text-primary mb-2">Auto-delete Threshold</label>
                            <p className="text-sm text-text-secondary mb-3">Automatically delete a proxy after it fails this many consecutive checks. Set to 0 to disable.</p>
                            <input id="autoDeleteFails" type="number" min="0" max="20" step="1" value={settings.autoDeleteFails} onChange={(e) => handleValueChange('autoDeleteFails', Number(e.target.value))} className="w-full bg-primary p-3 border border-border-color rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-accent" />
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    <h3 className="text-xl font-bold text-accent mb-4">Data Management</h3>
                    <p className="text-sm text-text-secondary mb-3">Save or load your entire application state, including proxies, settings, and history.</p>
                    <div className="flex gap-4">
                        <button onClick={onBackup} className="flex-1 bg-accent/20 text-accent font-bold py-3 rounded-lg hover:bg-accent/40 transition-colors">Backup Data</button>
                        <button onClick={() => restoreInputRef.current?.click()} className="flex-1 bg-accent/20 text-accent font-bold py-3 rounded-lg hover:bg-accent/40 transition-colors">Restore Data</button>
                        <input type="file" accept=".json" ref={restoreInputRef} onChange={onRestore} className="hidden" />
                    </div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                    <button onClick={onOpenChangelog} className="text-sm text-accent hover:underline">View Changelog</button>
                    <p className="text-xs text-text-secondary">Settings are saved automatically to your browser.</p>
                </div>
            </div>
        </div>
    );
};

export default Settings;