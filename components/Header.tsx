
import React from 'react';
import CodeIcon from './icons/CodeIcon';
import CloudIcon from './icons/CloudIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import CommandLineIcon from './icons/CommandLineIcon';

interface HeaderProps {
    onShowComingSoon: (feature: string) => void;
    onOpenCommandPalette: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowComingSoon, onOpenCommandPalette }) => {
    return (
        <header className="p-6 border-b border-border-color relative">
            <div className="flex items-center justify-center gap-4 text-center">
                <CodeIcon className="w-10 h-10 text-accent" />
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-text-primary [text-shadow:0_0_8px_#FF6600]">Dylandos Ultimate Proxy Suite</h1>
                    <p className="mt-2 text-text-secondary">A world-class proxy management & analytics platform.</p>
                </div>
            </div>
            <div className="absolute top-4 left-4">
                 <button 
                    onClick={onOpenCommandPalette}
                    className="px-2 py-1 bg-secondary border border-border-color rounded-md text-xs text-text-secondary hover:text-text-primary hover:border-accent transition-colors flex items-center gap-2"
                    title="Open Command Palette"
                >
                    <CommandLineIcon className="w-4 h-4" />
                    <kbd className="font-sans text-xs">⌘</kbd>
                    <kbd className="font-sans text-xs">K</kbd>
                 </button>
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-2">
                 <button 
                    onClick={() => onShowComingSoon('Cloud Sync')}
                    className="px-3 py-2 bg-secondary border border-border-color rounded-md text-xs text-text-secondary hover:text-text-primary hover:border-accent transition-colors flex items-center gap-2"
                    title="Cloud Sync (Coming Soon)"
                >
                    <CloudIcon className="w-4 h-4"/>
                    <span>Sync</span>
                 </button>
                 <button 
                    onClick={() => onShowComingSoon('Proxy Rotator')}
                    className="px-3 py-2 bg-secondary border border-border-color rounded-md text-xs text-text-secondary hover:text-text-primary hover:border-accent transition-colors flex items-center gap-2"
                    title="Proxy Rotator (Coming Soon)"
                 >
                    <ArrowPathIcon className="w-4 h-4" />
                    <span>Rotator</span>
                 </button>
            </div>
        </header>
    );
};

export default Header;