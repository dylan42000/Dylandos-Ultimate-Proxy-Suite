
import React, { useState, useEffect, useRef } from 'react';
import SearchIcon from '../icons/SearchIcon';
import XMarkIcon from '../icons/XMarkIcon';

type Command = {
    name: string;
    action: () => void;
    section: string;
    icon: React.ReactNode;
    disabled?: boolean;
};

interface CommandPaletteModalProps {
    onClose: () => void;
    onSelectTab: (tab: string) => void;
    onStartScrape: () => void;
    onStartCheck: (mode: 'INTENSIVE' | 'LIGHTNING' | 'GOOGLE') => void;
    onStop: () => void;
    isWorking: boolean;
}

const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({ onClose, onSelectTab, onStartScrape, onStartCheck, onStop, isWorking }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const commands: Command[] = [
        { name: 'Go to Scraper', action: () => onSelectTab('SCRAPER'), section: 'Navigation', icon: '🔍' },
        { name: 'Go to Live Database', action: () => onSelectTab('DATABASE'), section: 'Navigation', icon: '🗂️' },
        { name: 'Go to Sources', action: () => onSelectTab('SOURCES'), section: 'Navigation', icon: '📊' },
        { name: 'Go to Settings', action: () => onSelectTab('SETTINGS'), section: 'Navigation', icon: '⚙️' },
        { name: 'Start Scraping', action: onStartScrape, section: 'Actions', icon: '▶️', disabled: isWorking },
        { name: 'Start Lightning Check', action: () => onStartCheck('LIGHTNING'), section: 'Actions', icon: '⚡', disabled: isWorking },
        { name: 'Start Intensive Check', action: () => onStartCheck('INTENSIVE'), section: 'Actions', icon: '🔬', disabled: isWorking },
        { name: 'Stop Current Process', action: onStop, section: 'Actions', icon: '⏹️', disabled: !isWorking },
    ];

    const filteredCommands = commands.filter(cmd => 
        cmd.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        inputRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const command = filteredCommands[activeIndex];
                if (command && !command.disabled) {
                    command.action();
                    onClose();
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredCommands, activeIndex]);
    
    useEffect(() => {
        setActiveIndex(0);
    }, [searchTerm]);


    const executeCommand = (cmd: Command) => {
        if (cmd.disabled) return;
        cmd.action();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 pt-20" onClick={onClose}>
            <div 
                className="bg-secondary w-full max-w-xl rounded-lg border border-border-color shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 p-4 border-b border-border-color">
                    <SearchIcon className="w-5 h-5 text-text-secondary" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent text-text-primary placeholder-text-secondary focus:outline-none"
                    />
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                    {filteredCommands.length > 0 ? (
                        filteredCommands.map((cmd, index) => (
                            <div
                                key={cmd.name}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => executeCommand(cmd)}
                                className={`flex justify-between items-center p-3 rounded-md cursor-pointer text-sm ${
                                    activeIndex === index ? 'bg-accent/20 text-accent' : 'text-text-primary'
                                } ${cmd.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/10'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span>{cmd.icon}</span>
                                    <span>{cmd.name}</span>
                                </div>
                                <span className="text-xs bg-border-color px-2 py-0.5 rounded text-text-secondary">{cmd.section}</span>
                            </div>
                        ))
                    ) : (
                        <p className="p-4 text-center text-sm text-text-secondary">No commands found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommandPaletteModal;