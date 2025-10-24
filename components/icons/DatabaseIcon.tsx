
import React from 'react';

const DatabaseIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v1.5a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 7.5V6zM3.75 12A2.25 2.25 0 016 9.75h12A2.25 2.25 0 0120.25 12v1.5a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 13.5V12zm0 6A2.25 2.25 0 016 15.75h12a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18v-1.5z" />
    </svg>
);

export default DatabaseIcon;
