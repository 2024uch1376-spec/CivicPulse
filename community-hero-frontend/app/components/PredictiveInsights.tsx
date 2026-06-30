import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Bot, Lightbulb, ChevronLeft, ChevronRight, Printer } from 'lucide-react';

interface PredictiveInsightItem {
    title: string;
    description: string;
    severity: string;
    category: string;
    recommendation: string;
}

interface PredictiveInsightsData {
    insights: PredictiveInsightItem[];
    overall_health_score: number;
    resource_allocation_recommendations: string;
}

interface PredictiveInsightsProps {
    data: PredictiveInsightsData | null;
    isLoading: boolean;
    onRefresh: () => void;
    onAddToast?: (msg: string, type?: 'success' | 'info' | 'warning') => void;
}

export default function PredictiveInsights({ data, isLoading, onRefresh, onAddToast }: PredictiveInsightsProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [dispatchingStatus, setDispatchingStatus] = useState<'idle' | 'dispatching' | 'completed' | 'dismissed'>('idle');
    const [allCrewsStatus, setAllCrewsStatus] = useState<'idle' | 'dispatching' | 'completed'>('idle');

    // Reset single dispatch status when carousel slide changes
    useEffect(() => {
        setDispatchingStatus('idle');
    }, [activeIndex]);

    const handleNext = () => {
        if (!data || !data.insights.length) return;
        setActiveIndex((prev) => (prev + 1) % data.insights.length);
    };

    const handlePrev = () => {
        if (!data || !data.insights.length) return;
        setActiveIndex((prev) => (prev - 1 + data.insights.length) % data.insights.length);
    };

    const formatTextWithPills = (text: string) => {
        if (!text) return null;
        // Regex matches:
        // 1. # followed by uppercase letters, numbers, e.g. #RD-1234, #VALVE-302, #BIN-104, #DRN-4022
        // 2. Double-asterisk bolded texts, e.g. **Cluster A (46.9, 89)** or **text**
        // 3. Parenthesized coordinates, e.g. (26.9124, 75.7873)
        const regex = /(#\b[A-Z0-9_-]+\b|\*\*[^*]+\*\*|\(\d+\.\d+,\s*\d+\.\d+\))/g;
        const parts = text.split(regex);
        return (
            <span>
                {parts.map((part, idx) => {
                    if (part.startsWith('#')) {
                        return (
                            <span key={idx} className="inline-block px-1.5 py-0.5 mx-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-mono font-black rounded border border-slate-200 dark:border-slate-700 shadow-sm leading-none">
                                {part}
                            </span>
                        );
                    } else if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                            <strong key={idx} className="text-slate-900 dark:text-slate-100 font-black">
                                {part.slice(2, -2)}
                            </strong>
                        );
                    } else if (part.startsWith('(') && part.endsWith(')')) {
                        return (
                            <span key={idx} className="inline-block px-1.5 py-0.5 mx-0.5 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-[9px] font-mono font-bold rounded border border-blue-100 dark:border-blue-900/40">
                                📍 {part}
                            </span>
                        );
                    }
                    return part;
                })}
            </span>
        );
    };

    const formatRecommendations = (text: string) => {
        if (!text) return null;
        const sentences = text.split(/(?<=\.)\s+/).filter(Boolean);
        return (
            <ul className="list-disc pl-4 space-y-1.5 mt-2 max-w-[70ch]">
                {sentences.map((sentence, idx) => (
                    <li key={idx} className="leading-relaxed text-slate-600 dark:text-slate-350 font-semibold text-[11px]">
                        {formatTextWithPills(sentence)}
                    </li>
                ))}
            </ul>
        );
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 w-full min-h-[220px] h-auto animate-pulse flex flex-col justify-center items-center space-y-3">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Gemini is analyzing infrastructure patterns...</p>
            </div>
        );
    }

    if (!data || !data.insights || data.insights.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 w-full min-h-[220px] h-auto flex flex-col justify-center items-center text-center space-y-2">
                <Sparkles className="w-8 h-8 text-indigo-500 mb-1" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No active predictive insights available.</p>
                <button 
                    onClick={onRefresh}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold rounded-lg text-[10px] border border-blue-100 dark:border-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                    <RefreshCw className="w-3 h-3" /> Analyze Infrastructure
                </button>
            </div>
        );
    }

    const currentInsight = data.insights[activeIndex];
    const score = data.overall_health_score;

    // Determine health score color classes
    let scoreColorClass = 'text-green-600 stroke-green-500 bg-green-50';
    let scoreStroke = 'rgb(34, 197, 94)';
    if (score < 50) {
        scoreColorClass = 'text-red-600 stroke-red-500 bg-red-50';
        scoreStroke = 'rgb(220, 38, 38)';
    } else if (score < 80) {
        scoreColorClass = 'text-amber-600 stroke-amber-500 bg-amber-50';
        scoreStroke = 'rgb(245, 158, 11)';
    }

    // Radial Gauge Constants
    const radius = 24;
    const circumference = 2 * Math.PI * radius; // Approx 150.8
    const strokeOffset = circumference - (circumference * score) / 100;

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 w-full flex flex-col md:flex-row gap-6 items-start relative overflow-visible transition-all duration-300">
            
            {/* Left section: Health Gauge and Allocation suggestions */}
            <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                    <div className="flex items-center gap-4">
                        {/* SVG Radial Gauge */}
                        <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="32"
                                    cy="32"
                                    r={radius}
                                    className="stroke-slate-100 dark:stroke-slate-800 fill-transparent"
                                    strokeWidth="5"
                                />
                                <circle
                                    cx="32"
                                    cy="32"
                                    r={radius}
                                    fill="transparent"
                                    stroke={scoreStroke}
                                    strokeWidth="5"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeOffset}
                                    className="transition-all duration-700 ease-out"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{score}</span>
                                <span className="text-[7px] text-slate-400 dark:text-slate-500 uppercase font-extrabold tracking-wider">Health</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-indigo-500" /> Operations Command Center
                                </h3>
                                <button 
                                    onClick={onRefresh}
                                    className="text-slate-400 dark:text-slate-500 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors rounded-full p-1 cursor-pointer"
                                    title="Recalculate Insights"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Live City Infrastructure Analytics</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm self-start sm:self-center select-none"
                    >
                        <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        Export Operations Report
                    </button>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-350 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-150 dark:border-slate-800/60 p-4 rounded-xl flex-grow flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] text-blue-600 dark:text-blue-405 uppercase font-extrabold flex items-center gap-1.5 mb-1.5 tracking-wider">
                            <Bot className="w-4 h-4 text-blue-500" /> Crew Dispatch Allocation Plan
                        </span>
                        {formatRecommendations(data.resource_allocation_recommendations)}
                    </div>
                    
                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => {
                                setAllCrewsStatus('dispatching');
                                if (onAddToast) onAddToast('Optimizing resource allocation. All municipal crews dispatched!', 'success');
                                setTimeout(() => setAllCrewsStatus('completed'), 1200);
                            }}
                            disabled={allCrewsStatus !== 'idle'}
                            className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold rounded-lg text-[9px] hover:bg-black dark:hover:bg-white uppercase tracking-wider transition-all disabled:opacity-60 cursor-pointer shadow-sm"
                        >
                            {allCrewsStatus === 'idle' && 'Dispatch All Crews'}
                            {allCrewsStatus === 'dispatching' && 'Optimizing Dispatch...'}
                            {allCrewsStatus === 'completed' && '✅ Dispatch Scheduled'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right section: Highlighted Insight Card with Carousel controls */}
            <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between space-y-4">
                {currentInsight && (
                    <>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-lg border ${
                                    currentInsight.severity.toLowerCase().includes('high') 
                                        ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/60 text-red-700 dark:text-red-400' 
                                        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/60 text-amber-700 dark:text-amber-400'
                                }`}>
                                    {currentInsight.severity}
                                </span>
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider">
                                    {currentInsight.category}
                                </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{currentInsight.title}</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold max-w-[70ch]">
                                {formatTextWithPills(currentInsight.description)}
                            </p>
                        </div>

                        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/40 text-blue-800 dark:text-blue-300 rounded-xl text-[11px] leading-relaxed">
                            <span className="font-bold flex items-center gap-1.5 text-[10px] uppercase text-blue-700 dark:text-blue-405 tracking-wider mb-1.5">
                                <Lightbulb className="w-3.5 h-3.5 text-blue-600" /> Suggested Action
                            </span>
                            <span className="font-semibold max-w-[70ch] block">
                                {formatTextWithPills(currentInsight.recommendation)}
                            </span>
                        </div>

                        {/* Carousel Controls */}
                        {data.insights.length > 1 && (
                            <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-slate-50 dark:border-slate-800 mt-auto">
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                                    Insight {activeIndex + 1} of {data.insights.length}
                                </span>
                                 <div className="flex gap-2">
                                     <button 
                                         onClick={handlePrev}
                                         className="w-7 h-7 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                     >
                                         <ChevronLeft className="w-4 h-4" />
                                     </button>
                                     <button 
                                         onClick={handleNext}
                                         className="w-7 h-7 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                     >
                                         <ChevronRight className="w-4 h-4" />
                                     </button>
                                 </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
