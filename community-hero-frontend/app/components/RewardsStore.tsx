'use client';

import { useState } from 'react';
import { Ticket, Bus, ShieldAlert, CheckCircle, Printer, X, ShoppingBag, Car, Sprout, Landmark } from 'lucide-react';
import { API_BASE_URL } from '../config';

const renderRewardIcon = (iconName: string) => {
    switch (iconName) {
        case 'bus': return <Bus className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
        case 'parking': return <Car className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
        case 'sprout': return <Sprout className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
        case 'museum': return <Landmark className="w-6 h-6 text-purple-600 dark:text-purple-400" />;
        default: return <Ticket className="w-6 h-6" />;
    }
};

interface RewardItem {
    id: string;
    title: string;
    description: string;
    cost: number;
    icon: string;
    color: string;
    category: string;
}

interface RewardsStoreProps {
    username: string;
    userPoints: number;
    onRedeemSuccess: (message: string) => void;
    onAddToast: (msg: string, type: 'success' | 'info' | 'warning') => void;
}

export default function RewardsStore({ username, userPoints, onRedeemSuccess, onAddToast }: RewardsStoreProps) {
    const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
    const [selectedVoucher, setSelectedVoucher] = useState<{
        reward: RewardItem;
        serial: string;
    } | null>(null);

    const rewards: RewardItem[] = [
        {
            id: 'transit_pass',
            title: '24h Public Transit Pass',
            description: 'Free unlimited travel on municipal metro and bus networks for a full day.',
            cost: 50,
            icon: 'bus',
            color: 'from-blue-500 to-indigo-600',
            category: 'Transportation'
        },
        {
            id: 'parking_pass',
            title: '2-Hour Smart Parking',
            description: 'Complimentary street parking voucher valid at any city smart-parking meter.',
            cost: 30,
            icon: 'parking',
            color: 'from-emerald-500 to-teal-600',
            category: 'Parking & Traffic'
        },
        {
            id: 'gardening_kit',
            title: 'Urban Gardening Kit',
            description: 'Organic seed variety pack, soil nutrient pouch, and biodegradable pots from City Parks.',
            cost: 80,
            icon: 'sprout',
            color: 'from-amber-500 to-orange-600',
            category: 'Parks & Environment'
        },
        {
            id: 'museum_ticket',
            title: 'Albert Hall Museum Entry',
            description: 'Single-entry access pass to the historical exhibits and royal galleries.',
            cost: 40,
            icon: 'museum',
            color: 'from-purple-500 to-pink-600',
            category: 'Culture & Tourism'
        }
    ];

    const handleRedeem = async (reward: RewardItem) => {
        if (!username) {
            onAddToast("Please sign in to redeem rewards!", "warning");
            return;
        }

        if (userPoints < reward.cost) {
            onAddToast("Insufficient points for this reward!", "warning");
            return;
        }

        setIsRedeeming(reward.id);
        try {
            const response = await fetch(`${API_BASE_URL}/api/redeem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                    cost: reward.cost
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                onAddToast(errData.detail || 'Redemption failed', 'warning');
                return;
            }

            const randomSerial = 'MUNI-' + Math.random().toString(36).substring(2, 7).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
            
            // Trigger refetch of points in parent
            onRedeemSuccess(`Successfully redeemed ${reward.title}!`);
            
            // Set active voucher to show success modal
            setSelectedVoucher({
                reward: reward,
                serial: randomSerial
            });
        } catch (error: any) {
            console.warn(error);
            onAddToast(error.message || "Failed to redeem reward.", "warning");
        } finally {
            setIsRedeeming(null);
        }
    };

    const handlePrintVoucher = () => {
        window.print();
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm mt-8">
            <div className="flex items-center gap-2 mb-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">City Rewards Store</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold mt-0.5">Trade your helper points for bus tickets, park passes, and other city rewards</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {rewards.map((reward) => {
                    const isAffordable = username && userPoints >= reward.cost;
                    
                    return (
                        <div key={reward.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-200 dark:hover:border-slate-700 transition-all hover:shadow-sm bg-slate-50/30 dark:bg-slate-800/20">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                                        {renderRewardIcon(reward.icon)}
                                    </div>
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                        {reward.category}
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-3">{reward.title}</h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mt-1.5">{reward.description}</p>
                            </div>

                            <div className="flex items-center justify-between mt-4 border-t border-slate-100/60 dark:border-slate-800/60 pt-3">
                                <span className="text-xs font-black text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 px-2.5 py-1 rounded-lg">
                                    {reward.cost} pts
                                </span>
                                
                                {!username ? (
                                    <button 
                                        disabled
                                        className="text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-3.5 py-2 rounded-xl"
                                    >
                                        Sign In to Redeem
                                    </button>
                                ) : isAffordable ? (
                                    <button
                                        onClick={() => handleRedeem(reward)}
                                        disabled={isRedeeming !== null}
                                        className="text-[10px] font-extrabold uppercase bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl transition-all cursor-pointer active:scale-97 disabled:opacity-50"
                                    >
                                        {isRedeeming === reward.id ? 'Redeeming...' : 'Redeem Reward'}
                                    </button>
                                ) : (
                                    <button
                                        disabled
                                        className="text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-3.5 py-2 rounded-xl"
                                    >
                                        Need {reward.cost - userPoints} more pts
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Voucher Success Modal */}
            {selectedVoucher && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <style>{`
                        @media print {
                            body * {
                                visibility: hidden !important;
                            }
                            .infrastructure-report, [class*="infrastructure-report"] {
                                display: none !important;
                            }
                            .voucher-print-card, .voucher-print-card * {
                                visibility: visible !important;
                            }
                            .voucher-print-card {
                                display: flex !important;
                                position: absolute !important;
                                left: 0 !important;
                                top: 0 !important;
                                width: 100% !important;
                                height: 100% !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                border: none !important;
                                box-shadow: none !important;
                                background: white !important;
                                color: black !important;
                            }
                        }
                    `}</style>
                    <div className="voucher-print-card bg-white dark:bg-slate-900 max-w-sm w-full rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col print:absolute print:inset-0 print:m-0 print:w-full print:max-w-none print:shadow-none print:border-none">
                        
                        {/* Header Banner */}
                        <div className={`p-6 bg-gradient-to-r ${selectedVoucher.reward.color} text-white text-center relative print:bg-none print:text-black print:border-b print:border-slate-300`}>
                            <button
                                onClick={() => setSelectedVoucher(null)}
                                className="absolute right-4 top-4 text-white/80 hover:text-white hover:bg-white/15 p-1 rounded-full transition-colors print:hidden cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <span className="text-5xl select-none print:hidden">{selectedVoucher.reward.icon}</span>
                            <h3 className="text-lg font-black uppercase tracking-tight mt-2 print:text-2xl print:text-left print:mt-0">
                                Municipal Benefit Voucher
                            </h3>
                            <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-0.5 print:text-slate-500 print:text-left">
                                City of Jaipur Civic Reward Program
                            </p>
                        </div>

                        {/* Ticket Body */}
                        <div className="p-6 text-center space-y-4 flex-grow print:text-left print:p-8">
                            <div className="inline-flex p-3 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900 rounded-full text-green-600 print:hidden">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            
                            <div>
                                <h4 className="text-base font-extrabold text-slate-800 dark:text-white print:text-xl">{selectedVoucher.reward.title}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mt-1">{selectedVoucher.reward.description}</p>
                            </div>

                            {/* Scannable Mock QR Code */}
                            <div className="flex flex-col items-center justify-center py-2 print:items-start">
                                <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 shadow-inner flex items-center justify-center w-28 h-28 print:w-36 print:h-36">
                                    {/* Styled dynamic SVG grid representing a barcode/QR code */}
                                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800 dark:text-slate-200">
                                        <rect width="10" height="10" x="5" y="5" fill="currentColor"/>
                                        <rect width="10" height="10" x="20" y="5" fill="currentColor"/>
                                        <rect width="10" height="10" x="5" y="20" fill="currentColor"/>
                                        <rect width="10" height="10" x="85" y="5" fill="currentColor"/>
                                        <rect width="10" height="10" x="70" y="5" fill="currentColor"/>
                                        <rect width="10" height="10" x="85" y="20" fill="currentColor"/>
                                        <rect width="10" height="10" x="5" y="85" fill="currentColor"/>
                                        <rect width="10" height="10" x="20" y="85" fill="currentColor"/>
                                        <rect width="10" height="10" x="5" y="70" fill="currentColor"/>
                                        {/* Randomized QR pixels */}
                                        <rect width="6" height="6" x="35" y="35" fill="currentColor"/>
                                        <rect width="8" height="8" x="45" y="45" fill="currentColor"/>
                                        <rect width="6" height="6" x="55" y="30" fill="currentColor"/>
                                        <rect width="10" height="4" x="30" y="60" fill="currentColor"/>
                                        <rect width="4" height="10" x="65" y="55" fill="currentColor"/>
                                        <rect width="8" height="8" x="75" y="75" fill="currentColor"/>
                                        <rect width="6" height="6" x="40" y="75" fill="currentColor"/>
                                    </svg>
                                </div>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest mt-2">
                                    Scan QR at Counter
                                </span>
                            </div>

                            {/* Ticket Info Details */}
                            <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-800 py-3 text-left space-y-1.5 print:border-none print:py-0">
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-slate-400 dark:text-slate-500 uppercase">Redeemed By</span>
                                    <span className="text-slate-800 dark:text-slate-200">{username}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-slate-400 dark:text-slate-500 uppercase">Voucher ID</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-mono">{selectedVoucher.serial}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-slate-400 dark:text-slate-500 uppercase">Redeem Date</span>
                                    <span className="text-slate-800 dark:text-slate-200">{new Date().toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-850 flex gap-2.5 print:hidden">
                            <button
                                onClick={handlePrintVoucher}
                                className="flex-grow flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow active:scale-98"
                            >
                                <Printer className="w-4 h-4" /> Print Voucher
                            </button>
                            <button
                                onClick={() => setSelectedVoucher(null)}
                                className="px-4 py-2.5 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
