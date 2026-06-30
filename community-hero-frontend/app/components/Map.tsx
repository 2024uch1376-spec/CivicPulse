'use client';

import { useEffect, useState, useRef } from 'react';
import { X, MapPin, CheckCircle2, Mail, Truck, Check } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { MapContainer, TileLayer, Marker, useMap, Tooltip, useMapEvents, Circle, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
    address?: string; // Added
}

interface MapProps {
    issues: CivicIssue[];
    onRefresh?: () => void;
    formLocation: { lat: number; lng: number } | null;
    setFormLocation: (loc: { lat: number; lng: number } | null) => void;
    onDraftPrompt?: (prompt: string) => void;
    username?: string;
    userRole?: string;
    onAddToast?: (msg: string, type?: 'success' | 'info' | 'warning') => void;
    theme?: 'light' | 'dark';
    isAdminVerified?: boolean;
}

const getMarkerIcon = (severity: string, status: string = '', upvotes: number = 0) => {
    let colorClass = 'bg-blue-500';
    if (status?.toLowerCase() === 'resolved') {
        colorClass = 'bg-green-600';
    } else {
        const s = severity?.toLowerCase() || '';
        if (s === 'critical' || s === 'high') {
            colorClass = 'bg-red-600 animate-pulse';
        } else if (s === 'medium') {
            colorClass = 'bg-yellow-500';
        } else {
            colorClass = 'bg-green-500';
        }
    }

    // A glowing halo ring if highly verified by the community
    const isHighlyVerified = upvotes >= 3;
    const ringClass = isHighlyVerified ? 'ring-[5px] ring-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.6)]' : '';

    return L.divIcon({
        className: 'bg-transparent',
        html: `<div class="w-6 h-6 rounded-full border-[3px] border-white shadow-[0_4px_10px_rgba(0,0,0,0.4)] ${colorClass} ${ringClass}"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
    });
};

function FlyToNewest({ center, issuesCount }: { center: [number, number]; issuesCount: number }) {
    const map = useMap();
    const prevCountRef = useRef(issuesCount);
    const isFirstMount = useRef(true);

    useEffect(() => {
        if (isFirstMount.current || issuesCount > prevCountRef.current) {
            map.setView(center, 14, { animate: true });
            isFirstMount.current = false;
        }
        prevCountRef.current = issuesCount;
    }, [center, map, issuesCount]);
    return null;
}

// Helper component to bind click events on the Leaflet map
function MapClickEvents({ onClick }: { onClick: (latlng: L.LatLng) => void }) {
    useMapEvents({
        click(e) {
            onClick(e.latlng);
        }
    });
    return null;
}

// Helper component to handle interactive zoom and scroll gestures cooperatively
function MapInteractionController() {
    const map = useMap();
    useEffect(() => {
        // Disable scroll zoom by default to prevent hijacking page scroll
        map.scrollWheelZoom.disable();

        const container = map.getContainer();
        const enableZoom = () => {
            map.scrollWheelZoom.enable();
        };
        const disableZoom = () => {
            map.scrollWheelZoom.disable();
        };

        // Enable zoom on click/interaction, disable when cursor leaves the map area
        container.addEventListener('click', enableZoom);
        container.addEventListener('mouseleave', disableZoom);

        return () => {
            container.removeEventListener('click', enableZoom);
            container.removeEventListener('mouseleave', disableZoom);
        };
    }, [map]);
    return null;
}

export default function Map({ issues = [], onRefresh, formLocation, setFormLocation, onDraftPrompt, username, userRole, onAddToast, theme = 'light', isAdminVerified = false }: MapProps) {
    // Track which issue the admin is currently inspecting
    const [selectedIssue, setSelectedIssue] = useState<CivicIssue | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [drawerUsername, setDrawerUsername] = useState('');
    const [mapLayer, setMapLayer] = useState<'light' | 'satellite'>('light');
    const [showCrews, setShowCrews] = useState<boolean>(false);
    const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [tspRoute, setTspRoute] = useState<any[]>([]);
    const [crewPosition, setCrewPosition] = useState<[number, number] | null>(null);
    const [crewStatus, setCrewStatus] = useState<string>('Idle at Depot');

    const fetchTspRoute = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/crews/route`);
            if (response.ok) {
                const data = await response.json();
                setTspRoute(data.route || []);
            }
        } catch (error) {
            console.error("Error fetching TSP route:", error);
        }
    };

    useEffect(() => {
        fetchTspRoute();
    }, [issues]);

    // Crew vehicle real-time simulation animation loop
    useEffect(() => {
        if (!showCrews || tspRoute.length <= 2) {
            setCrewPosition(null);
            setCrewStatus('Idle at Depot');
            return;
        }

        let isMounted = true;
        
        const runSimulation = async () => {
            // Set starting position at depot
            if (isMounted) {
                setCrewPosition([tspRoute[0].latitude, tspRoute[0].longitude]);
                setCrewStatus('Preparing crew at Depot...');
            }
            await new Promise((resolve) => setTimeout(resolve, 1500)); // prep delay

            // Loop through all stops
            for (let i = 0; i < tspRoute.length - 1; i++) {
                if (!isMounted) break;

                const startPoint = tspRoute[i];
                const endPoint = tspRoute[i + 1];

                // Update status message
                if (isMounted) {
                    if (endPoint.is_depot) {
                        setCrewStatus('All stops completed. Returning to Depot...');
                    } else {
                        setCrewStatus(`En Route to Stop #${endPoint.stop_number}: ${endPoint.title}`);
                    }
                }

                // Smooth coordinate interpolation (movement simulation)
                const totalSteps = 40;
                const msPerStep = 60; // total 2.4 seconds per path leg
                
                for (let step = 1; step <= totalSteps; step++) {
                    if (!isMounted) break;
                    
                    const ratio = step / totalSteps;
                    const interpolatedLat = startPoint.latitude + (endPoint.latitude - startPoint.latitude) * ratio;
                    const interpolatedLng = startPoint.longitude + (endPoint.longitude - startPoint.longitude) * ratio;
                    
                    if (isMounted) {
                        setCrewPosition([interpolatedLat, interpolatedLng]);
                    }
                    await new Promise((resolve) => setTimeout(resolve, msPerStep));
                }

                // Handle arrival at a stop/depot
                if (!isMounted) break;

                if (endPoint.is_depot) {
                    if (isMounted) {
                        setCrewStatus('Back at Depot. Shift complete.');
                        onAddToast('🚚 Dispatch crew has returned to the Operations Depot.', 'success');
                    }
                } else {
                    if (isMounted) {
                        setCrewStatus(`Inspecting & repairing Stop #${endPoint.stop_number}: ${endPoint.title}`);
                        onAddToast(`🚚 Crew arrived at Stop #${endPoint.stop_number} for repairs: ${endPoint.title}`, 'info');
                    }
                    // Wait at the stop for 3 seconds representing repair work
                    await new Promise((resolve) => setTimeout(resolve, 3000));
                }
            }
        };

        runSimulation();

        return () => {
            isMounted = false;
        };
    }, [showCrews, tspRoute]);

    const fetchComments = async (issueId: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/issues/${issueId}/comments`);
            if (response.ok) {
                const data = await response.json();
                setComments(data.comments || []);
            }
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('citizen_username') || '';
            setDrawerUsername(saved);
        }
        if (selectedIssue) {
            fetchComments(selectedIssue.id);
        } else {
            setComments([]);
        }
    }, [selectedIssue]);

    const updateStatus = async (issueId: string, newStatus: string) => {
        setIsUpdating(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/issues/${issueId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to update status');
            }

            const data = await response.json();
            // Update selectedIssue state locally to show immediate changes in drawer
            setSelectedIssue(data.issue);

            // Trigger parent refresh to update the map markers and stats
            if (onRefresh) onRefresh();

            if (onAddToast) {
                if (newStatus === 'Dispatched') {
                    onAddToast(`Maintenance crew dispatched to "${data.issue.title}"!`, 'info');
                } else if (newStatus === 'Resolved') {
                    onAddToast(`Incident "${data.issue.title}" marked resolved!`, 'success');
                }
            }

        } catch (error: any) {
            console.error("Error updating status:", error);
            alert(`Error updating status: ${error.message || 'Is your backend server running?'}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const upvoteIssue = async (issueId: string, name: string) => {
        setIsUpdating(true);
        try {
            const url = name.trim() 
                ? `${API_BASE_URL}/api/issues/${issueId}/upvote?username=${encodeURIComponent(name.trim())}`
                : `${API_BASE_URL}/api/issues/${issueId}/upvote`;
                
            const response = await fetch(url, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to register upvote');
            }

            const data = await response.json();
            // Update selectedIssue state locally to show immediate changes in drawer
            setSelectedIssue(data.issue);

            // Trigger parent refresh to update the map markers and stats
            if (onRefresh) onRefresh();

            if (onAddToast) {
                onAddToast(`Verification recorded for "${data.issue.title}"!`, 'success');
            }

        } catch (error: any) {
            console.error("Error upvoting issue:", error);
            alert(`Error upvoting issue: ${error.message || 'Is your backend server running?'}\n\nHint: Ensure you have executed the Supabase SQL migration: ALTER TABLE civic_issues ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0;`);
        } finally {
            setIsUpdating(false);
        }
    };

    const verifyIssue = async (issueId: string, name: string) => {
        if (!name || !name.trim()) {
            alert("Please enter a username to verify this issue and claim points.");
            return;
        }
        setIsUpdating(true);
        try {
            const url = `${API_BASE_URL}/api/issues/${issueId}/verify?username=${encodeURIComponent(name.trim())}`;
            const response = await fetch(url, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to verify issue');
            }

            const data = await response.json();
            setSelectedIssue(data.issue);

            if (onRefresh) onRefresh();

            if (onAddToast) {
                onAddToast(data.message || `Verification recorded!`, 'success');
            }
        } catch (error: any) {
            console.error("Error verifying issue:", error);
            alert(`Error verifying issue: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const flagIssue = async (issueId: string, name: string) => {
        if (!name || !name.trim()) {
            alert("Please enter a username to flag this issue.");
            return;
        }
        setIsUpdating(true);
        try {
            const url = `${API_BASE_URL}/api/issues/${issueId}/flag?username=${encodeURIComponent(name.trim())}`;
            const response = await fetch(url, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to flag issue');
            }

            const data = await response.json();
            setSelectedIssue(null);
            setIsExpanded(false);

            if (onRefresh) onRefresh();

            if (onAddToast) {
                onAddToast(data.message || `Issue flagged as duplicate or spam.`, 'info');
            }
        } catch (error: any) {
            console.error("Error flagging issue:", error);
            alert(`Error flagging issue: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const postComment = async (issueId: string, name: string, text: string) => {
        setIsUpdating(true);
        try {
            const url = `${API_BASE_URL}/api/issues/${issueId}/comments?username=${encodeURIComponent(name.trim())}&text=${encodeURIComponent(text.trim())}`;
            const response = await fetch(url, {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to post comment');
            }

            const data = await response.json();
            setComments(data.comments || []);
            setNewComment(""); // Clear comment input
            
            if (onAddToast) {
                onAddToast(`Comment posted successfully!`, 'success');
            }
        } catch (error: any) {
            console.error("Error posting comment:", error);
            alert(`Error posting comment: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const defaultCenter: [number, number] = [26.9124, 75.7873];
    const dynamicCenter: [number, number] = issues.length > 0
        ? [issues[0].latitude, issues[0].longitude]
        : defaultCenter;

    return (
        // We added 'relative' to this wrapper container so the sidebar can float inside it
        <div className="relative border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm h-full w-full">
            <style>{`
                @keyframes leaflet-dash {
                    to {
                        stroke-dashoffset: -20;
                    }
                }
                .leaflet-dispatch-route {
                    stroke-dasharray: 8, 8;
                    animation: leaflet-dash 1s linear infinite;
                }
            `}</style>

            {/* Floating Map Controls overlay */}
            <div className="absolute top-4 right-4 z-[999] bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-300/95 dark:border-slate-800 p-3.5 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.22)] dark:shadow-[0_15px_35px_rgba(0,0,0,0.5)] space-y-3 flex flex-col w-48 text-left transition-all duration-350">
                <div>
                    <h4 className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Map View Layer</h4>
                    <div className="grid grid-cols-2 gap-1.5">
                        <button
                            type="button"
                            onClick={() => setMapLayer('light')}
                            className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                mapLayer === 'light'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-extrabold'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 font-semibold'
                            }`}
                        >
                            Vector
                        </button>
                        <button
                            type="button"
                            onClick={() => setMapLayer('satellite')}
                            className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                mapLayer === 'satellite'
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-extrabold'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 font-semibold'
                            }`}
                        >
                            Satellite
                        </button>
                    </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/85 pt-2.5 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        <input
                            type="checkbox"
                            checked={showCrews}
                            onChange={(e) => setShowCrews(e.target.checked)}
                            className="w-3.5 h-3.5 text-blue-600 border-slate-300 dark:border-slate-700 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        Show Active Crews
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        <input
                            type="checkbox"
                            checked={showHeatmap}
                            onChange={(e) => setShowHeatmap(e.target.checked)}
                            className="w-3.5 h-3.5 text-blue-600 border-slate-300 dark:border-slate-700 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        Show Risk Heatmap
                    </label>
                </div>
            </div>

            <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 10 }}>
                <MapInteractionController />
                {/* Conditionally render light-mode vector tiles vs satellite tiles */}
                {mapLayer === 'light' ? (
                    theme === 'dark' ? (
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                    ) : (
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />
                    )
                ) : (
                    <TileLayer
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                )}

                <FlyToNewest center={dynamicCenter} issuesCount={issues.length} />

                {/* Tag new locations on click */}
                <MapClickEvents onClick={(latlng) => setFormLocation({ lat: latlng.lat, lng: latlng.lng })} />

                {/* Draggable new report pin with bouncy animation */}
                {formLocation && (
                    <Marker
                        position={[formLocation.lat, formLocation.lng]}
                        draggable={true}
                        eventHandlers={{
                            dragend: (e) => {
                                const marker = e.target;
                                const position = marker.getLatLng();
                                setFormLocation({ lat: position.lat, lng: position.lng });
                            }
                        }}
                        icon={L.divIcon({
                            className: 'bg-transparent',
                            html: `<div class="w-6 h-6 rounded-full border-[3px] border-white shadow-[0_4px_12px_rgba(37,99,235,0.6)] bg-blue-600 animate-bounce"></div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12],
                        })}
                    >
                        <Tooltip permanent direction="top" offset={[0, -10]}>
                            <span className="font-bold text-xs text-blue-700">Drag to adjust location</span>
                        </Tooltip>
                    </Marker>
                )}

                {issues.map((issue) => (
                    <Marker
                        key={issue.id}
                        position={[issue.latitude, issue.longitude]}
                        icon={getMarkerIcon(issue.severity, issue.status, issue.upvotes)}
                        // NEW: Instead of a popup, clicking a marker sets the active issue state
                        eventHandlers={{
                            click: () => {
                                setSelectedIssue(issue);
                                setIsExpanded(false);
                            },
                        }}
                    >
                        {/* Hover Tooltip showing quick details */}
                        <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                            <div className="px-1 py-0.5">
                                <p className="font-bold text-xs text-gray-900">
                                    {(() => {
                                        const stopIndex = tspRoute.findIndex(r => r.id === issue.id);
                                        return stopIndex !== -1 ? `[Stop #${stopIndex}] ` : '';
                                    })()}
                                    {issue.title}
                                </p>
                                <p className="text-[10px] text-gray-500 font-semibold">{issue.category} • {issue.severity} Severity</p>
                            </div>
                        </Tooltip>
                    </Marker>
                ))}

                {/* Municipal Dispatch Depot Marker */}
                <Marker
                    position={[26.9250, 75.7750]}
                    icon={L.divIcon({
                        className: 'bg-transparent',
                        html: `<div class="w-8 h-8 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-sm shadow-md cursor-pointer select-none">🏢</div>`,
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    })}
                >
                    <Tooltip direction="top" offset={[0, -10]}>
                        <div className="px-1 py-0.5 font-bold text-xs text-slate-800">
                            Municipal Operations Depot
                        </div>
                    </Tooltip>
                </Marker>

                {/* Animated Dispatch Route Polyline */}
                {selectedIssue && selectedIssue.status === 'Dispatched' && (
                    <Polyline
                        positions={[
                            [26.9250, 75.7750], // Depot coords
                            [selectedIssue.latitude, selectedIssue.longitude] // Selected issue coords
                        ]}
                        pathOptions={{
                            color: '#3b82f6', // blue-500
                            weight: 4,
                            opacity: 0.8,
                            className: 'leaflet-dispatch-route' // uses animated dash offset keyframe
                        }}
                    />
                )}

                {/* Multi-stop Optimized Route Polyline */}
                {showCrews && tspRoute.length > 2 && (
                    <Polyline
                        positions={tspRoute.map(r => [r.latitude, r.longitude] as [number, number])}
                        pathOptions={{
                            color: '#10B981', // green-500 (emerald)
                            weight: 4,
                            opacity: 0.75,
                            className: 'leaflet-dispatch-route' // uses animated dash offset keyframe
                        }}
                    />
                )}

                {/* Simulated Live Crew Vehicle (Truck 🚚) */}
                {showCrews && crewPosition && (
                    <Marker
                        position={crewPosition}
                        zIndexOffset={1000} // Render on top of overlapping pins
                        icon={L.divIcon({
                            className: 'bg-transparent',
                            html: `<div class="w-9 h-9 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-lg shadow-xl animate-bounce cursor-pointer select-none">🚚</div>`,
                            iconSize: [36, 36],
                            iconAnchor: [18, 18]
                        })}
                    >
                        <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                            <div className="px-2 py-1 font-bold text-xs bg-slate-900 text-white rounded-lg shadow-md border border-slate-700 max-w-[200px]">
                                <p className="text-emerald-400 font-extrabold uppercase text-[9px] tracking-wider mb-0.5">Active Crew Tracker</p>
                                <p className="text-white text-xs font-semibold leading-normal">{crewStatus}</p>
                            </div>
                        </Tooltip>
                    </Marker>
                )}

                {/* Dynamic Risk Heatmap Overlays */}
                {showHeatmap && issues.map((issue) => {
                    const isUrgent = issue.severity?.toLowerCase() === 'critical' || issue.severity?.toLowerCase() === 'high';
                    if (!isUrgent || issue.status?.toLowerCase() === 'resolved') return null;
                    
                    const fillColor = issue.severity?.toLowerCase() === 'critical' ? '#EF4444' : '#F97316';
                    
                    return (
                        <Circle
                            key={`heat-${issue.id}`}
                            center={[issue.latitude, issue.longitude]}
                            radius={800}
                            pathOptions={{
                                fillColor: fillColor,
                                fillOpacity: 0.15,
                                color: fillColor,
                                weight: 1.5,
                                dashArray: '4,4'
                            }}
                        />
                    );
                })}

                {/* Simulated crew markers overlaid on selection */}
                {showCrews && (
                    <>
                        <Marker
                            position={[26.9200, 75.7900]}
                            icon={L.divIcon({
                                className: 'bg-transparent',
                                html: `<div class="w-7 h-7 rounded-full border-2 border-white bg-slate-900 text-white shadow-lg flex items-center justify-center font-bold text-sm select-none">🚚</div>`,
                                iconSize: [28, 28],
                                iconAnchor: [14, 14],
                            })}
                        >
                            <Tooltip permanent direction="top" offset={[0, -10]}>
                                <div className="text-[9px] font-bold text-slate-800 leading-tight">
                                    Crew A (Waste Mgt)
                                    <span className="block text-[8px] text-green-600 font-extrabold mt-0.5">STATUS: ON SITE</span>
                                </div>
                            </Tooltip>
                        </Marker>
                        <Marker
                            position={[26.8900, 75.7600]}
                            icon={L.divIcon({
                                className: 'bg-transparent',
                                html: `<div class="w-7 h-7 rounded-full border-2 border-white bg-slate-900 text-white shadow-lg flex items-center justify-center font-bold text-sm select-none">🚚</div>`,
                                iconSize: [28, 28],
                                iconAnchor: [14, 14],
                            })}
                        >
                            <Tooltip permanent direction="top" offset={[0, -10]}>
                                <div className="text-[9px] font-bold text-slate-800 leading-tight">
                                    Crew B (Transportation)
                                    <span className="block text-[8px] text-amber-600 font-extrabold mt-0.5">STATUS: EN ROUTE</span>
                                </div>
                            </Tooltip>
                        </Marker>
                    </>
                )}
            </MapContainer>
            {selectedIssue && !isExpanded && (
                <div className="absolute bottom-4 right-4 z-[999] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-205 dark:border-slate-800 rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)] w-80 flex flex-col gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
                    {selectedIssue.image_url && (
                        <div className="rounded-xl overflow-hidden h-24 w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80">
                            <img src={selectedIssue.image_url} alt={selectedIssue.title} className="object-cover w-full h-full" />
                        </div>
                    )}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-wrap gap-1.5">
                            <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded ${
                                selectedIssue.severity.toLowerCase() === 'critical' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30' :
                                selectedIssue.severity.toLowerCase() === 'high' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30' : 
                                selectedIssue.severity.toLowerCase() === 'medium' ? 'bg-yellow-50 text-yellow-850 dark:bg-amber-950/20 dark:text-amber-400 border border-yellow-100 dark:border-amber-900/30' : 
                                'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-100 dark:border-green-900/30'
                            }`}>
                                {selectedIssue.severity} Priority
                            </span>
                            <span className="bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border border-slate-200/40 dark:border-slate-800">
                                {selectedIssue.category}
                            </span>
                        </div>
                        <button 
                            onClick={() => { setSelectedIssue(null); setIsExpanded(false); }} 
                            className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{selectedIssue.title}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold line-clamp-2 mt-0.5 leading-relaxed">{selectedIssue.summary}</p>
                    </div>
                    <button
                        onClick={() => setIsExpanded(true)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer"
                    >
                        View Details →
                    </button>
                </div>
            )}

            {/* Slide-Out Admin Drawer with Glassmorphism */}
            <div
                className={`absolute top-0 right-0 h-full w-96 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-[-10px_0_30px_rgba(0,0,0,0.08)] dark:shadow-[-10px_0_30px_rgba(0,0,0,0.4)] transition-transform duration-300 ease-in-out z-[1000] flex flex-col border-l border-slate-200/50 dark:border-slate-800
          ${selectedIssue && isExpanded ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {selectedIssue && (
                    <>
                        {/* Header Area */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between items-start">
                            <div>
                                <span className="inline-block px-2 py-0.5 bg-slate-250 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-extrabold uppercase tracking-wider rounded">
                                    ID: {selectedIssue.id.substring(0, 8)}
                                </span>
                                <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mt-2.5 leading-snug tracking-tight">{selectedIssue.title}</h3>
                            </div>
                            <button
                                onClick={() => { setSelectedIssue(null); setIsExpanded(false); }}
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* AI Analysis Details */}
                        <div className="p-6 flex-grow overflow-y-auto space-y-5">
                            {selectedIssue.image_url && (
                                <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-md h-48 w-full bg-slate-50 dark:bg-slate-800 group">
                                    {selectedIssue.image_url.startsWith('blob:') || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(selectedIssue.image_url) ? (
                                        <video 
                                            src={selectedIssue.image_url} 
                                            controls 
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <img 
                                            src={selectedIssue.image_url} 
                                            alt={selectedIssue.title} 
                                            className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-500"
                                        />
                                    )}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg text-white shadow-sm
                  ${selectedIssue.severity.toLowerCase() === 'critical' ? 'bg-rose-600' :
                                        selectedIssue.severity.toLowerCase() === 'high' ? 'bg-orange-500' : 'bg-amber-500'}`}>
                                    {selectedIssue.severity} Priority
                                </span>
                                <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg border
                  ${selectedIssue.status === 'Resolved' ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/40 dark:text-green-400' :
                                        selectedIssue.status === 'Dispatched' ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/20 dark:border-purple-900/40 dark:text-purple-400' : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/40 dark:text-blue-400'}`}>
                                    {selectedIssue.status}
                                </span>
                                <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg border bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/40 dark:text-blue-400 shadow-sm flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {selectedIssue.verifications_count !== undefined ? selectedIssue.verifications_count : (selectedIssue.upvotes || 0)} Verifications
                                </span>
                                {(selectedIssue.flags_count || 0) > 0 && (
                                    <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg border bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400 shadow-sm flex items-center gap-1.5">
                                        ⚠️ {selectedIssue.flags_count} Flags
                                    </span>
                                )}
                            </div>

                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Assigned Department</h4>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{selectedIssue.department}</p>
                            </div>

                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">AI Triage Summary</h4>
                                <div className="text-xs text-slate-600 dark:text-slate-200 leading-relaxed bg-blue-50/50 dark:bg-blue-950/10 p-4 rounded-xl border border-blue-100/50 dark:border-blue-900/30 space-y-1.5">
                                    {selectedIssue.summary.split('\n\n').map((para, i) => (
                                        <p key={i}>{para}</p>
                                    ))}
                                </div>
                            </div>

                            {selectedIssue.address && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Physical Address</h4>
                                    <p className="text-xs text-slate-750 dark:text-slate-300 font-semibold bg-slate-50 dark:bg-slate-950/45 border border-slate-200/60 dark:border-slate-800 p-3 rounded-xl leading-relaxed flex items-start gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" /> {selectedIssue.address}
                                    </p>
                                </div>
                            )}

                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">GPS Coordinates</h4>
                                <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/45 border border-slate-200/60 dark:border-slate-800 px-3 py-1.5 rounded-lg inline-block">
                                    {selectedIssue.latitude.toFixed(5)}, {selectedIssue.longitude.toFixed(5)}
                                </p>
                            </div>

                            {/* Link to Official City Systems */}
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5">
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Link to Official City Systems</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* GIS Sync */}
                                    <div className="p-3 bg-slate-50 dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 rounded-xl space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">Official City Map</span>
                                        </div>
                                        <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                                            GIS-{selectedIssue.id.substring(0, 5).toUpperCase()}
                                        </p>
                                        <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal">Added to city map</p>
                                    </div>

                                    {/* SAP Work Order Sync */}
                                    <div className="p-3 bg-slate-50 dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 rounded-xl space-y-1">
                                        {selectedIssue.status === 'Reported' ? (
                                            <>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">City Work Order</span>
                                                </div>
                                                <p className="text-xs font-mono text-yellow-600 dark:text-yellow-400 font-extrabold">
                                                    Waiting for Crew
                                                </p>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal">Waiting to assign a team</p>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">City Work Order</span>
                                                </div>
                                                <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">
                                                    WO-{selectedIssue.id.substring(4, 9).toUpperCase()}
                                                </p>
                                                <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-normal">
                                                    {selectedIssue.status === 'Resolved' ? 'Job finished and closed' : 'Team sent to fix this'}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Activity & Comments Thread */}
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Activity & Comments</h4>
                                
                                {/* Comments List */}
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                    {comments.length === 0 ? (
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">No updates or comments posted yet.</p>
                                    ) : (
                                        comments.map((comment) => (
                                            <div key={comment.id} className="p-2.5 bg-slate-50 dark:bg-slate-950/45 border border-slate-200/60 dark:border-slate-800/85 rounded-xl text-xs space-y-1">
                                                <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-505">
                                                    <span className="font-bold text-slate-700 dark:text-slate-300">{comment.username}</span>
                                                    <span>{comment.timestamp}</span>
                                                </div>
                                                <p className="text-slate-600 dark:text-slate-300 leading-normal">{comment.text}</p>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Write Comment Input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={username ? "Write a progress update..." : "🔒 Please sign in to post comments..."}
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        disabled={!username}
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter' && username && newComment.trim()) {
                                                await postComment(selectedIssue.id, username, newComment);
                                            }
                                        }}
                                        className="flex-grow h-[32px] px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-850 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        onClick={async () => {
                                            if (username && newComment.trim()) {
                                                await postComment(selectedIssue.id, username, newComment);
                                            }
                                        }}
                                        disabled={isUpdating || !newComment.trim() || !username}
                                        className="h-[32px] px-3 bg-blue-600 hover:bg-blue-750 disabled:bg-slate-150 disabled:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs transition-all cursor-pointer shadow-sm active:scale-98"
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                            {selectedIssue.status !== 'Resolved' ? (
                                <>
                                    {/* Citizen feedback section */}
                                    {userRole === 'citizen' && (
                                        <div className="space-y-2">
                                            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Citizen Feedback</h4>
                                            {username ? (
                                                <div className="space-y-2.5 bg-slate-50/50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                                    <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold w-full">
                                                        <span>Action as <strong className="text-slate-800 dark:text-slate-200 font-bold">{username}</strong></span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => verifyIssue(selectedIssue.id, username)}
                                                            disabled={isUpdating}
                                                            className="flex-1 h-[30px] px-3 bg-blue-600 hover:bg-blue-750 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer shadow-sm disabled:opacity-50"
                                                        >
                                                            {isUpdating ? '...' : <><CheckCircle2 className="w-3.5 h-3.5 text-white" /> Verify</>}
                                                        </button>
                                                        <button 
                                                            onClick={() => flagIssue(selectedIssue.id, username)}
                                                            disabled={isUpdating}
                                                            className="flex-1 h-[30px] px-3 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                                                        >
                                                            {isUpdating ? '...' : <>⚠️ Flag Spam</>}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-3.5 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-bold text-center">
                                                    🔒 Please sign in using the sidebar to verify or flag.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {userRole === 'admin' && (
                                        <>
                                            <div className="border-t border-slate-100 dark:border-slate-800 my-2"></div>

                                            {/* Admin Action section */}
                                            {!isAdminVerified ? (
                                                <div className="p-3.5 bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/30 rounded-xl text-xs flex flex-col gap-1 text-rose-800 dark:text-rose-300 font-bold leading-normal text-center">
                                                    <p>🛡️ Admin Verification Required</p>
                                                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">Please verify your Employee ID in the sidebar to perform operations.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2.5">
                                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Administrative Resolution</h4>
                                                    <button 
                                                        onClick={() => {
                                                            const loc = selectedIssue.address 
                                                                ? `Street Address: "${selectedIssue.address}" (Coordinates: ${selectedIssue.latitude.toFixed(5)}, ${selectedIssue.longitude.toFixed(5)})`
                                                                : `Coordinates: ${selectedIssue.latitude.toFixed(5)}, ${selectedIssue.longitude.toFixed(5)}`;
                                                            const p = `Draft a professional crew dispatch email for issue ID ${selectedIssue.id.substring(0, 8)} titled "${selectedIssue.title}" assigned to the "${selectedIssue.department}". Location: ${loc}. Details of the issue are: "${selectedIssue.summary}".`;
                                                            if (onDraftPrompt) onDraftPrompt(p);
                                                        }}
                                                        className="w-full h-[34px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
                                                    >
                                                        <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Draft Dispatch Email
                                                    </button>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button 
                                                            onClick={() => updateStatus(selectedIssue.id, 'Dispatched')}
                                                            disabled={isUpdating || selectedIssue.status === 'Dispatched'}
                                                            className="w-full h-[34px] bg-blue-600 hover:bg-blue-750 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer shadow-sm"
                                                        >
                                                            {isUpdating ? '...' : selectedIssue.status === 'Dispatched' ? <><Truck className="w-3.5 h-3.5 text-slate-400" /> Dispatched</> : <><Truck className="w-3.5 h-3.5 text-white" /> Dispatch Crew</>}
                                                        </button>
                                                        <button 
                                                            onClick={() => updateStatus(selectedIssue.id, 'Resolved')}
                                                            disabled={isUpdating}
                                                            className="w-full h-[34px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold rounded-lg text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            {isUpdating ? '...' : <><Check className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> Mark Resolved</>}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 text-green-700 dark:text-green-400 text-center text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                                    <CheckCircle2 className="w-4 h-4 text-green-700 dark:text-green-400" /> Issue Resolved
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}