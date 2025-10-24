
import React, { useRef, useEffect } from 'react';
import CodeIcon from './icons/CodeIcon';

interface ActivityLogProps {
    logs: string[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ logs }) => {
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = 0;
        }
    }, [logs]);

    return (
        <div className="p-4 bg-secondary border border-border-color rounded-lg h-full flex flex-col">
            <h3 className="text-lg font-bold mb-3 text-text-primary flex items-center gap-2">
                <CodeIcon className="w-5 h-5" />
                Activity Log
            </h3>
            <div
                ref={logContainerRef}
                className="flex-grow bg-primary rounded p-3 font-mono text-xs text-text-secondary overflow-y-auto flex flex-col-reverse"
            >
                <div>
                {logs.map((log, index) => (
                    <p key={index} className="whitespace-pre-wrap animate-[fadeIn_0.3s_ease-out]">&raquo; {log}</p>
                ))}
                </div>
            </div>
        </div>
    );
};

export default ActivityLog;