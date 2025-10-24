
import React from 'react';

export interface WorkerInfo {
    id: number;
    type: 'Scraper' | 'Validator';
    status: 'idle' | 'active' | 'finished';
    task: string;
}

interface WorkerStatusProps {
    workers: WorkerInfo[];
}

const WorkerStatus: React.FC<WorkerStatusProps> = ({ workers }) => {
    const getStatusColor = (status: WorkerInfo['status']) => {
        switch (status) {
            case 'active':
                return 'bg-accent animate-pulse';
            case 'finished':
                return 'bg-success';
            case 'idle':
            default:
                return 'bg-gray-600';
        }
    };

    return (
        <div className="p-4 bg-secondary border border-border-color rounded-lg">
            <h3 className="text-lg font-bold mb-3 text-text-primary">Worker Status</h3>
            <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-2">
                {workers.map(worker => (
                    <div key={`${worker.type}-${worker.id}`} className="flex flex-col items-center" title={`${worker.type} #${worker.id} - ${worker.status}\n${worker.task || ''}`}>
                         <div className={`w-full h-4 rounded ${getStatusColor(worker.status)} transition-colors`}></div>
                         <span className="text-xs mt-1 text-text-secondary">{worker.id + 1}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WorkerStatus;