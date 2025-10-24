
import React from 'react';

const CloudIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-2.43-2.43A3.75 3.75 0 0013.5 3H12a4.5 4.5 0 00-4.5 4.5v.375m1.5-1.5L12 9.75M10.5 11.25L12 9.75m0 0L13.5 11.25m-3 3v3.75" />
    </svg>
);

export default CloudIcon;
