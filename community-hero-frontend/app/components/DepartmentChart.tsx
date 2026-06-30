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

export default function DepartmentChart({ issues }: ChartProps) {
    // Count issues per department
    const departmentCounts: Record<string, number> = {};
    issues.forEach((issue) => {
        if (issue.department) {
            departmentCounts[issue.department] = (departmentCounts[issue.department] || 0) + 1;
        }
    });

    // Sort departments by report count descending
    const sortedDepts = Object.entries(departmentCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const maxCount = sortedDepts.length > 0 ? sortedDepts[0].count : 0;

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col h-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Team Workload & Capacity</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">Percentage of team capacity currently in use</p>

            {sortedDepts.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-sm text-gray-400 dark:text-slate-500 py-12">
                    No active department data available
                </div>
            ) : (
                <div className="flex flex-col gap-3 flex-grow justify-center">
                    {sortedDepts.slice(0, 5).map((dept, index) => {
                        const percentage = maxCount > 0 ? (dept.count / maxCount) * 100 : 0;

                        return (
                            <div key={dept.name} className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-slate-300 leading-none">
                                    <span className="truncate max-w-[220px]">{dept.name}</span>
                                    <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 border border-blue-100 dark:border-blue-900/30 rounded font-bold text-[10px]">
                                        {dept.count} {dept.count === 1 ? 'Report' : 'Reports'}
                                    </span>
                                </div>

                                <div className="w-full h-2.5 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-850">
                                    <div
                                        className="h-full bg-indigo-600/80 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
