
import React from 'react';
import XMarkIcon from '../icons/XMarkIcon';

interface ChangelogModalProps {
    onClose: () => void;
}

const changelog = [
    {
        version: "v0.2.0-alpha",
        date: "2024-07-28",
        changes: [
            "Added new 'History & Reports' tab to track all jobs.",
            "Implemented interactive analytics charts in the Database tab.",
            "Added Filter Presets and Checker Profiles for power users.",
            "Introduced Theme Customization and UI Density settings.",
            "Added full Application Backup & Restore functionality.",
            "Upgraded Source Manager with search, filters, and notes.",
            "Added Bulk Edit functionality for tags and notes.",
        ]
    },
    {
        version: "v0.1.0",
        date: "2024-07-20",
        changes: [
            "Initial release of Dylandos Ultimate Proxy Suite.",
            "Core features: Scraper, Checker, and Database.",
            "AI-powered natural language filtering and source analysis.",
        ]
    }
];

const ChangelogModal: React.FC<ChangelogModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-secondary p-8 rounded-lg border border-border-color shadow-2xl max-w-2xl w-full relative h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"><XMarkIcon className="w-6 h-6" /></button>
                <h2 className="text-3xl font-bold text-accent mb-4">Changelog</h2>
                <div className="flex-grow overflow-y-auto pr-4">
                    {changelog.map(entry => (
                        <div key={entry.version} className="mb-6">
                            <h3 className="text-xl font-bold text-text-primary">{entry.version} <span className="text-sm font-normal text-text-secondary">- {entry.date}</span></h3>
                            <ul className="list-disc list-inside mt-2 text-text-primary space-y-1">
                                {entry.changes.map((change, index) => (
                                    <li key={index}>{change}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChangelogModal;
