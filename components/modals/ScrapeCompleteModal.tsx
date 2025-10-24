

import React from 'react';
import XMarkIcon from '../icons/XMarkIcon';

interface ScrapeCompleteModalProps {
    result: {
        found: number;
        errors: number;
        duration: number;
    };
    onClose: () => void;
    onCheck: (mode: 'LIGHTNING' | 'STANDARD') => void;
}

const ScrapeCompleteModal: React.FC<ScrapeCompleteModalProps> = ({ result, onClose, onCheck }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-secondary p-8 rounded-lg border border-border-color shadow-2xl max-w-lg w-full relative"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-bold text-accent mb-4">Scrape Complete!</h2>
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                        <p className="text-2xl font-bold text-text-primary">{result.found.toLocaleString()}</p>
                        <p className="text-xs text-text-secondary">UNIQUE PROXIES</p>
                    </div>
                     <div>
                        <p className="text-2xl font-bold text-danger">{result.errors}</p>
                        <p className="text-xs text-text-secondary">FAILED SOURCES</p>
                    </div>
                     <div>
                        <p className="text-2xl font-bold text-text-primary">{result.duration.toFixed(1)}s</p>
                        <p className="text-xs text-text-secondary">DURATION</p>
                    </div>
                </div>

                <p className="text-text-secondary mt-4 text-center">What's next? Validate these proxies to find the working ones.</p>
                <div className="mt-6 flex flex-col gap-3">
                    <button 
                        onClick={() => onCheck('LIGHTNING')}
                        className="w-full bg-success/80 hover:bg-success text-primary font-bold py-3 rounded-lg transition-colors"
                    >
                        Start Lightning Check
                    </button>
                    <button 
                        onClick={() => onCheck('STANDARD')}
                        className="w-full bg-blue-500/80 hover:bg-blue-500 text-primary font-bold py-3 rounded-lg transition-colors"
                    >
                        Start Standard Check
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full text-center text-text-secondary font-bold py-2 mt-2 hover:text-text-primary transition-colors"
                    >
                        I'll Check Manually Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScrapeCompleteModal;