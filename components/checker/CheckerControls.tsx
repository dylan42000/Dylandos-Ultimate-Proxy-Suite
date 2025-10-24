


import React, { useState } from 'react';
import { AppStatus, CheckProfile } from '../../types';
import InformationCircleIcon from '../icons/InformationCircleIcon';
import SparklesIcon from '../icons/SparklesIcon';
import { generateCheckProfile } from '../../lib/ai';
import ShieldCheckIcon from '../icons/ShieldCheckIcon';

interface CheckerControlsProps {
    onStart: (mode: 'INTENSIVE' | 'LIGHTNING' | 'STANDARD' | 'GOOGLE' | 'SECURITY', targets: string[]) => void;
    onStop: () => void;
    onStartAiTagging: () => void;
    status: AppStatus;
    proxyCount: number;
    addLog: (message: string) => void;
    profiles: CheckProfile[];
    setProfiles: React.Dispatch<React.SetStateAction<CheckProfile[]>>;
}

const CheckerControls: React.FC<CheckerControlsProps> = ({ onStart, onStop, onStartAiTagging, status, proxyCount, addLog, profiles, setProfiles }) => {
    const [targets, setTargets] = useState('');
    const [mode, setMode] = useState<'INTENSIVE' | 'LIGHTNING' | 'STANDARD' | 'GOOGLE' | 'SECURITY'>('STANDARD');
    const [aiProfileGoal, setAiProfileGoal] = useState('');
    const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
    
    const isWorking = status.startsWith('CHECKING');

    const handleAiGenerateProfile = async () => {
        if (!aiProfileGoal) return; setIsGeneratingProfile(true); addLog(`AI generating check profile for: "${aiProfileGoal}"`);
        try { const generatedTargets = await generateCheckProfile(aiProfileGoal); setTargets(prev => { const existing = new Set(prev.split('\n').filter(Boolean)); generatedTargets.forEach(t => existing.add(t)); return Array.from(existing).join('\n'); }); addLog(`AI added ${generatedTargets.length} target URLs.`);
        } catch (error) { addLog(`AI profile generation failed: ${error}`); } finally { setIsGeneratingProfile(false); }
    };

    const handleSaveProfile = () => {
        const name = prompt("Enter a name for this check profile:");
        if (name) {
            const newProfile: CheckProfile = { name, targets: targets.split('\n').filter(Boolean), mode };
            setProfiles(prev => [...prev.filter(p => p.name !== name), newProfile]);
            addLog(`Saved check profile "${name}".`);
        }
    };

    const handleLoadProfile = (name: string) => {
        const profile = profiles.find(p => p.name === name);
        if (profile) {
            setTargets(profile.targets.join('\n'));
            setMode(profile.mode);
            addLog(`Loaded check profile "${name}".`);
        }
    };

    const handleDeleteProfile = (name: string) => {
        if (confirm(`Are you sure you want to delete the "${name}" profile?`)) {
            setProfiles(prev => prev.filter(p => p.name !== name));
            addLog(`Deleted check profile "${name}".`);
        }
    };


    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <div><h2 className="text-2xl font-bold">Proxy Checker</h2><p className="text-text-secondary mt-1 text-sm">Validate your list of {proxyCount.toLocaleString()} proxies.</p></div>
                <button disabled={!isWorking} onClick={onStop} className="bg-danger hover:brightness-110 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50">Stop Checking</button>
            </div>
            
            <div className="p-4 bg-primary/30 border border-border-color rounded-lg space-y-3">
                 <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-text-primary">Checker Profiles</label>
                    <div className="flex gap-2">
                        <select onChange={(e) => e.target.value && handleLoadProfile(e.target.value)} disabled={isWorking} className="bg-primary border border-border-color rounded-md px-2 py-1 text-xs">
                            <option value="">Load Profile...</option>
                            {profiles.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                        <button onClick={handleSaveProfile} disabled={isWorking} className="text-xs px-2 py-1 border border-border-color rounded-md hover:bg-border-color">Save</button>
                        <button onClick={() => handleDeleteProfile(profiles[0]?.name)} disabled={isWorking || profiles.length === 0} className="text-xs text-danger disabled:opacity-50">Delete</button>
                    </div>
                 </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    <div>
                        <label htmlFor="targets" className="block text-sm font-semibold text-text-primary mb-1 flex items-center gap-1.5">
                            Multi-Target Validation <span className="group relative"><InformationCircleIcon className="w-4 h-4 text-text-secondary" /><span className="absolute bottom-full mb-2 w-64 left-1/2 -translate-x-1/2 bg-secondary text-xs p-2 rounded-md border border-border-color shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-20">Enter multiple URLs (one per line). Proxies must pass ALL targets.</span></span>
                        </label>
                        <textarea id="targets" value={targets} onChange={e => setTargets(e.target.value)} placeholder="https://www.google.com (default)&#10;https://api.ipify.org" className="w-full h-20 bg-primary p-2 border border-border-color rounded-md text-sm font-mono resize-y" disabled={isWorking} />
                        <div className="flex gap-2 items-center pt-1">
                            <SparklesIcon className="w-5 h-5 text-accent flex-shrink-0"/><input type="text" value={aiProfileGoal} onChange={e => setAiProfileGoal(e.target.value)} placeholder="AI: 'scraping sneaker sites'" className="w-full bg-primary p-2 border border-border-color rounded-md text-sm" disabled={isWorking || isGeneratingProfile} /><button onClick={handleAiGenerateProfile} disabled={isWorking || isGeneratingProfile || !aiProfileGoal} className="px-3 py-2 text-sm font-bold text-primary bg-accent rounded-md">{isGeneratingProfile ? '...' : 'Generate'}</button>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-3">
                        <button disabled={isWorking} onClick={() => onStart('LIGHTNING', targets.split('\n').filter(Boolean))} className="h-full bg-success hover:brightness-110 text-primary font-bold py-3 px-4 rounded-lg flex flex-col items-center"><span className="font-semibold">Lightning</span><span className="text-xs font-normal opacity-80 mt-1">Fast, Basic</span></button>
                        <button disabled={isWorking} onClick={() => onStart('STANDARD', targets.split('\n').filter(Boolean))} className="h-full bg-blue-500 hover:bg-blue-400 text-primary font-bold py-3 px-4 rounded-lg flex flex-col items-center"><span className="font-semibold">Standard</span><span className="text-xs font-normal opacity-80 mt-1">Balanced</span></button>
                        <button disabled={isWorking} onClick={() => onStart('INTENSIVE', targets.split('\n').filter(Boolean))} className="h-full bg-text-secondary hover:brightness-110 text-primary font-bold py-3 px-4 rounded-lg flex flex-col items-center"><span className="font-semibold">Intensive</span><span className="text-xs font-normal opacity-80 mt-1">Detailed</span></button>
                         <button disabled={isWorking} onClick={() => onStart('GOOGLE', [])} className="h-full bg-yellow-500 hover:bg-yellow-400 text-primary font-bold py-3 px-4 rounded-lg flex flex-col items-center"><span className="font-semibold">Google</span><span className="text-xs font-normal opacity-80 mt-1">Verify SEO</span></button>
                    </div>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button disabled={isWorking} onClick={() => onStart('SECURITY', [])} className="h-full bg-indigo-500 hover:bg-indigo-400 text-primary font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"><ShieldCheckIcon className="w-5 h-5" /> Security Check</button>
                <button disabled={isWorking} onClick={onStartAiTagging} className="h-full bg-pink-500 hover:bg-pink-400 text-primary font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"><SparklesIcon className="w-5 h-5" /> AI Smart Tagging</button>
            </div>
        </div>
    );
};

export default CheckerControls;