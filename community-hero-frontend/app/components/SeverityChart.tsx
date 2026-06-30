'use client';

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

interface ChartProps {
    issues: CivicIssue[];
}

export default function SeverityChart({ issues }: ChartProps) {
    const totalCount = issues.length;

    // Count severities
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    issues.forEach((issue) => {
        const s = issue.severity?.toLowerCase() || '';
        if (s === 'critical') critical++;
        else if (s === 'high') high++;
        else if (s === 'medium') medium++;
        else if (s === 'low') low++;
    });

    const severities = [
        { name: 'Critical', count: critical, color: 'text-rose-600', stroke: '#E11D48', bg: 'bg-rose-50' },
        { name: 'High', count: high, color: 'text-orange-600', stroke: '#EA580C', bg: 'bg-orange-50' },
        { name: 'Medium', count: medium, color: 'text-yellow-600', stroke: '#CA8A04', bg: 'bg-yellow-50' },
        { name: 'Low', count: low, color: 'text-emerald-600', stroke: '#059669', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col h-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">30-Day Issue Severity Breakdown</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">Overview of issues by priority level</p>

            {totalCount === 0 ? (
                <div className="flex-grow flex items-center justify-center text-sm text-gray-400 dark:text-slate-500 py-12">
                    No active severity data available
                </div>
            ) : (
                <div className="flex flex-col justify-center flex-grow space-y-6">
                    {/* Stacked Horizontal Progress Bar */}
                    <div className="w-full h-7 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex border border-slate-200/40 dark:border-slate-700 shadow-inner">
                        {critical > 0 && (
                            <div 
                                style={{ width: `${(critical / totalCount) * 100}%` }}
                                className="bg-rose-600 h-full transition-all duration-500"
                                title={`Critical: ${critical} cases`}
                            />
                        )}
                        {high > 0 && (
                            <div 
                                style={{ width: `${(high / totalCount) * 100}%` }}
                                className="bg-orange-500 h-full transition-all duration-500"
                                title={`High: ${high} cases`}
                            />
                        )}
                        {medium > 0 && (
                            <div 
                                style={{ width: `${(medium / totalCount) * 100}%` }}
                                className="bg-yellow-450 h-full transition-all duration-500"
                                title={`Medium: ${medium} cases`}
                            />
                        )}
                        {low > 0 && (
                            <div 
                                style={{ width: `${(low / totalCount) * 100}%` }}
                                className="bg-green-500 h-full transition-all duration-500"
                                title={`Low: ${low} cases`}
                            />
                        )}
                    </div>

                    {/* Detailed Legend and Totals Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {severities.map((sev) => {
                            const percentage = totalCount > 0 ? (sev.count / totalCount) * 100 : 0;
                            const isZero = sev.count === 0;
                            
                            let dotBg = "bg-green-500";
                            if (sev.name === 'Critical') dotBg = "bg-rose-600";
                            else if (sev.name === 'High') dotBg = "bg-orange-500";
                            else if (sev.name === 'Medium') dotBg = "bg-yellow-450";

                            return (
                                <div 
                                    key={sev.name} 
                                    className={`flex flex-col p-3 rounded-xl border transition-all duration-300 ${
                                        isZero 
                                            ? 'border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 opacity-40 grayscale select-none' 
                                            : 'border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-800/20 shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className={`w-2 h-2 rounded-full ${isZero ? 'bg-slate-300 dark:bg-slate-600' : dotBg}`} />
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isZero ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {sev.name}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-1 mt-0.5">
                                        <span className={`text-xl font-black ${isZero ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                                            {sev.count}
                                        </span>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold">{Math.round(percentage)}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
