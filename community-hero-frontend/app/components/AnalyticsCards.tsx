'use client';

import { BarChart3, AlertOctagon, Building2 } from 'lucide-react';

interface CivicIssue {
    id: string;
    category: string;
    severity: string;
    department: string;
    title: string;
    summary: string;
    latitude: number;
    longitude: number;
    status: string;
}

interface AnalyticsProps {
    issues: CivicIssue[];
    activeFilter: string;
    setActiveFilter: (filter: string) => void;
    healthScore?: number;
}

export default function AnalyticsCards({ issues, activeFilter, setActiveFilter, healthScore = 85 }: AnalyticsProps) {
    const totalReports = issues.length;

    const urgentCount = issues.filter((issue) => {
        const s = issue.severity?.toLowerCase();
        return s === 'critical' || s === 'high';
    }).length;

    const departmentCounts: Record<string, number> = {};
    issues.forEach((issue) => {
        if (issue.department) {
            departmentCounts[issue.department] = (departmentCounts[issue.department] || 0) + 1;
        }
    });

    let topDepartment = 'None Active';
    let maxCount = 0;
    Object.entries(departmentCounts).forEach(([dept, count]) => {
        if (count > maxCount) {
            maxCount = count;
            topDepartment = dept;
        }
    });

    // Calculate Triage Pressure: 100 - healthScore
    const pressureScore = Math.max(0, Math.min(100, 100 - healthScore));
    let pressureColor = '#22C55E'; // green
    if (pressureScore > 50) {
        pressureColor = '#EF4444'; // red
    } else if (pressureScore > 20) {
        pressureColor = '#F97316'; // orange
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Pressure Card */}
            <div
                className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-950 dark:text-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Live City Triage Pressure</p>
                        <h3 className="text-5xl font-black text-slate-950 dark:text-white mt-2.5 tracking-tight">
                            {pressureScore}<span className="text-xl font-normal text-slate-400 dark:text-slate-500">/100</span>
                        </h3>
                    </div>
                    {/* Radial Gauge */}
                    <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="28"
                                cy="28"
                                r="20"
                                className="stroke-slate-100 dark:stroke-slate-800 fill-transparent"
                                strokeWidth="4.5"
                            />
                            <circle
                                cx="28"
                                cy="28"
                                r="20"
                                fill="transparent"
                                stroke={pressureColor}
                                strokeWidth="4.5"
                                strokeDasharray={125.6} // 2 * PI * 20
                                strokeDashoffset={125.6 - (125.6 * pressureScore) / 100}
                                className="transition-all duration-700 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-[10px] font-black text-slate-850 dark:text-slate-200">{pressureScore}%</span>
                        </div>
                    </div>
                </div>
                <div className="mt-5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${pressureScore > 50 ? 'bg-rose-500 animate-pulse' : 'bg-green-500'}`} />
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400">
                        {pressureScore > 50 ? 'High operational congestion' : 'Normal city command pressure'}
                    </p>
                </div>
            </div>

            {/* Total Card */}
            <div
                onClick={() => setActiveFilter('')}
                className="p-6 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-955 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 cursor-pointer select-none relative overflow-hidden group flex flex-col justify-between"
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Filed Reports</p>
                        <h3 className="text-5xl font-black text-slate-950 dark:text-white mt-2.5 tracking-tight">{totalReports}</h3>
                    </div>
                    <span className="p-2.5 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl group-hover:scale-105 transition-transform duration-300">
                        <BarChart3 className="w-5 h-5" />
                    </span>
                </div>
                <div className="mt-5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400">
                        Showing all reported cases
                    </p>
                </div>
            </div>

            {/* Urgent Card */}
            <div
                onClick={() => setActiveFilter(activeFilter === 'urgent' ? '' : 'urgent')}
                className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer select-none relative overflow-hidden group flex flex-col justify-between
          ${activeFilter === 'urgent' 
            ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-500 ring-1 ring-rose-100 dark:ring-rose-950 shadow-none' 
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-955 dark:text-slate-100 hover:border-slate-350 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5'}`}
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Urgent Action Items</p>
                        <h3 className="text-5xl font-black text-rose-600 mt-2.5 tracking-tight">{urgentCount}</h3>
                    </div>
                    <span className="p-2.5 bg-rose-50/50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl group-hover:scale-105 transition-transform duration-300">
                        <AlertOctagon className="w-5 h-5" />
                    </span>
                </div>
                <div className="mt-5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${activeFilter === 'urgent' ? 'bg-rose-600 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <p className={`text-[10px] font-bold ${activeFilter === 'urgent' ? 'text-rose-700 dark:text-rose-400' : 'text-slate-400 dark:text-slate-400'}`}>
                        {activeFilter === 'urgent' ? 'Filter active: Critical & High severity' : 'Click to isolate high-priority cases'}
                    </p>
                </div>
            </div>

            {/* Peak Load Card */}
            <div
                onClick={() => setActiveFilter(activeFilter === 'peak' ? '' : 'peak')}
                className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer select-none relative overflow-hidden group flex flex-col justify-between
          ${activeFilter === 'peak' 
            ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-500 ring-1 ring-amber-100 dark:ring-amber-950 shadow-none' 
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-955 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5'}`}
            >
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-1.5">
                        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Peak Department Load</p>
                        <h3 className="text-base font-black text-slate-900 dark:text-white mt-3 tracking-tight leading-snug">{topDepartment}</h3>
                    </div>
                    <span className="p-2.5 bg-amber-50/50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-105 transition-transform duration-300">
                        <Building2 className="w-5 h-5" />
                    </span>
                </div>
                <div className="mt-5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${activeFilter === 'peak' ? 'bg-amber-600 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <p className={`text-[10px] font-bold ${activeFilter === 'peak' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400 dark:text-slate-400'}`}>
                        {activeFilter === 'peak' ? `Filter active: ${maxCount} active tasks` : 'Click to isolate peak department load'}
                    </p>
                </div>
            </div>
        </div>
    );
}