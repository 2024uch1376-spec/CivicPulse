'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorType: 'ai' | 'human' | 'api';
  type: string;
  details: string;
}

const auditLogs: AuditLogEntry[] = [
  {
    id: "LOG-9944",
    timestamp: "12:45:12 AM",
    actor: "City Map (GIS)",
    actorType: "api",
    type: "GIS Sync",
    details: "Added issue #255B0 to the official city map (ID: GIS-3091A)"
  },
  {
    id: "LOG-9943",
    timestamp: "12:40:55 AM",
    actor: "City Work Orders",
    actorType: "api",
    type: "SAP Order",
    details: "Created city work order WO-44021 to send a repair team to MI Road"
  },
  {
    id: "LOG-9942",
    timestamp: "12:31:04 AM",
    actor: "AI Assistant",
    actorType: "ai",
    type: "Auto Merge",
    details: "Merged identical tickets #C204 & #C205 (located in the same place)"
  },
  {
    id: "LOG-9941",
    timestamp: "12:14:22 AM",
    actor: "Mohit (Admin)",
    actorType: "human",
    type: "Manual Override",
    details: "Manually changed ticket #A102 priority from Medium to Urgent"
  },
  {
    id: "LOG-9940",
    timestamp: "11:45:00 PM",
    actor: "Jabalpur GIS Gateway",
    actorType: "api",
    type: "Data Sync",
    details: "Loaded 4,200 water pressure sensor readings via secure API"
  },
  {
    id: "LOG-9939",
    timestamp: "11:12:05 PM",
    actor: "AI Assistant",
    actorType: "ai",
    type: "Paused",
    details: "Paused automatic team dispatch on ticket #B409 (needs photo verification)"
  },
  {
    id: "LOG-9938",
    timestamp: "10:55:18 PM",
    actor: "Mohit (Admin)",
    actorType: "human",
    type: "Login",
    details: "Supervisor logged in securely using two-factor check"
  }
];

export default function AuditLedgerView() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    fetch(`${API_BASE_URL}/api/audit-logs`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch logs");
        return res.json();
      })
      .then((data) => {
        if (isSubscribed && data && data.logs) {
          setLogs(data.logs);
        }
      })
      .catch((err) => {
        console.warn("Audit log fetch error, falling back to static logs:", err);
        if (isSubscribed) {
          setLogs(auditLogs);
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-505" /> System Activity Logs
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold max-w-2xl leading-relaxed">
            Security verified log of automated decisions and admin updates.
          </p>
        </div>
        
        {/* Top-Right Status Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" /> Gov-Cloud Secure Logs (Cannot Be Edited)
          </span>
        </div>
      </div>

      {/* Table UI Container */}
      <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/55 dark:bg-slate-900/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-505 dark:text-slate-400">
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Log ID</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {logs.map((log) => {
                let actorBadgeStyle = "";
                if (log.actorType === 'ai') {
                  actorBadgeStyle = "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40";
                } else if (log.actorType === 'human') {
                  actorBadgeStyle = "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40";
                } else if (log.actorType === 'api') {
                  actorBadgeStyle = "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-705 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40";
                }

                return (
                  <tr key={log.id} className="hover:bg-slate-55 dark:hover:bg-slate-800/25 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-550 dark:text-slate-400 font-semibold select-none">
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900 dark:text-slate-100 select-all">
                      {log.id}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold tracking-wider ${actorBadgeStyle}`}>
                        {log.actor}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-extrabold text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500 dark:text-slate-400 tracking-widest">
                        {log.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {log.details}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
