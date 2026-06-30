'use client';

import { Activity, MapPin, Sparkles, Award, Moon, Sun, LogOut, Shield, ShieldCheck, Coins, CheckCircle, XCircle, Key } from 'lucide-react';

interface SidebarProps {
  currentTab: 'dashboard' | 'map' | 'analytics' | 'community' | 'audit-ledger';
  setCurrentTab: (tab: 'dashboard' | 'map' | 'analytics' | 'community' | 'audit-ledger') => void;
  userRole: 'admin' | 'citizen';
  setUserRole: (role: 'admin' | 'citizen') => void;
  username: string;
  loginInput: string;
  setLoginInput: (val: string) => void;
  handleLogin: () => void;
  handleLogout: () => void;
  userPoints: number;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isVerified?: boolean;
  onOpenVerification?: () => void;
  isAdminVerified?: boolean;
  onOpenAdminVerification?: () => void;
  onOpenCashOut?: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  userRole,
  setUserRole,
  username,
  loginInput,
  setLoginInput,
  handleLogin,
  handleLogout,
  userPoints,
  theme,
  toggleTheme,
  isVerified = false,
  onOpenVerification,
  isAdminVerified = false,
  onOpenAdminVerification,
  onOpenCashOut,
}: SidebarProps) {
  return (
    <aside className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 select-none z-30 transition-colors duration-300">
      
      {/* Top Branding Section */}
      <div className="p-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">CivicPulse</h1>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-widest mt-0.5 block leading-none">City Operations</span>
          </div>
        </div>

        {/* Navigation Block Links */}
        <nav className="mt-8 space-y-1">
          {username && userRole === 'admin' && (
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider text-left ${
                currentTab === 'dashboard'
                  ? 'bg-blue-500/[0.03] dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-l-4 border-blue-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-transparent'
              }`}
            >
              <Activity className="w-4 h-4 shrink-0" />
              Dashboard
            </button>
          )}

          <button
            onClick={() => setCurrentTab('map')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider text-left ${
              currentTab === 'map'
                ? 'bg-blue-500/[0.03] dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-l-4 border-blue-600'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-transparent'
            }`}
          >
            <MapPin className="w-4 h-4 shrink-0" />
            Live Map & Report
          </button>

          {username && userRole === 'admin' && (
            <button
              onClick={() => setCurrentTab('analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider text-left ${
                currentTab === 'analytics'
                  ? 'bg-blue-500/[0.03] dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-l-4 border-blue-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-transparent'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              Analytics Hub
            </button>
          )}

          <button
            onClick={() => setCurrentTab('community')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider text-left ${
              currentTab === 'community'
                ? 'bg-blue-500/[0.03] dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-l-4 border-blue-600'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-transparent'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            Community
          </button>

          {username && userRole === 'admin' && (
            <button
              onClick={() => setCurrentTab('audit-ledger')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider text-left ${
                currentTab === 'audit-ledger'
                  ? 'bg-blue-500/[0.03] dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-l-4 border-blue-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-l-4 border-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              System Logs
            </button>
          )}
        </nav>
      </div>

      {/* Bottom Utilities Panel */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
        
        {/* User Identity / Login area */}
        {!username ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Citizen Username..."
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogin();
                }}
                className="flex-grow px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={toggleTheme}
                className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5 text-slate-600" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              </button>
            </div>
            <button
              onClick={handleLogin}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98"
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Profile Avatar Card */}
            <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 p-2.5 rounded-xl relative">
              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-black text-xs flex items-center justify-center uppercase select-none shrink-0">
                {username.substring(0, 2)}
              </div>
              <div className="text-left min-w-0 flex-grow pr-14">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate">{username}</p>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-555 dark:text-slate-400 font-bold leading-none">{userPoints} pts</p>
                    {userRole === 'citizen' && userPoints >= 100 && onOpenCashOut && (
                      <button
                        onClick={onOpenCashOut}
                        className="text-[9px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-extrabold uppercase hover:underline cursor-pointer leading-none flex items-center gap-0.5"
                      >
                        <Coins className="w-2.5 h-2.5" /> Cash Out
                      </button>
                    )}
                  </div>
                  {userRole === 'citizen' && (
                    <span className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                      isVerified 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isVerified ? (
                        <>
                          <CheckCircle className="w-2.5 h-2.5" /> Verified Resident
                        </>
                      ) : (
                        <>
                          <XCircle className="w-2.5 h-2.5" /> Address Not Verified
                        </>
                      )}
                    </span>
                  )}
                  {userRole === 'admin' && (
                    <span className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                      isAdminVerified 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {isAdminVerified ? (
                        <>
                          <CheckCircle className="w-2.5 h-2.5" /> Verified Officer
                        </>
                      ) : (
                        <>
                          <XCircle className="w-2.5 h-2.5" /> Access Not Verified
                        </>
                      )}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="absolute right-2 top-2.5 flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                  title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                  {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1 text-slate-400 hover:text-red-655 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Verify Residency Action Button */}
            {userRole === 'citizen' && !isVerified && onOpenVerification && (
              <button
                onClick={onOpenVerification}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer active:scale-98 shadow-sm flex items-center justify-center gap-1"
              >
                <Key className="w-3 h-3" /> Verify Address
              </button>
            )}

            {/* Verify Admin Action Button */}
            {userRole === 'admin' && !isAdminVerified && onOpenAdminVerification && (
              <button
                onClick={onOpenAdminVerification}
                className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer active:scale-98 shadow-sm flex items-center justify-center gap-1"
              >
                <Shield className="w-3 h-3" /> Verify Admin
              </button>
            )}

            {/* Admin / Citizen Switcher */}
            <div className="grid grid-cols-2 gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-100 dark:border-slate-800/40">
              <button
                onClick={() => setUserRole('admin')}
                className={`py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  userRole === 'admin'
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm font-black'
                    : 'text-slate-750 dark:text-slate-350 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 font-extrabold'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setUserRole('citizen')}
                className={`py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                  userRole === 'citizen'
                    ? 'bg-blue-600 text-white shadow-sm font-black'
                    : 'text-slate-750 dark:text-slate-355 hover:text-slate-955 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 font-extrabold'
                }`}
              >
                Citizen
              </button>
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}
