import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, MessageCircle, User, Bot, Loader2, ArrowRight, GripVertical } from 'lucide-react';
import { createChatSession, sendMessageToAI } from '../services/geminiService';
import { Message } from '../types';
import { Chat } from "@google/genai";

interface AIAssistantProps {
    onOpenRestaurant: (restaurantId: string, mealId?: string) => void;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onOpenRestaurant }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatSession = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Dragging State
    const [position, setPosition] = useState<{ x: number | null, y: number | null }>({ x: null, y: null }); 
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!chatSession.current) {
            chatSession.current = createChatSession();
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    // Drag Handlers
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (isOpen) return;
        
        isDragging.current = true;
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        const currentRect = (e.currentTarget as Element).getBoundingClientRect();
        
        dragOffset.current = {
            x: clientX - currentRect.left,
            y: clientY - currentRect.top
        };
        
        // Initialize position if null
        if (position.x === null) {
             setPosition({ x: currentRect.left, y: currentRect.top });
        }
        
        if ('touches' in e) document.body.style.overflow = 'hidden';
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging.current) return;
            
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            
            let newX = clientX - dragOffset.current.x;
            let newY = clientY - dragOffset.current.y;
            
            // Boundary checks
            const maxX = window.innerWidth - 60;
            const maxY = window.innerHeight - 80;
            
            if (newX < 0) newX = 0;
            if (newX > maxX) newX = maxX;
            if (newY < 80) newY = 80; // Below header
            if (newY > maxY) newY = maxY;
            
            setPosition({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            if (isDragging.current) {
                isDragging.current = false;
                document.body.style.overflow = '';
                
                // Snap to wall logic
                setPosition(prev => {
                    if (prev.x === null) return prev;
                    const windowWidth = window.innerWidth;
                    const threshold = windowWidth / 2;
                    // Snap to left (10px) or right (windowWidth - 70px)
                    const snappedX = prev.x < threshold ? 10 : windowWidth - 70;
                    return { x: snappedX, y: prev.y };
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleMouseMove, { passive: false });
        window.addEventListener('touchend', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, []);

    const handleSend = async () => {
        if (!input.trim() || !chatSession.current) return;
        
        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        const response = await sendMessageToAI(chatSession.current, userMsg.text);
        
        const aiMsg: Message = { 
            id: (Date.now() + 1).toString(), 
            role: 'model', 
            text: response.text,
            recommendedMealId: response.recommendedMealId,
            recommendedRestaurantId: response.recommendedRestaurantId
        };
        
        setMessages(prev => [...prev, aiMsg]);
        setLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Calculate dynamic styles
    const containerStyle: React.CSSProperties = isOpen 
        ? { bottom: '90px', right: '24px', top: 'auto', left: 'auto' }
        : (position.x !== null && position.y !== null)
            ? { top: position.y, left: position.x, bottom: 'auto', right: 'auto' }
            : { bottom: '90px', right: '24px' }; // Default position above footer

    return (
        <div 
            style={containerStyle}
            className={`fixed z-[11000] flex flex-col items-end transition-all duration-300 ease-out`}
        >
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[90vw] max-w-sm mb-4 overflow-hidden animate-slide-up flex flex-col max-h-[500px] h-[500px] ring-1 ring-black/5">
                    {/* Header */}
                    <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-1.5 rounded-lg border border-white/20">
                                <Sparkles size={18} className="text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base text-white">PickMe Chef</h3>
                                <p className="text-[11px] text-gray-300 font-medium">Your personal food concierge</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors text-white">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 text-sm mt-10 px-6">
                                <div className="bg-white w-16 h-16 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <Bot size={32} className="text-primary" />
                                </div>
                                <p className="mb-2 font-bold text-gray-900">👋 Hi! I'm PickMe Chef.</p>
                                <p className="text-xs leading-relaxed">I'm a culinary expert here to help you find the perfect meal. Tell me what you're craving!</p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${msg.role === 'user' ? 'bg-white border-gray-200' : 'bg-white border-gray-200'}`}>
                                    {msg.role === 'user' ? <User size={14} className="text-gray-700"/> : <Bot size={14} className="text-primary"/>}
                                </div>
                                <div className="flex flex-col gap-2 max-w-[80%]">
                                    <div className={`p-3.5 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                                        msg.role === 'user' 
                                            ? 'bg-gray-900 text-white rounded-tr-none' 
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                                    }`}>
                                        {msg.text}
                                    </div>
                                    
                                    {/* Action Button for Recommendations */}
                                    {msg.role === 'model' && msg.recommendedMealId && msg.recommendedRestaurantId && (
                                        <button 
                                            onClick={() => onOpenRestaurant(msg.recommendedRestaurantId!, msg.recommendedMealId!)}
                                            className="bg-primary text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 hover:bg-red-600 transition-colors shadow-md self-start border-2 border-primary"
                                        >
                                            View Dish <ArrowRight size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                                    <Bot size={14} className="text-primary"/>
                                </div>
                                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin text-primary" />
                                    <span className="text-xs text-gray-500 font-medium">Chef is thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-gray-200 shrink-0">
                        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-2 border-2 border-transparent focus-within:bg-white focus-within:border-primary transition-all">
                            <input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder-gray-400 min-w-0 px-2"
                            />
                            <button 
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="p-2.5 bg-primary text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-primary transition-colors shadow-sm"
                            >
                                <Send size={16} fill="currentColor" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!isOpen && (
                <div 
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                    className="cursor-grab active:cursor-grabbing touch-none select-none relative"
                >
                    <button 
                        onClick={() => setIsOpen(true)}
                        className="bg-primary hover:bg-red-600 text-white p-4 rounded-full shadow-2xl hover:shadow-primary/40 transition-all flex items-center gap-2 group z-[1000] ring-4 ring-white"
                    >
                        <MessageCircle size={26} fill="currentColor" />
                        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out font-bold whitespace-nowrap pl-0 group-hover:pl-2">PickMe Chef</span>
                    </button>
                    {/* Visual Grip Handle */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 bg-gray-200/50 rounded-full p-0.5 text-gray-400">
                        <GripVertical size={12} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIAssistant;