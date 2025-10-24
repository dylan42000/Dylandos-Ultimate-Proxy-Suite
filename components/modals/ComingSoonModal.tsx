
import React from 'react';
import XMarkIcon from '../icons/XMarkIcon';

interface ComingSoonModalProps {
    featureName: string;
    onClose: () => void;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ featureName, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-opacity"
            onClick={onClose}
        >
            <div 
                className="bg-secondary p-8 rounded-lg border border-border-color shadow-2xl max-w-md w-full relative transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                <h2 className="text-3xl font-bold text-accent mb-4">{featureName}</h2>
                <p className="text-lg text-text-primary mb-2">This is a planned enterprise-level feature.</p>
                <p className="text-text-secondary">
                    Stay tuned! We're actively developing this functionality to bring even more power to the suite. 
                    Features like Cloud Sync, automated Proxy Rotators, and browser extensions will be part of future premium releases.
                </p>
            </div>
        </div>
    );
};

export default ComingSoonModal;
