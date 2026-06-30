'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Check, AlertTriangle, X } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface ReportFormProps {
    location: { lat: number; lng: number } | null;
    setLocation: (loc: { lat: number; lng: number } | null) => void;
    onReportSubmitted?: () => void;
    loggedInUsername?: string;
    isVerified?: boolean;
    userRole?: 'admin' | 'citizen';
}

export default function ReportForm({ location, setLocation, onReportSubmitted, loggedInUsername, isVerified = false, userRole = 'citizen' }: ReportFormProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); // State for the image preview
    const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
    const [status, setStatus] = useState<'idle' | 'locating' | 'uploading' | 'success' | 'error'>('idle');
    const [isDuplicateMerged, setIsDuplicateMerged] = useState(false); // NEW: Track duplicate check results
    const [errorMessage, setErrorMessage] = useState('');
    const [username, setUsername] = useState('');
    const [description, setDescription] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Create a temporary URL to display the image immediately
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);

        if (selectedFile) {
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setFileType(selectedFile.type.startsWith('video/') ? 'video' : 'image');
        } else {
            setPreviewUrl(null);
            setFileType(null);
        }
    };

    // Clean up the temporary URL so we don't leak memory
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // Load username from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('citizen_username') || '';
            setUsername(saved);
        }
    }, []);

    // Grab GPS Coordinates using the browser's Geolocation API
    const handleGetLocation = () => {
        setStatus('locating');
        if (!navigator.geolocation) {
            setErrorMessage('Geolocation is not supported by your browser');
            setStatus('error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
                setStatus('idle');
            },
            () => {
                setErrorMessage('Unable to retrieve your location. Please allow location access.');
                setStatus('error');
            }
        );
    };

    // Submit the data to your FastAPI backend
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !location) return;

        setStatus('uploading');
        const formData = new FormData();
        formData.append('image', file);
        formData.append('latitude', location.lat.toString());
        formData.append('longitude', location.lng.toString());
        
        const activeUser = loggedInUsername || username;
        if (activeUser.trim()) {
            formData.append('username', activeUser.trim());
        }
        if (description.trim()) {
            formData.append('description', description.trim());
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/report`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to submit report');
            }

            const data = await response.json();
            setIsDuplicateMerged(!!data.is_duplicate);
            setStatus('success');
            
            // Trigger parent refresh to reload state dynamically without hard refresh
            if (onReportSubmitted) {
                onReportSubmitted();
            }

            // Reset form fields after 3 seconds
            setTimeout(() => {
                setFile(null);
                setPreviewUrl(null);
                setFileType(null);
                setLocation(null);
                setDescription('');
                setStatus('idle');
                setIsDuplicateMerged(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }, 3000);

        } catch (error: any) {
            console.error('Report submission failed:', error);
            setErrorMessage(error.message || 'Server connection failed.');
            setStatus('error');
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col min-h-[600px] h-full">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-500" /> Intake New Incident Report
            </h3>

            <form onSubmit={handleSubmit} className="flex-grow flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                    {/* Media Upload Area */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">1. Upload Media (Image/Video)</label>
                        <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                            ref={fileInputRef}
                            className="hidden"
                        />
                        {previewUrl ? (
                            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-32 w-full shadow-sm flex items-center justify-center">
                                {fileType === 'video' ? (
                                    <video src={previewUrl} controls className="object-cover w-full h-full" />
                                ) : (
                                    <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFile(null);
                                        setPreviewUrl(null);
                                        setFileType(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    className="absolute top-2 right-2 bg-slate-900/60 hover:bg-slate-900/80 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors shadow z-10"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border border-dashed border-slate-200/85 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/15 dark:hover:bg-blue-950/20 hover:border-blue-500/80 cursor-pointer rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all group"
                            >
                                <Camera className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2 group-hover:scale-110 transition-transform duration-200" />
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to upload image or video</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Supports PNG, JPG, MP4, WebM</p>
                            </div>
                        )}
                    </div>

                    {/* Geolocation Tagging */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">2. Tag Location</label>
                        {location ? (
                            <div className="p-3 bg-green-50/80 dark:bg-green-950/20 border border-green-100 dark:border-green-905 text-green-700 dark:text-green-300 rounded-xl text-xs flex items-center justify-center gap-1.5 font-bold">
                                <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> Location Tagged ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <button
                                    type="button"
                                    onClick={handleGetLocation}
                                    disabled={status === 'locating'}
                                    className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                                >
                                    {status === 'locating' ? 'Finding location...' : <><MapPin className="w-3.5 h-3.5 text-blue-500" /> Get My GPS Location</>}
                                </button>
                                <p className="text-[10px] text-slate-400 dark:text-slate-400 text-center leading-normal">
                                    Or click anywhere directly on the map to place a draggable pin!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Citizen Identity */}
                    {loggedInUsername ? (
                        userRole === 'citizen' && !isVerified ? (
                            <div className="p-3.5 bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/30 rounded-xl text-xs flex flex-col gap-1 text-rose-800 dark:text-rose-300 font-bold leading-normal">
                                <p>⚠️ Address Verification Required</p>
                                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Please verify your address in the sidebar to submit reports.</p>
                            </div>
                        ) : (
                            <div className="p-3 bg-slate-50 dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">Reporting as:</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-black uppercase">
                                        {loggedInUsername.substring(0, 1).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-slate-800 dark:text-white text-xs">{loggedInUsername}</span>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="p-3.5 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 rounded-xl text-xs flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                            🔒 Please sign in using the sidebar to submit reports.
                        </div>
                    )}

                    {/* Issue Description Field */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">4. Description / Details (Optional)</label>
                        <textarea
                            rows={2}
                            placeholder="Add details (e.g., pothole depth, hazard level...)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="space-y-3 mt-auto">
                    <button
                        type="submit"
                        disabled={!file || !location || status === 'uploading' || !loggedInUsername || (userRole === 'citizen' && !isVerified)}
                        className="w-full py-3.5 px-4 border border-transparent rounded-xl text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:shadow-none disabled:cursor-not-allowed font-bold text-sm tracking-wide transition-all transform active:scale-98 shadow-sm hover:shadow cursor-pointer"
                    >
                        {status === 'uploading' 
                            ? 'Analyzing with AI...' 
                            : !loggedInUsername 
                                ? 'Sign In to Submit Report' 
                                : (userRole === 'citizen' && !isVerified)
                                    ? 'Verify Address to Submit'
                                    : 'Submit Report'}
                    </button>

                    {/* Status Messages */}
                    {status === 'success' && (
                        <div className={`p-3 rounded-xl text-xs flex items-center justify-center gap-1.5 font-bold animate-pulse ${
                            isDuplicateMerged 
                                ? 'bg-orange-100 dark:bg-orange-950/20 text-orange-850 dark:text-orange-300 border border-orange-200 dark:border-orange-900/60' 
                                : 'bg-green-100 dark:bg-green-950/20 text-green-850 dark:text-green-300 border border-green-200 dark:border-green-900/60'
                        }`}>
                            {isDuplicateMerged ? (
                                <><AlertTriangle className="w-4 h-4 text-orange-700 dark:text-orange-400" /> Duplicate detected! Merged with existing report.</>
                            ) : (
                                <><Check className="w-4 h-4 text-green-700 dark:text-green-400" /> Report successfully triaged & saved!</>
                            )}
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/60 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold">
                            {errorMessage}
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}