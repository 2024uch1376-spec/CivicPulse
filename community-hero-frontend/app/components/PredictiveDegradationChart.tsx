'use client';

import { Sparkles, CloudRain } from 'lucide-react';

export default function PredictiveDegradationChart() {
    // 7 days historical actual + 3 days forecast
    const dataPoints = [
        { label: 'Tue', actual: 4, forecast: null },
        { label: 'Wed', actual: 6, forecast: null },
        { label: 'Thu', actual: 5, forecast: null },
        { label: 'Fri', actual: 8, forecast: null },
        { label: 'Sat', actual: 3, forecast: null },
        { label: 'Sun', actual: 4, forecast: null },
        { label: 'Mon', actual: 7, forecast: 7 }, // Connector point
        { label: 'Tue (F)', actual: null, forecast: 9 },
        { label: 'Wed (F)', actual: null, forecast: 11 },
        { label: 'Thu (F)', actual: null, forecast: 24 }, // Massive Spike
    ];

    const width = 500;
    const height = 180;
    const paddingLeft = 35;
    const paddingRight = 50;
    const paddingTop = 25;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Range of values (0 to 30)
    const yMax = 30;

    const getX = (index: number) => {
        return paddingLeft + (index * (chartWidth / (dataPoints.length - 1)));
    };

    const getY = (value: number) => {
        return paddingTop + chartHeight - (value * (chartHeight / yMax));
    };

    // Build SVG path for Actual (solid blue)
    let actualPoints = dataPoints.filter(d => d.actual !== null);
    let actualPath = '';
    actualPoints.forEach((pt, i) => {
        const x = getX(i);
        const y = getY(pt.actual!);
        actualPath += `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    });

    // Build SVG path for Forecast (dotted purple)
    let forecastPoints = dataPoints.filter(d => d.forecast !== null);
    let forecastPath = '';
    // Start forecast path from the last actual point to connect it
    const startForecastIdx = dataPoints.findIndex(d => d.actual !== null && d.forecast !== null);
    if (startForecastIdx !== -1) {
        const startX = getX(startForecastIdx);
        const startY = getY(dataPoints[startForecastIdx].actual!);
        forecastPath = `M ${startX} ${startY}`;
        forecastPoints.forEach((pt, i) => {
            const idx = dataPoints.indexOf(pt);
            if (idx > startForecastIdx) {
                const x = getX(idx);
                const y = getY(pt.forecast!);
                forecastPath += ` L ${x} ${y}`;
            }
        });
    }

    // Grid lines count
    const yGridLines = [0, 10, 20, 30];

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col h-full">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        72-Hour City Wear & Tear Forecast
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                        AI forecast of how weather will affect new issues
                    </p>
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative w-full mt-4 flex-grow flex items-center justify-center">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    {yGridLines.map((val) => (
                        <g key={val}>
                            <line 
                                x1={paddingLeft} 
                                y1={getY(val)} 
                                x2={width - paddingRight} 
                                y2={getY(val)} 
                                className="stroke-slate-100 dark:stroke-slate-800"
                                strokeWidth="1"
                            />
                            <text 
                                x={paddingLeft - 8} 
                                y={getY(val) + 3} 
                                textAnchor="end"
                                className="fill-slate-400 dark:fill-slate-500 text-[10px] font-bold font-mono"
                            >
                                {val}
                            </text>
                        </g>
                    ))}

                    {/* Thursday Spike Event Marker Annotation */}
                    {(() => {
                        const spikeIdx = dataPoints.length - 1;
                        const spikeX = getX(spikeIdx);
                        const spikeY = getY(24);
                        return (
                            <g>
                                <line 
                                    x1={spikeX} 
                                    y1={getY(0)} 
                                    x2={spikeX} 
                                    y2={spikeY} 
                                    className="stroke-rose-500/40 dark:stroke-rose-500/25"
                                    strokeWidth="1.5"
                                    strokeDasharray="3 3"
                                />
                                <circle 
                                    cx={spikeX} 
                                    cy={spikeY} 
                                    r="5" 
                                    className="fill-rose-500 stroke-white dark:stroke-slate-900"
                                    strokeWidth="1.5"
                                />
                                <foreignObject x={spikeX - 165} y={spikeY - 20} width="160" height="38">
                                    <div className="bg-rose-50/95 dark:bg-rose-950/95 border border-rose-200 dark:border-rose-900/60 p-1.5 rounded-lg shadow-sm text-[9px] font-black text-rose-700 dark:text-rose-455 flex items-center gap-1.5">
                                        <CloudRain className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                                        <span>🌧️ Expected 40mm Heavy Rain</span>
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    })()}

                    {/* Actual solid blue line */}
                    <path 
                        d={actualPath} 
                        fill="none" 
                        className="stroke-blue-500" 
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    {actualPoints.map((pt, i) => (
                        <circle 
                            key={i} 
                            cx={getX(i)} 
                            cy={getY(pt.actual!)} 
                            r="3.5" 
                            className="fill-blue-500 stroke-white dark:stroke-slate-900"
                            strokeWidth="1.5"
                        />
                    ))}

                    {/* Forecast dotted purple line */}
                    <path 
                        d={forecastPath} 
                        fill="none" 
                        className="stroke-purple-500" 
                        strokeWidth="3"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                    />
                    {forecastPoints.map((pt, i) => {
                        const idx = dataPoints.indexOf(pt);
                        return (
                            <circle 
                                key={i} 
                                cx={getX(idx)} 
                                cy={getY(pt.forecast!)} 
                                r="3.5" 
                                className="fill-purple-500 stroke-white dark:stroke-slate-900"
                                strokeWidth="1.5"
                            />
                        );
                    })}

                    {/* X axis labels */}
                    {dataPoints.map((pt, i) => (
                        <text 
                            key={i} 
                            x={getX(i)} 
                            y={height - 5} 
                            textAnchor="middle"
                            className="fill-slate-400 dark:fill-slate-500 text-[10px] font-bold"
                        >
                            {pt.label}
                        </text>
                    ))}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex gap-4 items-center mt-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-1.5 bg-blue-500 rounded" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reported (Last 7 Days)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3.5 h-1.5 bg-purple-500 border-dashed border-t-2 rounded" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">AI Forecast (Next 3 Days)</span>
                </div>
            </div>
        </div>
    );
}
