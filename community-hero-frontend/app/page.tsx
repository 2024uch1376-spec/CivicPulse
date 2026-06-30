'use client';

import { useEffect, useState } from 'react';
import { Search, X, MapPin, Sparkles, Award, LogOut, Bot, Sun, Moon, Check, Coins } from 'lucide-react';
import dynamic from 'next/dynamic';
import { API_BASE_URL } from './config';
import ReportForm from './components/ReportForm';
import AnalyticsCards from './components/AnalyticsCards';
import CopilotChat from './components/CopilotChat';
import DepartmentChart from './components/DepartmentChart';
import SeverityChart from './components/SeverityChart';
import Leaderboard from './components/Leaderboard';
import PredictiveInsights from './components/PredictiveInsights';
import RewardsStore from './components/RewardsStore';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import PredictiveDegradationChart from './components/PredictiveDegradationChart';
import WeeklyShiftPlan from './components/WeeklyShiftPlan';
import AuditLedgerView from './components/AuditLedgerView';

const MapWithNoSSR = dynamic(() => import('./components/Map'), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">Loading Map Engine...</div>
});

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
  image_url?: string;
  upvotes?: number;
  address?: string;
  created_at?: string;
}

const MOCK_CRITICAL_ISSUES: CivicIssue[] = [
  {
    id: "mock-1",
    title: "Severe Waterway Pollution from Accumulated Waste",
    severity: "Critical",
    department: "Sanitation & Public Health",
    status: "Submitted",
    category: "Sanitation",
    summary: "Large accumulation of plastic bottles and general refuse along the banks and within Nagpur waterway, requiring immediate cleanup.",
    latitude: 21.16907,
    longitude: 78.83418,
    upvotes: 4,
    address: "Lonara, Kalameshwar, Nagpur, Maharashtra, India",
    created_at: new Date(Date.now() - 150000).toISOString()
  },
  {
    id: "mock-2",
    title: "Major Pothole Blockage on Main Arterial Road B",
    severity: "High",
    department: "Transportation & Public Works",
    status: "Submitted",
    category: "Transportation",
    summary: "Large pothole in center lane causing traffic hazards and vehicle damage near Sector 4 bypass.",
    latitude: 26.9220,
    longitude: 75.7788,
    upvotes: 8,
    address: "Sector 4 Outer Ring Road, Jaipur",
    created_at: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: "mock-3",
    title: "Exposed Electrical Wiring near Public Bus Stop",
    severity: "High",
    department: "Electrical",
    status: "Submitted",
    category: "Safety",
    summary: "Damaged utility pole cover exposing live wires next to the Sector 3 bus shelter.",
    latitude: 26.8912,
    longitude: 75.7564,
    upvotes: 12,
    address: "Sector 3 Main Market Road, Jaipur",
    created_at: new Date(Date.now() - 480000).toISOString()
  }
];

