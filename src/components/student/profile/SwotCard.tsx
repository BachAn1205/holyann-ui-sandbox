'use client';
import React from 'react';

interface SwotCardProps {
    title: string;
    items: string[];
    icon: React.ReactNode;
    variant: 'success' | 'danger' | 'warning' | 'info';
}

export const SwotCard: React.FC<SwotCardProps> = ({title, items, icon, variant}) => {
    // Define color schemes based on variant to match the clean UI
    const styles = {
        success: {
            bg: 'bg-emerald-50 dark:bg-emerald-900',
            text: 'text-emerald-700 dark:text-emerald-200',
            border: 'border-emerald-200 dark:border-emerald-800',
            iconBg: 'bg-emerald-100 dark:bg-emerald-800'
        },
        danger: {
            bg: 'bg-red-50 dark:bg-red-900',
            text: 'text-red-700 dark:text-red-200',
            border: 'border-red-200 dark:border-red-800',
            iconBg: 'bg-red-100 dark:bg-red-800'
        },
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-900',
            text: 'text-amber-700 dark:text-amber-200',
            border: 'border-amber-200 dark:border-amber-800',
            iconBg: 'bg-amber-100 dark:bg-amber-800'
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900',
            text: 'text-blue-700 dark:text-blue-200',
            border: 'border-blue-200 dark:border-blue-800',
            iconBg: 'bg-blue-100 dark:bg-blue-800'
        },
    };

    const currentStyle = styles[variant];

    return (
        <div
            className={`h-full bg-white dark:bg-slate-900 rounded-xl border ${currentStyle.border} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col`}>
            {/* Card Header */}
            <div
                className={`px-5 py-4 border-b ${currentStyle.border} ${currentStyle.bg} rounded-t-xl flex items-center gap-3`}>
                <div className={`p-2 rounded-lg ${currentStyle.iconBg} ${currentStyle.text}`}>
                    {icon}
                </div>
                <h3 className={`font-bold text-lg ${currentStyle.text}`}>{title}</h3>
            </div>

            {/* Card Body */}
            <div className="p-5 flex-grow">
                <ul className="space-y-3">
                    {items.map((item, index) => (
                        <li key={index}
                            className="flex items-start text-gray-700 dark:text-gray-300 text-sm leading-relaxed group">
                            <span
                                className={`mr-3 mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-current opacity-60 ${currentStyle.text}`}></span>
                            <span
                                className="group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{item}</span>
                        </li>
                    ))}
                    {items.length === 0 && (
                        <li className="text-gray-400 dark:text-gray-500 italic text-sm py-2">Đang chờ dữ liệu phân
                            tích...</li>
                    )}
                </ul>
            </div>
        </div>
    );
};
