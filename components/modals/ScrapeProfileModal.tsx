
import React, { useState } from 'react';
import { ScrapeProfile } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';
import TrashIcon from '../icons/TrashIcon';

interface ScrapeProfileModalProps {
    profiles: ScrapeProfile[];
    setProfiles: React.Dispatch<React.SetStateAction<ScrapeProfile[]>>;
    onSelect: (profile: ScrapeProfile) => void;
    onClose: () => void;
    enabledSources: string[];
}

const ScrapeProfileModal: React.FC<ScrapeProfileModalProps> = ({ profiles, setProfiles, onSelect, onClose, enabledSources }) => {
    const [newProfileName, setNewProfileName] = useState('');

    const handleSave = () => {
        if (!newProfileName.trim()) return;
        const newProfile: ScrapeProfile = {
            name: newProfileName,
            enabledSources: enabledSources,
        };
        setProfiles(prev => [...prev.filter(p => p.name !== newProfileName), newProfile]);
        setNewProfileName('');
    };

    const handleDelete = (profileName: string) => {
        setProfiles(prev => prev.filter(p => p.name !== profileName));
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-secondary p-8 rounded-lg border border-border-color shadow-2xl max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"><XMarkIcon className="w-6 h-6" /></button>
                <h2 className="text-3xl font-bold text-accent mb-4">Scraper Profiles</h2>
                <p className="text-text-secondary mb-6">Save and load collections of enabled proxy sources.</p>

                <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold">Save Current Configuration</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newProfileName}
                            onChange={e => setNewProfileName(e.target.value)}
                            placeholder="New Profile Name"
                            className="w-full bg-primary p-2 border border-border-color rounded-md text-sm placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <button onClick={handleSave} className="px-4 py-2 text-sm font-bold text-primary bg-accent rounded-md hover:brightness-110">Save</button>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Load Profile</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {profiles.length > 0 ? profiles.map(p => (
                            <div key={p.name} className="flex justify-between items-center p-2 bg-primary/50 rounded-md">
                                <span>{p.name} <span className="text-xs text-text-secondary">({p.enabledSources.length} sources)</span></span>
                                <div className="flex gap-2">
                                    <button onClick={() => { onSelect(p); onClose(); }} className="px-3 py-1 text-xs font-bold bg-accent/20 text-accent rounded-md hover:bg-accent/40">Load & Scrape</button>
                                    <button onClick={() => handleDelete(p.name)} className="p-1 text-danger hover:bg-danger/20 rounded-md"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )) : <p className="text-sm text-text-secondary text-center p-4">No saved profiles.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScrapeProfileModal;