function VerificationModalContent({ onClose, onVerified }: { onClose: () => void; onVerified: () => void }) {
  const [method, setMethod] = useState<'id' | 'bill'>('id');
  const [inputValue, setInputValue] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setError('Please fill in the required field.');
      return;
    }
    setError('');
    setIsVerifying(true);
    
    // Simulate city records validation check
    setTimeout(() => {
      setIsVerifying(false);
      onVerified();
    }, 1500);
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-left transition-all relative">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 dark:hover:text-slate-300 rounded-full w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="space-y-1.5">
        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Key className="w-5 h-5 text-blue-500" /> Verify Home Address
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          Please verify that you live in our city. This helps us stop spam and keep the reports clean.
        </p>
      </div>

      <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => { setMethod('id'); setInputValue(''); setError(''); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            method === 'id'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-extrabold'
          }`}
        >
          National ID
        </button>
        <button
          type="button"
          onClick={() => { setMethod('bill'); setInputValue(''); setError(''); }}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            method === 'bill'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-extrabold'
          }`}
        >
          Utility Bill
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {method === 'id' ? 'Enter National ID Number' : 'Enter Electricity or Water Account Number'}
          </label>
          <input
            type="text"
            required
            disabled={isVerifying}
            placeholder={method === 'id' ? 'e.g. Aadhaar or Passport number' : 'e.g. Utility Account Number'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {error && <p className="text-[10px] text-rose-600 font-bold">{error}</p>}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isVerifying}
            className="flex-1 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isVerifying}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/60 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
          >
            {isVerifying ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Checking records...
              </>
            ) : (
              'Submit Verification'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdminVerificationModalContent({ onClose, onVerified }: { onClose: () => void; onVerified: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [employeeId, setEmployeeId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError('Please enter your Employee ID.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter your passcode.');
      return;
    }
    setError('');
    setIsVerifying(true);
    
    // Simulate employee database check
    setTimeout(() => {
      setIsVerifying(false);
      onVerified();
    }, 1500);
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-left transition-all relative">
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 dark:hover:text-slate-300 rounded-full w-8 h-8 flex items-center justify-center hover:bg-slate-105 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="space-y-1.5">
        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" /> Verify Admin Access
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          {step === 1 
            ? 'Step 1: Enter your Municipal Employee ID to identify yourself.' 
            : 'Step 2: Enter your secure passcode to finish signing in.'}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex gap-2">
        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`} />
      </div>

      {step === 1 ? (
        <form onSubmit={handleNext} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Employee ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. EMP-2084"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {error && <p className="text-[10px] text-rose-600 font-bold">{error}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
            >
              Next Step →
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl text-xs space-y-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Verifying Account</p>
            <p className="font-extrabold text-slate-850 dark:text-slate-200">Employee ID: {employeeId}</p>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Enter Passcode
            </label>
            <input
              type="password"
              required
              disabled={isVerifying}
              placeholder="••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {error && <p className="text-[10px] text-rose-600 font-bold">{error}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setStep(1); setError(''); }}
              disabled={isVerifying}
              className="flex-1 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/60 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
            >
              {isVerifying ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Checking credentials...
                </>
              ) : (
                'Verify Access'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function CashOutModalContent({ 
  userPoints, 
  onClose, 
  onSuccess 
}: { 
  userPoints: number; 
  onClose: () => void; 
  onSuccess: (pointsRedeemed: number, cashAmount: number, method: 'stripe' | 'bank', details: string) => void; 
}) {
  const [method, setMethod] = useState<'stripe' | 'bank'>('stripe');
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(Math.max(100, Math.floor(userPoints / 50) * 50));
  const [stripeEmail, setStripeEmail] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Validate points range
  const maxRedeemable = Math.floor(userPoints / 50) * 50;

  const handlePointsChange = (val: number) => {
    if (val < 100) {
      setPointsToRedeem(100);
    } else if (val > maxRedeemable) {
      setPointsToRedeem(maxRedeemable);
    } else {
      setPointsToRedeem(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pointsToRedeem < 100) {
      setError('Minimum redemption is 100 points.');
      return;
    }
    if (pointsToRedeem > userPoints) {
      setError('You do not have enough points.');
      return;
    }
    if (method === 'stripe' && !stripeEmail.trim()) {
      setError('Please enter your Stripe email.');
      return;
    }
    if (method === 'bank' && (!bankAccount.trim() || !bankName.trim())) {
      setError('Please enter your bank account details.');
      return;
    }

    setError('');
    setIsProcessing(true);

    const cashValue = pointsToRedeem * 0.05; // 100 pts = $5.00
    const details = method === 'stripe' ? stripeEmail.trim() : `${bankName.trim()} (A/C: ${bankAccount.trim()})`;

    // Simulate payout processing
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess(pointsToRedeem, cashValue, method, details);
    }, 1500);
  };

  const cashValue = pointsToRedeem * 0.05;

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-left transition-all relative">
      <button 
        onClick={onClose}
        disabled={isProcessing}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 dark:hover:text-slate-300 rounded-full w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="space-y-1.5">
        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Coins className="w-5 h-5 text-emerald-500" /> Cash Out Points
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
          Convert your verified points directly to cash. The current rate is <span className="font-extrabold text-blue-600 dark:text-blue-400">100 points = $5.00</span>.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your Balance</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{userPoints} pts</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Cash Value</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">${(userPoints * 0.05).toFixed(2)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Points slider selector */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Points to Redeem</span>
            <span className="text-xs text-blue-600 dark:text-blue-400">{pointsToRedeem} pts (${cashValue.toFixed(2)})</span>
          </div>
          <input 
            type="range"
            min={100}
            max={maxRedeemable}
            step={50}
            disabled={isProcessing || maxRedeemable < 100}
            value={pointsToRedeem}
            onChange={(e) => handlePointsChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
            <span>Min: 100 pts</span>
            <span>Max Redeemable: {maxRedeemable} pts</span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => { setMethod('stripe'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              method === 'stripe'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-extrabold'
            }`}
          >
            Stripe Connect
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => { setMethod('bank'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              method === 'bank'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-extrabold'
            }`}
          >
            Bank Payout
          </button>
        </div>

        {/* Dynamic form inputs */}
        {method === 'stripe' ? (
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Stripe Account Email
            </label>
            <input
              type="email"
              required
              disabled={isProcessing}
              placeholder="your.email@stripe.com"
              value={stripeEmail}
              onChange={(e) => setStripeEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Bank Name
              </label>
              <input
                type="text"
                required
                disabled={isProcessing}
                placeholder="e.g. State Bank of India"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Account Number
              </label>
              <input
                type="text"
                required
                disabled={isProcessing}
                placeholder="e.g. 10049281728"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        )}

        {error && <p className="text-[10px] text-rose-600 font-bold">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isProcessing || maxRedeemable < 100}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
          >
            {isProcessing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing Payout...
              </>
            ) : (
              `Cash Out $${cashValue.toFixed(2)}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

export default function Home() {
  const [issues, setIssues] = useState<CivicIssue[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [copilotPrompt, setCopilotPrompt] = useState<string | null>(null);
  const [dispatchedMockIds, setDispatchedMockIds] = useState<string[]>([]); // NEW
  const [activeFilter, setActiveFilter] = useState<string>(''); // Track quick selection filter card
  const [isMounted, setIsMounted] = useState(false); // Track mount state to prevent hydration mismatches
  const [formLocation, setFormLocation] = useState<{ lat: number; lng: number } | null>(null); // Shared state for map-clicked coordinates
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'map' | 'analytics' | 'community' | 'audit-ledger'>('dashboard');
  const [username, setUsername] = useState<string>('');
  const [loginInput, setLoginInput] = useState<string>('');
  const [userPoints, setUserPoints] = useState<number>(0);
  const [userRole, setUserRole] = useState<'admin' | 'citizen'>('admin');
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState<boolean>(false);
  const [isAdminVerified, setIsAdminVerified] = useState<boolean>(false);
  const [isAdminVerificationOpen, setIsAdminVerificationOpen] = useState<boolean>(false);
  const [isCashOutOpen, setIsCashOutOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [reportDate, setReportDate] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isFlushing, setIsFlushing] = useState(false);
  const [flushExecuted, setFlushExecuted] = useState(false);

  const addToast = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleExecuteFlush = () => {
    setIsFlushing(true);
    addToast("Initiating Emergency Flush Order for District 2 mains...", "info");
    setTimeout(() => {
      setIsFlushing(false);
      setFlushExecuted(true);
      addToast("Emergency Flush Order executed successfully! District 2 mains are being flushed.", "success");
    }, 2000);
  };

  // Load username and theme preferences on mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('citizen_username') || '';
      if (saved) {
        setUsername(saved);
        setLoginInput(saved);
      }
      
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const activeTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
      setTheme(activeTheme);
      if (activeTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    setReportDate(new Date().toLocaleDateString());
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Redirect guest or citizen away from admin-only tabs
  useEffect(() => {
    const isGuest = !username;
    const isCitizen = userRole === 'citizen';
    if ((isGuest || isCitizen) && (currentTab === 'analytics' || currentTab === 'dashboard' || currentTab === 'audit-ledger')) {
      setCurrentTab('map');
    }
  }, [username, userRole, currentTab]);

  // Auto-open copilot when external prompt changes (e.g., clicking dispatch draft)
  useEffect(() => {
    if (copilotPrompt) {
      setIsCopilotOpen(true);
    }
  }, [copilotPrompt]);

  const handleLogin = () => {
    if (loginInput.trim()) {
      setUsername(loginInput.trim());
      localStorage.setItem('citizen_username', loginInput.trim());
      setIsVerified(false); // Reset to unverified so they can test the flow
      setIsAdminVerified(false); // Reset to unverified
      fetchLeaderboard();
      fetchUserPoints(loginInput.trim());
    }
  };

  const handleLogout = () => {
    setUsername('');
    setLoginInput('');
    setIsVerified(false);
    setIsAdminVerified(false);
    localStorage.removeItem('citizen_username');
    setUserRole('admin');
    setUserPoints(0);
  };

  useEffect(() => {
    fetchUserPoints(username);
  }, [username]);

  // Granular Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const fetchLeaderboard = () => {
    fetch(`${API_BASE_URL}/api/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch((err) => console.error("Leaderboard state sync failure:", err));
  };

  const fetchUserPoints = (name: string) => {
    if (!name) {
      setUserPoints(0);
      return;
    }
    fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(name)}/points`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.points !== undefined) {
          setUserPoints(data.points);
        }
      })
      .catch((err) => console.error("Error fetching user points:", err));
  };

  const fetchInsights = (force = false) => {
    setIsInsightsLoading(true);
    const url = force 
      ? `${API_BASE_URL}/api/predictive-insights?force_refresh=true`
      : `${API_BASE_URL}/api/predictive-insights`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setInsightsData(data);
        }
      })
      .catch((err) => console.error("Insights state sync failure:", err))
      .finally(() => setIsInsightsLoading(false));
  };

  const fetchIssues = () => {
    fetch(`${API_BASE_URL}/api/issues`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.issues) {
          setIssues(data.issues);
        }
      })
      .catch((err) => console.error("Dashboard state sync failure:", err));

    fetchLeaderboard();
    fetchInsights();
    if (username) {
      fetchUserPoints(username);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleCashOutSuccess = async (
    pointsRedeemed: number,
    cashAmount: number,
    method: 'stripe' | 'bank',
    details: string
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          points: pointsRedeemed,
          payment_method: method,
          recipient_details: details
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        addToast(errorData.detail || "Cash out failed due to security verification", "warning");
        return;
      }

      setIsCashOutOpen(false);
      fetchUserPoints(username);
      fetchLeaderboard();
      addToast(`Successfully cashed out ${pointsRedeemed} points for $${cashAmount.toFixed(2)}!`, "success");
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to complete cash out payout", "warning");
    }
  };

  // Calculate the peak department name dynamically
  const getPeakDepartment = () => {
    const departmentCounts: Record<string, number> = {};
    issues.forEach((issue) => {
      if (issue.department) {
        departmentCounts[issue.department] = (departmentCounts[issue.department] || 0) + 1;
      }
    });
    let topDept = '';
    let maxCount = 0;
    Object.entries(departmentCounts).forEach(([dept, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topDept = dept;
      }
    });
    return topDept;
  };

  // Get unique departments dynamically from reported issues
  const uniqueDepartments = Array.from(
    new Set(issues.map((issue) => issue.department).filter(Boolean))
  ) as string[];

  // Filter issues based on card clicks, search query, and dropdown selections
  const filteredIssues = issues.filter((issue) => {
    // 1. Quick Filters from Analytics Cards
    if (activeFilter === 'urgent') {
      const s = issue.severity?.toLowerCase();
      if (s !== 'critical' && s !== 'high') return false;
    } else if (activeFilter === 'peak') {
      if (issue.department !== getPeakDepartment()) return false;
    }

    // 2. Keyword Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = issue.title?.toLowerCase().includes(q);
      const categoryMatch = issue.category?.toLowerCase().includes(q);
      const summaryMatch = issue.summary?.toLowerCase().includes(q);
      const deptMatch = issue.department?.toLowerCase().includes(q);
      if (!titleMatch && !categoryMatch && !summaryMatch && !deptMatch) return false;
    }

    // 3. Status Dropdown Filter
    if (statusFilter && statusFilter !== 'all') {
      if (issue.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    }

    // 4. Severity Dropdown Filter
    if (severityFilter && severityFilter !== 'all') {
      if (issue.severity?.toLowerCase() !== severityFilter.toLowerCase()) return false;
    }

    // 5. Department Dropdown Filter
    if (departmentFilter && departmentFilter !== 'all') {
      if (issue.department !== departmentFilter) return false;
    }

    return true;
  });

  const getActiveCityName = () => {
    const firstWithAddress = filteredIssues.find(i => i.address);
    if (firstWithAddress && firstWithAddress.address) {
      const address = firstWithAddress.address.toLowerCase();
      if (address.includes('jaipur')) return 'Jaipur';
      if (address.includes('delhi')) return 'Delhi';
      if (address.includes('mumbai')) return 'Mumbai';
      if (address.includes('bengaluru') || address.includes('bangalore')) return 'Bengaluru';
      if (address.includes('san francisco')) return 'San Francisco';
      
      const parts = firstWithAddress.address.split(',');
      if (parts.length > 2) {
        return parts[parts.length - 3].trim();
      }
    }
    return 'Jaipur';
  };

  const getRelativeTime = (timestamp: number) => {
    if (!isMounted) return '2m ago';
    const now = Date.now();
    const diffMs = now - timestamp;
    if (isNaN(diffMs) || diffMs < 0) return 'just now';
    
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${diffDay}d ago`;
  };

  const getActivityFeed = () => {
    const feed: Array<{
      id: string;
      timestamp: number;
      type: 'submission' | 'verification' | 'dispatch' | 'resolution';
      title: string;
      details: string;
      location: string;
    }> = [];

    // Use raw issues to represent the true chronological database log
    issues.forEach((issue) => {
      const createdTime = new Date(issue.created_at || new Date()).getTime();
      const now = Date.now();
      const locationLabel = issue.address ? issue.address.split(',')[0] : 'Jaipur';

      // 1. Add Submission Event
      feed.push({
        id: `${issue.id}-sub`,
        timestamp: createdTime,
        type: 'submission',
        title: `Incident Reported`,
        details: `"${issue.title}" (${issue.category}) submitted by community sentinel.`,
        location: locationLabel
      });

      // 2. Add Verification Event (if it has upvotes)
      if (issue.upvotes && issue.upvotes > 0) {
        const verifyTime = Math.min(now - 10000, createdTime + 5 * 60 * 1000);
        feed.push({
          id: `${issue.id}-verify`,
          timestamp: verifyTime,
          type: 'verification',
          title: `Report Verified`,
          details: `Community verified incident (+${issue.upvotes} confirmation votes).`,
          location: locationLabel
        });
      }

      // 3. Add Dispatch Event (if status is Dispatched or Resolved)
      if (issue.status === 'Dispatched' || issue.status === 'Resolved') {
        const dispatchTime = Math.min(now - 5000, createdTime + 15 * 60 * 1000);
        feed.push({
          id: `${issue.id}-dispatch`,
          timestamp: dispatchTime,
          type: 'dispatch',
          title: `Crews Dispatched`,
          details: `Admin dispatched service crew to address report.`,
          location: locationLabel
        });
      }

      // 4. Add Resolution Event (if status is Resolved)
      if (issue.status === 'Resolved') {
        const resolveTime = Math.min(now - 2000, createdTime + 45 * 60 * 1000);
        feed.push({
          id: `${issue.id}-resolve`,
          timestamp: resolveTime,
          type: 'resolution',
          title: `Incident Resolved`,
          details: `Infrastructure issue repaired and verified closed (+15 points awarded).`,
          location: locationLabel
        });
      }
    });

    // Sort by timestamp descending and take the top 8 recent actions
    const sortedFeed = feed.sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
    
    // Demo mode: offset timestamps so they always render as active relative to current moment
    const offsets = [
      10 * 1000,           // 10s -> just now
      2 * 60 * 1000,       // 2m -> 2m ago
      15 * 60 * 1000,      // 15m -> 15m ago
      45 * 60 * 1000,      // 45m -> 45m ago
      2 * 60 * 60 * 1000,  // 2h -> 2h ago
      4 * 60 * 60 * 1000,  // 4h -> 4h ago
      12 * 60 * 60 * 1000, // 12h -> 12h ago
      24 * 60 * 60 * 1000  // 24h -> 1d ago
    ];

    sortedFeed.forEach((item, idx) => {
      item.timestamp = Date.now() - (offsets[idx] || (idx * 2 * 3600 * 1000));
    });

    return sortedFeed;
  };

  return (
    <>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 transition-colors duration-300 print:hidden">
      
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userRole={userRole}
        setUserRole={setUserRole}
        username={username}
        loginInput={loginInput}
        setLoginInput={setLoginInput}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        userPoints={userPoints}
        theme={theme}
        toggleTheme={toggleTheme}
        isVerified={isVerified}
        onOpenVerification={() => setIsVerificationOpen(true)}
        isAdminVerified={isAdminVerified}
        onOpenAdminVerification={() => setIsAdminVerificationOpen(true)}
        onOpenCashOut={() => setIsCashOutOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <TopHeader
          currentTab={currentTab}
          userRole={username ? userRole : 'citizen'}
          setIsCopilotOpen={setIsCopilotOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Dynamic content rendering with print layout exclusion */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 print:hidden">
          
          {/* Tab 0: Dashboard */}
          {currentTab === 'dashboard' && (
            <div className="animate-in fade-in duration-200 space-y-8">
              {/* Morning Briefing AI Ticker */}
              <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/25 rounded-2xl py-1.5 px-4 flex items-center justify-between gap-4 font-semibold text-xs text-amber-800 dark:text-amber-300 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="font-extrabold uppercase tracking-wider text-[9px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-700 dark:text-amber-405 shrink-0">Live Alerts</span>
                  <p className="truncate">
                    {issues.filter(i => i.status !== 'Resolved').length} open problems. Many road issues in Sector 4; 2 repair teams are free nearby in Sector 3.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    addToast("AI Action: Reallocating idle maintenance crews to Sector 4 hotspots...", "info");
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 dark:bg-amber-550/15 dark:hover:bg-amber-500/25 text-white dark:text-amber-300 font-extrabold text-[10px] rounded-lg border border-transparent dark:border-amber-500/30 uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
                >
                  Auto-Reallocate Idle Crews &rarr;
                </button>
              </div>

              {/* Analytics Summary Cards */}
              <AnalyticsCards
                issues={issues}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                healthScore={insightsData?.overall_health_score ?? 85}
              />
              
              {/* Interactive Dashboard Actions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Action List */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Bot className="w-5 h-5 text-indigo-500" /> Live Action List
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Urgent unassigned problems needing review and team assignment
                      </p>
                    </div>
                  </div>

                  <div className="flex-grow overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          <th className="pb-3">Time Elapsed</th>
                          <th className="pb-3">Incident Type</th>
                          <th className="pb-3">AI Confidence</th>
                          <th className="pb-3">Suggested Unit</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/50">
                        {(() => {
                          const dbQueueIssues = issues.filter(i => i.status === 'Submitted' && (i.severity?.toLowerCase() === 'critical' || i.severity?.toLowerCase() === 'high'));
                          const activeMockIssues = MOCK_CRITICAL_ISSUES.filter(mock => !dispatchedMockIds.includes(mock.id));
                          const queueIssues = dbQueueIssues.length > 0 ? dbQueueIssues : activeMockIssues;

                          return (
                            <>
                              {queueIssues.slice(0, 4).map((issue) => {
                                const elapsed = getRelativeTime(new Date(issue.created_at || new Date()).getTime());
                                const confidenceHash = (issue.id.charCodeAt(0) + (issue.id.charCodeAt(1) || 0)) % 10;
                                const confidence = (95.2 + confidenceHash * 0.4).toFixed(1);

                                let suggestedUnit = "Road Patrol #2";
                                if (issue.category?.toLowerCase().includes('utility') || issue.department?.toLowerCase().includes('utility')) {
                                  suggestedUnit = "Water Maint Crew #3";
                                } else if (issue.category?.toLowerCase().includes('waste') || issue.department?.toLowerCase().includes('waste') || issue.department?.toLowerCase().includes('sanitation')) {
                                  suggestedUnit = "Sanitation Truck #8";
                                } else if (issue.severity?.toLowerCase() === 'critical') {
                                  suggestedUnit = "Hazmat Unit #4";
                                }

                                return (
                                  <tr key={issue.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="py-3 font-semibold text-slate-500 dark:text-slate-400">{elapsed}</td>
                                    <td className="py-3">
                                      <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{issue.title}</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">{issue.category} • {issue.address ? issue.address.split(',')[0] : 'Jaipur'}</p>
                                      </div>
                                    </td>
                                    <td className="py-3">
                                      <span className="inline-block px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-[10px] font-extrabold rounded border border-indigo-100/45 dark:border-indigo-900/30">
                                        {confidence}%
                                      </span>
                                    </td>
                                    <td className="py-3 font-semibold text-slate-600 dark:text-slate-400">{suggestedUnit}</td>
                                    <td className="py-3 text-right">
                                      <button
                                        onClick={async () => {
                                          addToast(`One-Click Dispatch: Assigning ${suggestedUnit} to "${issue.title}"...`, 'info');
                                          if (issue.id.startsWith('mock-')) {
                                            setTimeout(() => {
                                              setDispatchedMockIds(prev => [...prev, issue.id]);
                                              addToast(`Crews successfully dispatched to "${issue.title}"!`, 'success');
                                            }, 800);
                                          } else {
                                            try {
                                              const response = await fetch(`${API_BASE_URL}/api/issues/${issue.id}/status`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ status: 'Dispatched' }),
                                              });
                                              if (response.ok) {
                                                addToast(`Crews successfully dispatched to "${issue.title}"!`, 'success');
                                                fetchIssues();
                                              } else {
                                                throw new Error('Failed dispatch');
                                              }
                                            } catch (e) {
                                              addToast("Failed to dispatch crews. Verify backend connection.", "warning");
                                            }
                                          }
                                        }}
                                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                                      >
                                        One-Click Dispatch
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                              {queueIssues.length === 0 && (
                                <tr>
                                  <td colSpan={5} className="py-12">
                                    <div className="flex flex-col items-center justify-center text-center space-y-2.5">
                                      <span className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                                        <Check className="w-5 h-5" />
                                      </span>
                                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">All Operations Cleared!</h4>
                                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 max-w-xs">
                                        No unassigned critical issues in the triage queue.
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Active Repair Teams Card */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-500" /> Active Repair Teams
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">Live status of field crews</p>
                    
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      <div className="py-3.5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">At Site</span>
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-slate-200">6 Units</span>
                      </div>
                      
                      <div className="py-3.5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">On the Way</span>
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-slate-200">3 Units</span>
                      </div>
                      
                      <div className="py-3.5 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Available</span>
                        </div>
                        <span className="text-sm font-black text-green-600 dark:text-green-400 animate-pulse bg-green-50 dark:bg-green-950/20 px-2 py-0.5 border border-green-150 dark:border-green-900/35 rounded-lg">
                          2 Units
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800/60 rounded-xl text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 font-semibold">
                    🟢 <strong>Operator Note:</strong> 2 backup crews are available and ready for immediate deployment from adjacent Sector 3 depot.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: Live Map & Intake Form */}
          {currentTab === 'map' && (
            <div className="animate-in fade-in duration-200 h-full flex flex-col">
              {/* Granular Filters bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap items-center gap-4 shadow-sm shrink-0">
                {/* Keyword Search */}
                <div className="flex-grow min-w-[240px] relative flex items-center">
                  <Search className="absolute left-3.5 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search reports by title, category, summary..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Status Filter select */}
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Dispatched">Dispatched</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                {/* Severity Filter select */}
                <div>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="all">All Severities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Department Filter select */}
                <div>
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="all">All Departments</option>
                    {uniqueDepartments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Reset Filters button */}
                {(searchQuery || statusFilter !== 'all' || severityFilter !== 'all' || departmentFilter !== 'all' || activeFilter) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setSeverityFilter('all');
                      setDepartmentFilter('all');
                      setActiveFilter('');
                    }}
                    className="text-xs font-bold text-red-655 hover:text-red-700 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors ml-auto flex items-center gap-1 cursor-pointer"
                  >
                    Reset Filters <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Layout for form and map */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                <div className="lg:col-span-1">
                  <ReportForm 
                    location={formLocation} 
                    setLocation={setFormLocation} 
                    onReportSubmitted={() => {
                      fetchIssues();
                      addToast("New report submitted & successfully triaged by AI!", "success");
                    }} 
                    loggedInUsername={username}
                    isVerified={isVerified}
                    userRole={userRole}
                  />
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col h-[600px]">
                  <div className="flex-grow min-h-0 relative">
                    <MapWithNoSSR 
                      issues={filteredIssues} 
                      onRefresh={fetchIssues} 
                      formLocation={formLocation}
                      setFormLocation={setFormLocation}
                      onDraftPrompt={setCopilotPrompt}
                      username={username}
                      userRole={username ? userRole : 'citizen'}
                      onAddToast={addToast}
                      theme={theme}
                      isAdminVerified={isAdminVerified}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: AI Predictive Insights */}
          {currentTab === 'analytics' && (
            <div className="animate-in fade-in duration-200 space-y-8">
              <PredictiveInsights 
                data={insightsData} 
                isLoading={isInsightsLoading} 
                onRefresh={() => fetchInsights(true)} 
                onAddToast={addToast}
              />

              {/* AI Roots & Ledger Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Systemic Anomaly Detection */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col h-full">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" /> System Issue Alerts
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">AI Pattern & Connection Finder</p>

                  <div className="space-y-4 flex-grow justify-center flex flex-col">
                    <div className="p-3.5 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/40 rounded-xl">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Alert #1: Potholes caused by Garbage Trucks
                      </p>
                      <p className="text-[11px] text-slate-650 dark:text-slate-400 mt-1.5 leading-relaxed font-semibold">
                        AI found that <strong>74% of deep potholes</strong> on Arterial Road B appear within 2 days after garbage trucks use the road on Tuesdays.
                      </p>
                      <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-extrabold uppercase mt-2">
                        💡 Recommendation: Check truck weight limits or move trucks to a different road.
                      </p>
                    </div>

                    <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/40 rounded-xl">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Alert #2: Sewer Backup Warning
                      </p>
                      <p className="text-[11px] text-slate-650 dark:text-slate-400 mt-1.5 leading-relaxed font-semibold">
                        Water blockage complaints in District 2 rise <strong>3 days before</strong> major sewer backups. 4 complaints were made today.
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2.5 pt-2 border-t border-amber-200/40 dark:border-amber-900/20">
                        <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-extrabold uppercase flex items-center gap-1">
                          💡 Recommendation: Clean District 2 sewer pipes early to prevent backups.
                        </p>
                        <button
                          onClick={handleExecuteFlush}
                          disabled={isFlushing || flushExecuted}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm border shrink-0 ${
                            flushExecuted
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-450 cursor-default'
                              : isFlushing
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 animate-pulse'
                              : 'bg-rose-600 hover:bg-rose-700 text-white border-transparent hover:shadow-rose-500/20 hover:shadow-lg'
                          }`}
                        >
                          {flushExecuted ? 'Order Executed ✓' : isFlushing ? 'Executing...' : 'Execute Emergency Flush Order'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Taxpayer ROI & Efficiency Ledger */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col h-full">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
                    <Award className="w-5 h-5 text-amber-500" /> Taxpayer Savings & Impact
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">Money and carbon emissions saved by AI</p>

                  <div className="grid grid-cols-2 gap-4 flex-grow justify-center items-center">
                    <div className="p-4 bg-[#1E293B] rounded-xl border border-slate-700">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Duplicate Reports Merged</p>
                      <p className="text-2xl font-black text-[#F3F4F6] mt-1.5">14 <span className="text-xs font-bold text-slate-455">tickets</span></p>
                    </div>

                    <div className="p-4 bg-[#1E293B] rounded-xl border border-slate-700">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Wasted Journeys Avoided</p>
                      <p className="text-2xl font-black text-[#F3F4F6] mt-1.5">8 <span className="text-xs font-bold text-slate-455">runs</span></p>
                    </div>

                    <div className="p-4 bg-[#1E293B] rounded-xl border border-slate-700">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Est. Municipal Savings</p>
                      <p className="text-2xl font-black text-emerald-400 mt-1.5">$1,420.00</p>
                    </div>

                    <div className="p-4 bg-[#1E293B] rounded-xl border border-slate-700">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Carbon Emissions Saved</p>
                      <p className="text-2xl font-black text-[#38BDF8] mt-1.5">-120kg <span className="text-xs font-bold text-sky-400/80">CO2</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Resource / Saturation Analytics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <DepartmentChart issues={filteredIssues} />
                <SeverityChart issues={filteredIssues} />
              </div>

              {/* Degradation Chart & Weekly shift scheduler */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <PredictiveDegradationChart />
                <WeeklyShiftPlan />
              </div>
            </div>
          )}

          {/* Tab 3: Community Hub */}
          {currentTab === 'community' && (
            <div className="animate-in fade-in duration-200 space-y-8">
              {/* Municipal Impact Scorecard (Unified Theme-Aware Banner with centered layout) */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-8 shadow-md border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-8 items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
                <div className="flex flex-col items-center justify-center text-center px-4 py-2">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-2.5">Hero Points</span>
                  <div className="flex items-baseline gap-1.5 justify-center mt-1">
                    <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                      {issues.filter(issue => issue.status === 'Resolved').length * 15 + issues.reduce((acc, issue) => acc + (issue.upvotes || 0), 0) * 5}
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold leading-none">Earned</span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center text-center px-4 py-2">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-2.5">Community Impact</span>
                  <div className="flex items-baseline gap-1.5 justify-center mt-1">
                    <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                      {issues.filter(issue => issue.status === 'Resolved').length}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-sky-400 font-bold leading-none">Problems fixed</span>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center text-center px-4 py-2">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-2.5">AI Response Time</span>
                  <div className="flex items-baseline gap-1.5 justify-center mt-1">
                    <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                      ~1.8s
                    </span>
                    <span className="text-xs text-purple-600 dark:text-indigo-400 font-bold leading-none">Lightning fast</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                <div className="md:col-span-2 space-y-8">
                  <Leaderboard leaderboard={leaderboard} />
                  
                  <RewardsStore 
                    username={username}
                    userPoints={userPoints}
                    onRedeemSuccess={(msg) => {
                      fetchLeaderboard();
                      fetchUserPoints(username);
                      addToast(msg, "success");
                    }}
                    onAddToast={addToast}
                  />
                </div>

                <div className="md:col-span-1 flex flex-col gap-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm shrink-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
                      <Award className="w-5 h-5 text-amber-500" /> Contributor Badges
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4 font-semibold">
                      Earn contribution points by submitting verified infrastructure reports or upvoting and confirming existing reports in your city.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/60 rounded-lg text-yellow-800 dark:text-yellow-400 text-[10px] font-extrabold shrink-0 uppercase tracking-wider">
                          Gold • 100+ pts
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Gold Champion</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">Awarded to elite community helpers with dozens of active, verified reports.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-[10px] font-extrabold shrink-0 uppercase tracking-wider">
                          Silver • 30+ pts
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Silver Guardian</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">Granted to active citizen monitors who regularly report issues and verify details.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100/40 dark:border-amber-900/60 rounded-lg text-amber-800 dark:text-amber-400 text-[10px] font-extrabold shrink-0 uppercase tracking-wider">
                          Bronze • 0+ pts
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Bronze Sentinel</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">Starting rank for new members. Every report filed helps make the city safer.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex-grow flex flex-col min-h-[300px] h-0">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" /> Operations & Activity Feed
                      </h3>
                      <span className="flex items-center gap-1.5 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/45 px-2 py-0.5 rounded-full uppercase tracking-wider select-none">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Live
                      </span>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-1 space-y-4 scrollbar-thin">
                      {getActivityFeed().length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold italic py-12">
                          No community activities recorded yet.
                        </div>
                      ) : (
                        getActivityFeed().map((item) => {
                          let dotColor = "bg-green-500";
                          if (item.type === 'verification') dotColor = "bg-blue-500";
                          if (item.type === 'dispatch') dotColor = "bg-slate-700";
                          if (item.type === 'resolution') dotColor = "bg-indigo-500";

                          return (
                            <div key={item.id} className="flex gap-3 text-xs items-start leading-relaxed border-l-2 border-slate-100 dark:border-slate-800 pl-4 relative">
                              <span className={`absolute -left-1.5 top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${dotColor}`} />
                              <div className="flex-grow">
                                <p className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-between gap-2">
                                  <span>{item.title}</span>
                                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold whitespace-nowrap">{getRelativeTime(item.timestamp)}</span>
                                </p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-semibold leading-normal">{item.details}</p>
                                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mt-1">{item.location}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/40 rounded-xl text-[10px] leading-relaxed text-blue-800 dark:text-blue-300 shrink-0 font-semibold animate-pulse">
                    ℹ️ Points system: Reporting an issue awards 10 points. Verifying an issue awards 5 points.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: System Audit Ledger */}
          {currentTab === 'audit-ledger' && (
            <AuditLedgerView />
          )}

        </main>
      </div>
    </div>

      {/* Global Toast Notifications Manager Container */}
      <div className="fixed bottom-6 left-6 z-[99999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none print:hidden">
        {toasts.map((toast) => {
          let bgClass = "bg-white border-green-200 text-green-800 shadow-green-100/50";
          let icon = "✅";
          if (toast.type === 'info') {
            bgClass = "bg-white border-blue-250 text-blue-800 shadow-blue-100/50";
            icon = "ℹ️";
          } else if (toast.type === 'warning') {
            bgClass = "bg-white border-amber-250 text-amber-800 shadow-amber-100/50";
            icon = "⚠️";
          }
          
          return (
            <div
              key={toast.id}
              className={`p-3.5 border rounded-2xl shadow-xl flex items-start gap-2.5 pointer-events-auto transition-all duration-300 animate-in slide-in-from-left-6 fade-in ${bgClass}`}
            >
              <span className="text-sm shrink-0 select-none">{icon}</span>
              <div className="flex-grow">
                <p className="text-xs font-bold leading-normal text-slate-800">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-[10px] text-slate-400 hover:text-slate-605 font-bold px-1 select-none cursor-pointer"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <div className="print:hidden">
        <CopilotChat 
          externalPrompt={copilotPrompt} 
          clearExternalPrompt={() => setCopilotPrompt(null)} 
          userRole={userRole}
          isOpen={isCopilotOpen}
          setIsOpen={setIsCopilotOpen}
          onRefresh={fetchIssues}
          onAddToast={addToast}
          username={username}
        />
      </div>

      {/* Print PDF layout */}
      <div className="hidden print:block text-slate-900 bg-white p-8 font-sans infrastructure-report">
        <div className="border-b-4 border-slate-900 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">City of {getActiveCityName()}</h1>
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-0.5">Infrastructure & Operations Report</h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Date Generated</p>
            <p className="text-xs font-bold text-slate-800">{reportDate}</p>
          </div>
        </div>

        {/* Section 1: Quick Indicators */}
        <div className="grid grid-cols-3 gap-6 mb-8 border border-slate-200 p-4 rounded-xl">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">City Safety Index</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{insightsData?.overall_health_score || 95}%</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Active Incidents</p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {issues.filter(i => i.status !== 'Resolved' && i.latitude >= 25.5 && i.latitude <= 28.5 && i.longitude >= 74.5 && i.longitude <= 77.5).length} cases
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Resolved to Date</p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {issues.filter(i => i.status === 'Resolved' && i.latitude >= 25.5 && i.latitude <= 28.5 && i.longitude >= 74.5 && i.longitude <= 77.5).length} cases
            </p>
          </div>
        </div>

        {/* Section 2: AI Allocation recommendations */}
        <div className="mb-8 border border-slate-200 p-4 rounded-xl">
          <h3 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-2">AI Crew Dispatch Allocation Plan</h3>
          <p className="text-xs text-slate-700 leading-relaxed font-semibold">{insightsData?.resource_allocation_recommendations || 'No recommendations generated.'}</p>
        </div>

        {/* Section 3: Strategic Insights List */}
        <div className="mb-8">
          <h3 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-4">Strategic Predictive Insights</h3>
          <div className="space-y-4">
            {insightsData?.insights?.map((ins: any, idx: number) => (
              <div key={idx} className="border-b border-slate-100 pb-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                  {ins.title} • <span className="text-rose-600 font-extrabold">{ins.severity}</span>
                </h4>
                <p className="text-xs text-slate-600 mt-1"><span className="font-bold text-slate-700">Trend Analysis:</span> {ins.description}</p>
                <p className="text-xs text-slate-600 mt-0.5"><span className="font-bold text-slate-700">Mitigation Recommendation:</span> {ins.recommendation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Current Issues Inventory */}
        <div>
          <h3 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-4">Active Incidents Inventory</h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="text-left border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider">
                <th className="pb-2 font-bold text-slate-700 dark:text-slate-300">ID</th>
                <th className="pb-2 font-bold text-slate-700 dark:text-slate-300">Category</th>
                <th className="pb-2 font-bold text-slate-700 dark:text-slate-300">Severity</th>
                <th className="pb-2 font-bold text-slate-700 dark:text-slate-300">Title</th>
                <th className="pb-2 font-bold text-slate-700 dark:text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {issues
                .filter(i => i.status !== 'Resolved' && i.latitude >= 25.5 && i.latitude <= 28.5 && i.longitude >= 74.5 && i.longitude <= 77.5)
                .map((issue) => (
                  <tr key={issue.id} className="border-b border-slate-100 dark:border-slate-800 py-2">
                    <td className="py-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">{issue.id.substring(0, 8)}</td>
                    <td className="py-2 text-[10px] font-semibold text-slate-700 dark:text-slate-300">{issue.category}</td>
                    <td className="py-2 text-[10px] font-extrabold text-rose-700 dark:text-rose-400 uppercase">{issue.severity}</td>
                    <td className="py-2 font-semibold text-slate-800 dark:text-slate-200">{issue.title}</td>
                    <td className="py-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">{issue.status}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Address Verification Modal */}
      {isVerificationOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <VerificationModalContent 
            onClose={() => setIsVerificationOpen(false)} 
            onVerified={() => {
              setIsVerified(true);
              setIsVerificationOpen(false);
              addToast("Address verified successfully! You can now report issues.", "success");
            }}
          />
        </div>
      )}

      {/* Admin Verification Modal */}
      {isAdminVerificationOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <AdminVerificationModalContent 
            onClose={() => setIsAdminVerificationOpen(false)} 
            onVerified={() => {
              setIsAdminVerified(true);
              setIsAdminVerificationOpen(false);
              addToast("Admin verification successful! Operations access granted.", "success");
            }}
          />
        </div>
      )}

      {/* Cash Out Modal */}
      {isCashOutOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <CashOutModalContent 
            userPoints={userPoints}
            onClose={() => setIsCashOutOpen(false)}
            onSuccess={handleCashOutSuccess}
          />
        </div>
      )}
    </>
  );
}