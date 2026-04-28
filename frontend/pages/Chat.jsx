import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { Send, Search, User as UserIcon, MessageSquare, ImagePlus, Film, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveMediaUrl } from '../services/media';
import { toast } from 'react-toastify';

const Chat = () => {
    const { 
        messages, 
        conversations, 
        activeChat, 
        setActiveChat, 
        fetchMessages, 
        fetchConversations, 
        sendMessage 
    } = useChat();
    const { user: currentUser } = useAuth();
    const [inputText, setInputText] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);
    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat._id);
        }
    }, [activeChat, fetchMessages]);

    useEffect(() => {
        if (!activeChat) return undefined;

        const interval = setInterval(() => {
            fetchMessages(activeChat._id);
            fetchConversations();
        }, 5000);

        return () => clearInterval(interval);
    }, [activeChat, fetchMessages, fetchConversations]);

    useEffect(() => () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
    }, [imagePreview]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const clearComposer = () => {
        setInputText('');
        setImageFile(null);
        setVideoFile(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview('');
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (activeChat && (inputText.trim() || imageFile || videoFile)) {
            setIsSending(true);
            try {
                await sendMessage({
                    receiverId: activeChat._id,
                    text: inputText,
                    imageFile,
                    videoFile,
                });
                clearComposer();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Could not send message');
            } finally {
                setIsSending(false);
            }
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setVideoFile(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        e.target.value = '';
    };

    const handleVideoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImageFile(null);
        setImagePreview('');
        setVideoFile(file);
        e.target.value = '';
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="container mx-auto px-4 h-[calc(100vh-120px)]">
            <div className="glass-card h-full flex overflow-hidden rounded-3xl border border-accent/10">
                
                {/* Conversations Sidebar */}
                <div className="w-full md:w-80 border-r border-accent/10 flex flex-col bg-white/50">
                    <div className="p-4 border-b border-accent/10">
                        <h2 className="text-xl font-bold mb-4 text-button flex items-center gap-2">
                            <MessageSquare size={20} className="text-button" />
                            Messages
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
                            <input
                                type="text"
                                placeholder="Search chats..."
                                className="w-full bg-surface border border-accent/20 rounded-xl py-2 pl-10 pr-4 focus:ring-2 focus:ring-button/40 outline-none transition-all text-ink placeholder:text-ink/40"
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {conversations.length === 0 ? (
                            <div className="text-center py-10 px-4">
                                <p className="text-ink/60 text-sm">No conversations yet. Start a chat from someone's profile!</p>
                            </div>
                        ) : (
                            conversations.map((chatUser) => (
                                <button
                                    key={chatUser._id}
                                    onClick={() => setActiveChat(chatUser)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                                        activeChat?._id === chatUser._id
                                            ? 'bg-button text-white shadow-lg shadow-button/20'
                                            : 'hover:bg-accent/10 text-ink'
                                    }`}
                                >
                                    <div className="relative">
                                        {chatUser.profilePic ? (
                                            <img src={resolveMediaUrl(chatUser.profilePic)} alt={chatUser.name} className="w-12 h-12 rounded-full object-cover border-2 border-white/20" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center border-2 border-white/20">
                                                <UserIcon size={24} />
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <h3 className="font-semibold text-sm text-ink truncate">{chatUser.name}</h3>
                                        <p className={`text-xs truncate ${activeChat?._id === chatUser._id ? 'text-white/80' : 'text-ink/60'}`}>
                                            Click to view message
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Message Window */}
                <div className="flex-1 flex flex-col bg-background/30 backdrop-blur-sm">
                    {activeChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-accent/10 flex items-center gap-3 bg-white/40">
                                {activeChat.profilePic ? (
                                    <img src={resolveMediaUrl(activeChat.profilePic)} alt={activeChat.name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                                        <UserIcon size={20} />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-ink">{activeChat.name}</h3>
                                    <span className="text-[10px] text-green-500 font-medium">Online</span>
                                </div>
                            </div>

                            {/* Messages area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                <AnimatePresence initial={false}>
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg._id}
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className={`flex ${msg.sender === currentUser._id ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                                                    msg.sender === currentUser._id
                                                        ? 'bg-button text-white rounded-tr-none'
                                                        : 'bg-white text-ink border border-accent/10 rounded-tl-none'
                                                }`}
                                            >
                                                {msg.image ? (
                                                    <div className="mb-2 overflow-hidden rounded-2xl">
                                                        <img src={resolveMediaUrl(msg.image)} alt="Shared attachment" className="max-h-72 w-full object-contain bg-black/5" />
                                                    </div>
                                                ) : null}
                                                {msg.video ? (
                                                    <div className="mb-2 overflow-hidden rounded-2xl bg-black/5">
                                                        <video src={resolveMediaUrl(msg.video)} controls className="max-h-72 w-full object-contain" />
                                                    </div>
                                                ) : null}
                                                {msg.text ? <p className="text-sm leading-relaxed">{msg.text}</p> : null}
                                                {(msg.image || msg.video) ? (
                                                    <a
                                                        href={resolveMediaUrl(msg.image || msg.video)}
                                                        download
                                                        className={`mt-2 inline-flex items-center gap-1 text-[11px] font-bold ${msg.sender === currentUser._id ? 'text-white/80' : 'text-primary'}`}
                                                    >
                                                        <Download size={12} />
                                                        Download
                                                    </a>
                                                ) : null}
                                                <p className={`text-[10px] mt-1 ${msg.sender === currentUser._id ? 'text-white/70' : 'text-ink/50'}`}>
                                                    {formatTime(msg.createdAt)}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input area */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-accent/10 bg-white/40">
                                {(imageFile || videoFile) && (
                                    <div className="mb-3 rounded-2xl border border-accent/15 bg-surface/85 p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                {imageFile ? (
                                                    <div className="flex items-center gap-3">
                                                        <img src={imagePreview} alt="Selected preview" className="h-14 w-14 rounded-2xl object-cover" />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold text-ink">{imageFile.name}</p>
                                                            <p className="text-xs text-muted">Image ready to send</p>
                                                        </div>
                                                    </div>
                                                ) : null}
                                                {videoFile ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel text-primary">
                                                            <Film size={22} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold text-ink">{videoFile.name}</p>
                                                            <p className="text-xs text-muted">Video ready to send</p>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                            <button type="button" onClick={clearComposer} className="rounded-xl p-2 text-muted hover:bg-panel hover:text-ink">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                                    <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoSelect} />
                                    <button
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        className="rounded-2xl border border-accent/20 bg-surface px-4 py-3 text-primary transition-colors hover:bg-panel"
                                        title="Send image"
                                    >
                                        <ImagePlus size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => videoInputRef.current?.click()}
                                        className="rounded-2xl border border-accent/20 bg-surface px-4 py-3 text-primary transition-colors hover:bg-panel"
                                        title="Send video"
                                    >
                                        <Film size={18} />
                                    </button>
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-surface border border-accent/20 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-button/40 outline-none transition-all shadow-inner text-ink placeholder:text-ink/40"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSending || (!inputText.trim() && !imageFile && !videoFile)}
                                        className="bg-button hover:bg-button/90 text-white rounded-2xl px-6 py-3 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-button/20"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-center flex-col items-center justify-center opacity-40">
                            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                                <MessageSquare size={40} className="text-button" />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-ink">Select a Conversation</h3>
                            <p className="text-sm text-ink/60">Choose a user from the left to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;
