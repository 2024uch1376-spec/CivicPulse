'use client';

import { Calendar, Clock, Truck, ShieldAlert } from 'lucide-react';

export default function WeeklyShiftPlan() {
    const shifts = [
        { day: 'Monday', dept: 'Transportation & Public Works', crew: 'Road Patrol Team #2', time: '08:00 - 16:00', focus: 'Main Arterial Road Pothole Maintenance' },
        { day: 'Tuesday', dept: 'Waste Management', crew: 'Sanitation Truck #8', time: '06:00 - 14:00', focus: 'Raja Park Commercial Route Optimization' },
        { day: 'Wednesday', dept: 'Utilities', crew: 'Water Main Crew #3', time: '14:00 - 22:00', focus: 'Pressure Valve #VALVE-302 Diagnostic Check' },
        { day: 'Thursday', dept: 'Utilities / Emergency', crew: 'Hazmat Unit #4', time: '16:00 - 00:00', focus: 'District 2 Storm Drain Pre-emptive Flush' },
        { day: 'Friday', dept: 'Transportation & Public Works', crew: 'Asphalt Repair Crew #1', time: '08:00 - 16:00', focus: 'Downtown Sector 4 Patching Operations' },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        AI Proposed Weekly Shift Plan
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                        Suggested team schedules based on expected issues
                    </p>
                </div>
            </div>

            {/* Shift List/Table */}
            <div className="flex-grow overflow-x-auto mt-2">
                <table className="w-full text-left text-xs border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                            <th className="pb-3 w-24 min-w-[96px] pr-4">Day</th>
                            <th className="pb-3 max-w-[140px] pr-4">Department</th>
                            <th className="pb-3">Assigned Team</th>
                            <th className="pb-3">Shift Hours</th>
                            <th className="pb-3">Work Focus</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                        {shifts.map((shift, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="py-3 font-bold text-slate-800 dark:text-slate-200 w-24 min-w-[96px] pr-4">{shift.day}</td>
                                <td className="py-3 text-slate-655 dark:text-slate-350 font-semibold max-w-[140px] pr-4 truncate" title={shift.dept}>{shift.dept}</td>
                                <td className="py-3 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                                    <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    {shift.crew}
                                </td>
                                <td className="py-3 font-mono text-slate-500 dark:text-slate-450">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        {shift.time}
                                    </div>
                                </td>
                                <td className="py-3">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50/80 dark:bg-blue-950/20 text-sky-700 dark:text-sky-300 text-[10px] font-bold border border-sky-100/40 dark:border-sky-900/30">
                                        <ShieldAlert className="w-3 h-3 text-sky-500 dark:text-sky-400" />
                                        {shift.focus}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
