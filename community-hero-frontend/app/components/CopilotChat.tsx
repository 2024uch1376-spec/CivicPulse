'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, AlertCircle, Send, X, Bot } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface CopilotChatProps {
    externalPrompt?: string | null;
    clearExternalPrompt?: () => void;
    userRole?: string;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onRefresh?: () => void;
    onAddToast?: (msg: string, type: 'success' | 'info' | 'warning') => void;
    username?: string;
}

export default function CopilotChat({ 
    externalPrompt = null, 
    clearExternalPrompt, 
    userRole, 
    isOpen, 
    setIsOpen,
    onRefresh,
    onAddToast,
    username = ''
}: CopilotChatProps) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Hello! I am your AI Copilot. I have access to the live issues database. Ask me to summarize reports, identify critical issues, or draft notification emails!' }
    ]);

    const [isLoading, setIsLoading] = useState(false);
    const messageEndRef = useRef<HTMLDivElement>(null);

    // Automatically trigger prompts sent from the map card/drawer
    useEffect(() => {
        if (externalPrompt) {
            setIsOpen(true);
            handleSend(externalPrompt);
            if (clearExternalPrompt) clearExternalPrompt();
        }
    }, [externalPrompt]);

    // Auto-scroll to the bottom of the chat window when new messages arrive
    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: ChatMessage = { role: 'user', content: text };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Keep only last 10 messages for token context window efficiency
            const history = messages.slice(-10);

            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: history,
                    username: username
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to connect to Copilot');
            }

            const data = await response.json();
            let displayResponse = data.response;

            if (displayResponse.includes('[SYSTEM_ACTION:SIMULATE]')) {
                displayResponse = displayResponse.replace('[SYSTEM_ACTION:SIMULATE]', '').trim();
                if (onRefresh) onRefresh();
                if (onAddToast) onAddToast("Copilot: Simulated citizen report spawned successfully!", "success");
            }

            setMessages((prev) => [...prev, { role: 'assistant', content: displayResponse }]);
        } catch (error: any) {
            console.error('Copilot Chat Error:', error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: `⚠️ ${error.message || 'Sorry, I ran into an error communicating with the server. Please check that the backend is running.'}` }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        handleSend(suggestion);
    };

    const formatMarkdown = (text: string) => {
        return text.split('\n').map((line, idx) => {
            // Headers
            if (line.startsWith('### ')) {
                return <h4 key={idx} className="text-sm font-bold text-gray-900 dark:text-white mt-2 mb-1">{line.slice(4)}</h4>;
            }
            if (line.startsWith('## ')) {
                return <h3 key={idx} className="text-base font-bold text-gray-900 dark:text-white mt-3 mb-1">{line.slice(3)}</h3>;
            }
            if (line.startsWith('# ')) {
                return <h2 key={idx} className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2">{line.slice(2)}</h2>;
            }
            // List Items
            if (line.startsWith('- ') || line.startsWith('* ')) {
                return <li key={idx} className="ml-4 list-disc text-sm text-gray-700 dark:text-slate-300 my-0.5">{line.slice(2)}</li>;
            }
            // Normal paragraph (handling bold markdown **text**)
            const parts = line.split('**');
            if (parts.length > 1) {
                return (
                    <p key={idx} className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed mb-1.5">
                        {parts.map((part, partIdx) => partIdx % 2 === 1 ? <strong key={partIdx} className="font-bold text-gray-900 dark:text-white">{part}</strong> : part)}
                    </p>
                );
            }
            // Normal line
            return <p key={idx} className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed mb-1.5">{line || '\u00A0'}</p>;
        });
    };

    const suggestions = [
        "Simulate Pothole Report",
        "Simulate Garbage Report",
        "Plan crew route for Transportation",
        "Summarize all critical issues"
    ];

    if (userRole === 'citizen' || !isOpen) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-[10000] font-sans animate-in slide-in-from-bottom duration-200">
            <div className="w-[380px] h-[550px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200/60 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right">
                    {/* Header */}
                    <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white flex justify-between items-center shadow-md">
                        <div className="flex items-center gap-2.5">
                            <Bot className="w-5 h-5 text-blue-400" />
                            <div>
                                <h3 className="font-bold text-sm">AI Copilot Assistant</h3>
                                <p className="text-[10px] text-slate-300">Analyzing live database in real-time</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-grow p-4 overflow-y-auto space-y-3 flex flex-col bg-gray-50/50 dark:bg-slate-950/20">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <span className="text-[9px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">
                                    {msg.role === 'user' ? 'Administrator' : 'Copilot AI'}
                                </span>
                                <div
                                    className={`p-3 rounded-2xl max-w-[85%] shadow-sm ${
                                        msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-tr-sm'
                                            : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 border border-gray-200/50 dark:border-slate-700 rounded-tl-sm'
                                    }`}
                                >
                                    {msg.role === 'user' ? (
                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                    ) : (
                                        <div>{formatMarkdown(msg.content)}</div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="flex flex-col items-start">
                                <span className="text-[9px] text-gray-400 font-semibold mb-1 uppercase tracking-wider">Copilot AI</span>
                                <div className="p-3 bg-white dark:bg-slate-800 border border-gray-200/50 dark:border-slate-700 rounded-2xl rounded-tl-sm flex items-center gap-1 shadow-sm">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messageEndRef} />
                    </div>

                    {/* Suggestions */}
                    <div className="flex items-center gap-2 p-2 overflow-x-auto bg-gray-50 dark:bg-slate-950 border-t border-b border-gray-100 dark:border-slate-850 select-none whitespace-nowrap scrollbar-thin">
                        {suggestions.map((suggestion, i) => (
                            <button
                                key={i}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[11px] text-gray-600 dark:text-slate-300 px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer whitespace-nowrap transition-all duration-200 shadow-sm shrink-0"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>

                    {/* Input Area */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend(input);
                        }}
                        className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            disabled={isLoading}
                            className="flex-grow px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-850 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="bg-blue-600 disabled:bg-slate-100 dark:disabled:bg-slate-850 disabled:text-slate-400 dark:disabled:text-slate-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 hover:shadow transition-all transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                            <Send className="w-3.5 h-3.5" /> Send
                        </button>
                    </form>
                </div>
        </div>
    );
}
