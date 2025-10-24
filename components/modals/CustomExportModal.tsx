
import React, { useState } from 'react';
import XMarkIcon from '../icons/XMarkIcon';
import { Proxy } from '../../types';
import { downloadFile } from '../../lib/utils';

interface CustomExportModalProps {
    proxies: Proxy[];
    onClose: () => void;
}

const CustomExportModal: React.FC<CustomExportModalProps> = ({ proxies, onClose }) => {
    const [format, setFormat] = useState('{ip}:{port}');
    const [fileName, setFileName] = useState('proxies.txt');

    const handleExport = () => {
        const content = proxies
            .filter(p => p.status === 'VALID')
            .map(p => {
                const [ip, port] = p.id.split(':');
                return format
                    .replace('{ip}', ip)
                    .replace('{port}', port)
                    .replace('{protocol}', p.protocol.toLowerCase())
                    .replace('{country}', p.country || '')
                    .replace('{score}', String(p.qualityScore || ''));
            })
            .join('\n');
        
        downloadFile(content, fileName, 'text/plain');
        onClose();
    };

    const placeholders = ['{ip}', '{port}', '{protocol}', '{country}', '{score}'];

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
                <h2 className="text-3xl font-bold text-accent mb-4">Custom Export</h2>
                <p className="text-text-secondary mb-6">Define a custom format for your exported proxy list. Only valid proxies will be exported.</p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="format" className="block text-sm font-bold text-text-primary mb-1">Export Format</label>
                        <input
                            id="format"
                            type="text"
                            value={format}
                            onChange={(e) => setFormat(e.target.value)}
                            className="w-full bg-primary p-2 border border-border-color rounded-md font-mono text-sm"
                        />
                         <div className="flex flex-wrap gap-2 mt-2">
                            {placeholders.map(p => (
                                <button key={p} onClick={() => setFormat(f => f + p)} className="text-xs bg-border-color px-2 py-0.5 rounded text-text-secondary hover:text-text-primary">{p}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="fileName" className="block text-sm font-bold text-text-primary mb-1">File Name</label>
                        <input
                            id="fileName"
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            className="w-full bg-primary p-2 border border-border-color rounded-md text-sm"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                    <button 
                        onClick={onClose}
                        className="bg-border-color text-text-primary font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleExport}
                        className="bg-accent text-primary font-bold py-2 px-6 rounded-lg hover:bg-blue-400 transition-colors"
                    >
                        Export
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomExportModal;
