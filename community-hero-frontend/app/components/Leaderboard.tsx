'use client';

import { Award, FileText, CheckCircle2, Users, Download } from 'lucide-react';

interface CitizenRecord {
    id: string;
    username: string;
    points: number;
    reports_count: number;
    verifications_count: number;
}

interface LeaderboardProps {
    leaderboard: CitizenRecord[];
}

const formatUsername = (name: string) => {
    if (!name) return "";
    return name
        .replace(/[._-]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const renderMedalSVG = (rank: number) => {
    let strokeColor = "#EAB308"; // Gold
    let fillColor = "rgba(234, 179, 8, 0.1)";
    if (rank === 2) {
        strokeColor = "#64748B"; // Silver
        fillColor = "rgba(100, 116, 139, 0.1)";
    } else if (rank === 3) {
        strokeColor = "#B45309"; // Bronze
        fillColor = "rgba(180, 83, 9, 0.1)";
    }

    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5" fill={fillColor} />
            <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
        </svg>
    );
};

export default function Leaderboard({ leaderboard = [] }: LeaderboardProps) {
    const downloadCSV = () => {
        if (!leaderboard || leaderboard.length === 0) return;
        
        const headers = ["Rank", "Username", "Points", "Reports Submitted", "Verifications"];
        const rows = leaderboard.map((c, i) => [
            i + 1,
            c.username,
            c.points,
            c.reports_count,
            c.verifications_count
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `community_hero_leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col h-fit">
            <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" /> Citizen Leaderboard
                </h3>
                <div className="flex items-center gap-2">
                    {leaderboard.length > 0 && (
                        <button
                            onClick={downloadCSV}
                            title="Export Leaderboard to CSV"
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center shadow-sm"
                        >
                            <Download className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <span className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider">
                        Live Rewards
                    </span>
                </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">Top community contributors and active verifiers</p>

            {leaderboard.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-sm text-gray-400 dark:text-slate-500 py-12 space-y-2">
                    <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1" />
                    <span>Leaderboard is empty</span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 text-center">Be the first to submit a report or verify an issue to earn points!</span>
                </div>
            ) : (
                <div className="space-y-3 flex-grow overflow-y-auto max-h-[650px] pr-1.5 scrollbar-thin">
                    {leaderboard.map((citizen, index) => {
                        const rank = index + 1;
                        let rankBg = "bg-slate-50 dark:bg-slate-800 border-slate-200/60 dark:border-slate-700/60";
                        let rankTextClass = "text-slate-500 dark:text-slate-400";
                        
                        if (rank === 1) {
                            rankBg = "bg-yellow-50/40 dark:bg-yellow-950/15 border-yellow-200/60 dark:border-yellow-900/50";
                            rankTextClass = "text-yellow-800 dark:text-yellow-400 font-extrabold";
                        } else if (rank === 2) {
                            rankBg = "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700";
                            rankTextClass = "text-slate-700 dark:text-slate-300 font-bold";
                        } else if (rank === 3) {
                            rankBg = "bg-amber-50/40 dark:bg-amber-950/15 border-amber-200/60 dark:border-amber-900/50";
                            rankTextClass = "text-amber-800 dark:text-amber-400 font-bold";
                        }

                        // Determine gamification badge based on points
                        let badgeText = "Bronze Sentinel";
                        let badgeClass = "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-400"; // bronze-ish
                        
                        if (citizen.points >= 100) {
                            badgeText = "Gold Champion";
                            badgeClass = "bg-yellow-50 dark:bg-yellow-900/25 border border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-400";
                        } else if (citizen.points >= 30) {
                            badgeText = "Silver Guardian";
                            badgeClass = "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300";
                        }

                        return (
                            <div 
                                key={citizen.id || citizen.username} 
                                className={`flex items-center justify-between p-3 border rounded-xl hover:-translate-y-0.5 transition-all duration-200 bg-white dark:bg-slate-900 ${rank === 1 ? 'border-yellow-200/70 dark:border-yellow-900/60' : 'border-slate-100 dark:border-slate-800/80'}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Rank Badge */}
                                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs ${rankBg} ${rankTextClass}`}>
                                        {rank <= 3 ? renderMedalSVG(rank) : `#${rank}`}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{formatUsername(citizen.username)}</p>
                                            <span className={`inline-block px-1.5 py-0.2 border text-[8px] font-extrabold uppercase tracking-wider rounded-md select-none ${badgeClass}`}>
                                                {badgeText}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 flex items-center gap-1.5 flex-wrap">
                                            <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {citizen.reports_count} {citizen.reports_count === 1 ? 'report' : 'reports'}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {citizen.verifications_count} {citizen.verifications_count === 1 ? 'verify' : 'verifies'}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="inline-block px-2.5 py-1 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold text-[11px] rounded-lg">
                                        {citizen.points} pts
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
