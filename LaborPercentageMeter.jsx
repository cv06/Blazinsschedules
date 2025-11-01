import React from 'react';

export default function LaborPercentageMeter({ currentPercentage, targetPercentage }) {
    const percentage = Math.min(currentPercentage, 50); // Cap at 50% for display
    const angle = (percentage / 50) * 180; // Convert to 0-180 degrees
    const isOverTarget = currentPercentage > targetPercentage;
    
    return (
        <div className="flex flex-col items-center">
            <div className="relative w-64 h-32 mb-4">
                {/* Meter Background */}
                <svg className="w-full h-full" viewBox="0 0 200 100">
                    {/* Background Arc */}
                    <path
                        d="M 20 80 A 80 80 0 0 1 180 80"
                        fill="none"
                        stroke="#EADED2"
                        strokeWidth="12"
                    />
                    
                    {/* Target Zone */}
                    <path
                        d={`M 20 80 A 80 80 0 0 1 ${20 + (targetPercentage/50) * 160} ${80 - Math.sin((targetPercentage/50) * Math.PI) * 80}`}
                        fill="none"
                        stroke="#E16B2A"
                        strokeWidth="12"
                        opacity="0.3"
                    />
                    
                    {/* Current Value Arc */}
                    <path
                        d={`M 20 80 A 80 80 0 0 1 ${20 + (percentage/50) * 160} ${80 - Math.sin((percentage/50) * Math.PI) * 80}`}
                        fill="none"
                        stroke={isOverTarget ? "#E16B2A" : "#E16B2A"}
                        strokeWidth="12"
                        strokeLinecap="round"
                    />
                    
                    {/* Needle */}
                    <line
                        x1="100"
                        y1="80"
                        x2={100 + Math.cos((angle - 90) * Math.PI / 180) * 70}
                        y2={80 + Math.sin((angle - 90) * Math.PI / 180) * 70}
                        stroke="#392F2D"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    
                    {/* Center Dot */}
                    <circle cx="100" cy="80" r="4" fill="#392F2D" />
                </svg>
                
                {/* Percentage Display */}
                <div className="absolute inset-0 flex items-end justify-center pb-2">
                    <div className="text-center">
                        <div className={`text-3xl font-bold`} style={{ color: isOverTarget ? '#E16B2A' : '#392F2D' }}>
                            {currentPercentage.toFixed(1)}%
                        </div>
                        <div className="text-xs" style={{ color: '#392F2D', opacity: 0.75 }}>
                            Target: {targetPercentage}%
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Status */}
            <div className={`px-4 py-2 rounded-full text-sm font-medium border`} style={{
                backgroundColor: isOverTarget ? '#EADED2' : currentPercentage > targetPercentage * 0.9 ? '#EADED2' : '#EADED2',
                color: isOverTarget ? '#E16B2A' : currentPercentage > targetPercentage * 0.9 ? '#E16B2A' : '#392F2D',
                borderColor: '#392F2D'
            }}>
                {isOverTarget ? 'Over Target' : currentPercentage > targetPercentage * 0.9 ? 'Near Target' : 'On Target'}
            </div>
        </div>
    );
}