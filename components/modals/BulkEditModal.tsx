
import React, { useState } from 'react';
import { Proxy } from '../../types';
import XMarkIcon from '../icons/XMarkIcon';

interface BulkEditModalProps {
    proxies: Proxy[];
    onClose: () => void;
    onUpdate: (id: string, update: Partial<Pick<Proxy, 'tags' | 'notes'>>) => void;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({ proxies, onClose, onUpdate }) => {
    const [tagsToAdd, setTagsToAdd] = useState('');
    const [tagsToRemove, setTagsToRemove] = useState('');

    const handleApply = () => {
        const toAdd = tagsToAdd.split(',').map(t => t.trim()).filter(Boolean);
        const toRemove = tagsToRemove.split(',').map(t => t.trim()).filter(Boolean);

        proxies.forEach(p => {
            let newTags = new Set(p.tags);
            toAdd.forEach(t => newTags.add(t));
            toRemove.forEach(t => newTags.delete(t));
            onUpdate(p.id, { tags: Array.from(newTags) });
        });
        onClose();
    };
    
    const handleClearNotes = () => {
        if (confirm(`Are you sure you want to clear notes for ${proxies.length} proxies?`)) {
            proxies.forEach(p => onUpdate(p.id, { notes: '' }));
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-secondary p-8 rounded-lg border border-border-color shadow-2xl max-w-lg w-full relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"><XMarkIcon className="w-6 h-6" /></button>
                <h2 className="text-3xl font-bold text-accent mb-4">Bulk Edit Proxies</h2>
                <p className="text-text-secondary mb-6">Apply changes to all {proxies.length} selected proxies.</p>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="tagsToAdd" className="block text-sm font-bold text-text-primary mb-1">Add Tags (comma-separated)</label>
                        <input id="tagsToAdd" type="text" value={tagsToAdd} onChange={e => setTagsToAdd(e.target.value)} className="w-full bg-primary p-2 border border-border-color rounded-md font-mono text-sm" />
                    </div>
                     <div>
                        <label htmlFor="tagsToRemove" className="block text-sm font-bold text-text-primary mb-1">Remove Tags (comma-separated)</label>
                        <input id="tagsToRemove" type="text" value={tagsToRemove} onChange={e => setTagsToRemove(e.target.value)} className="w-full bg-primary p-2 border border-border-color rounded-md font-mono text-sm" />
                    </div>
                     <div>
                        <label className="block text-sm font-bold text-text-primary mb-1">Other Actions</label>
                        <button onClick={handleClearNotes} className="text-sm text-danger border border-danger/50 rounded-md px-3 py-2 hover:bg-danger/20">Clear All Notes</button>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="bg-border-color text-text-primary font-bold py-2 px-6 rounded-lg hover:bg-gray-600">Cancel</button>
                    <button onClick={handleApply} className="bg-accent text-primary font-bold py-2 px-6 rounded-lg hover:brightness-110">Apply Changes</button>
                </div>
            </div>
        </div>
    );
};

export default BulkEditModal;
