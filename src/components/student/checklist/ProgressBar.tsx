import React from 'react';

interface ProgressBarProps {
    percentage: number;
    colorClass?: string;
    showLabel?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, colorClass = 'bg-primary', showLabel = true }) => {
    const clampedPercentage = Math.min(100, Math.max(0, percentage));
    const isDefault = colorClass === 'bg-primary';
    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-medium text-muted-foreground">Tiến độ giai đoạn</span>
                    <span className="text-sm font-semibold text-foreground">{Math.round(clampedPercentage)}%</span>
                </div>
            )}
            <div className="w-full bg-muted/80 dark:bg-muted/60 rounded-full h-2.5 overflow-hidden">
                <div
                    className={`h-2.5 rounded-full transition-all duration-500 ease-out ${isDefault ? 'bg-gradient-to-r from-emerald-500 to-primary' : colorClass}`}
                    style={{ width: `${clampedPercentage}%` }}
                />
            </div>
        </div>
    );
};
export default ProgressBar;