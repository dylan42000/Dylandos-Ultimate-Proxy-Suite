
import React, { useState } from 'react';
import { AppStatus } from '../types';
import BellIcon from './icons/BellIcon';
import ListBulletIcon from './icons/ListBulletIcon';

interface ControlsProps {
    status: AppStatus;
    progress: number;
    progressText: string;
    onStart: () => void;
    onStop: () => void;
    onOpenProfiles: () => void;
    sourceCount: number;
}

const Controls: React.FC<ControlsProps> = ({ status, progress, progressText, onStart, onStop, onOpenProfiles, sourceCount }) => {
    const [notificationStatus, setNotificationStatus] = useState(Notification.permission);

    const isWorking = status === AppStatus.SCRAPING;
    
    const handleRequestNotification = async () => {
        const permission = await Notification.requestPermission();
        setNotificationStatus(permission);
    };

    return (
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                 <div className="md:col-span-3 text-center md:text-left">
                     <h2 className="text-2xl font-bold">Proxy Scraper</h2>
                     <p className="text-text-secondary mt-1">Gather proxies from {sourceCount} public sources. Customize sources in the 'Sources' tab.</p>
                 </div>
                <div className="space-y-2">
                    <button
                        onClick={() => isWorking ? onStop() : onStart()}
                        className={`w-full py-3 px-4 text-md font-semibold rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${
                            isWorking
                                ? 'bg-danger text-white hover:brightness-110'
                                : 'bg-accent text-primary hover:brightness-110 shadow-neon-accent'
                        }`}
                    >
                        {isWorking ? 'Stop Scraping' : 'Start Scraping'}
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handleRequestNotification}
                            disabled={notificationStatus !== 'default'}
                            title={
                                notificationStatus === 'granted' ? 'Notifications enabled' : 
                                notificationStatus === 'denied' ? 'Notifications blocked' : 'Enable notifications'
                            }
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold rounded-lg transition-colors duration-300 ease-in-out bg-secondary border border-border-color hover:bg-border-color disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <BellIcon className="w-5 h-5" />
                            <span>{notificationStatus === 'granted' ? 'Enabled' : 'Notify'}</span>
                        </button>
                         <button
                            onClick={onOpenProfiles}
                            disabled={isWorking}
                            title="Scrape Profiles"
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold rounded-lg transition-colors duration-300 ease-in-out bg-secondary border border-border-color hover:bg-border-color disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <ListBulletIcon className="w-5 h-5" />
                            <span>Profiles</span>
                        </button>
                    </div>
                </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-4 border border-border-color overflow-hidden relative">
                <div
                    className="bg-accent h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary mix-blend-lighten">
                   {isWorking ? progressText : (status !== AppStatus.IDLE ? `${progress.toFixed(0)}%` : '')}
                </span>
            </div>
        </div>
    );
};

export default Controls;