import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    getChats, getChat, createChat, deleteChat, sendChatMessage, uploadChatContext, submitChatFeedback, editChatMessage 
} from '../api';
import { HiOutlineTrash, HiOutlinePlus, HiOutlineChatAlt2, HiOutlineX, HiOutlinePaperClip, HiOutlineDocumentText, HiOutlineDuplicate, HiOutlinePencil, HiOutlineCheck, HiOutlineThumbUp, HiOutlineThumbDown } from 'react-icons/hi';
import ChatAutocompletePopover, { renderFormattedChatMessage } from './ChatAutocompletePopover';
import AILoadingState from './AILoadingState';
import ChatbotAiAvatar from './ChatbotAiAvatar';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [attachedFile, setAttachedFile] = useState(null);
    const [extractedText, setExtractedText] = useState(null);

    // Autocomplete states for @ product tags and / slash commands
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [activeTrigger, setActiveTrigger] = useState(null);
    const [autocompleteQuery, setAutocompleteQuery] = useState('');

    // Message actions & feedback states
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingText, setEditingText] = useState('');
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [feedbackTargetIndex, setFeedbackTargetIndex] = useState(null);
    const [feedbackCategory, setFeedbackCategory] = useState('Incorrect Pricing Data');
    const [feedbackComment, setFeedbackComment] = useState('');
    const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);

    const handleCopyText = (text, index) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleStartEdit = (index, content) => {
        setEditingIndex(index);
        setEditingText(content);
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditingText('');
    };

    const handleSaveEdit = async (index) => {
        if (!editingText.trim() || isLoading) return;
        setIsLoading(true);
        try {
            const { data } = await editChatMessage(activeChatId, index, { message: editingText });
            setMessages(data.chat.messages);
            setEditingIndex(null);
            setEditingText('');
        } catch (err) {
            console.error('Failed to edit message:', err);
            setToastMessage({ type: 'error', text: 'Failed to update prompt. Please try again.' });
            setTimeout(() => setToastMessage(null), 4000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickLike = async (index, msg) => {
        try {
            const currentRating = msg.feedback?.rating;
            const newRating = currentRating === 'like' ? null : 'like';
            const { data } = await submitChatFeedback(activeChatId, index, { rating: newRating });
            
            setMessages(prev => prev.map((m, idx) => idx === index ? { ...m, feedback: data.feedback } : m));
            
            if (data.accepted) {
                setToastMessage({ type: 'success', text: 'Liked response! Feedback recorded.' });
            } else {
                setToastMessage({ type: 'info', text: data.message });
            }
            setTimeout(() => setToastMessage(null), 4000);
        } catch (err) {
            console.error('Feedback error:', err);
        }
    };

    const handleOpenFeedbackModal = (index) => {
        setFeedbackTargetIndex(index);
        setFeedbackCategory('Incorrect Pricing Data');
        setFeedbackComment('');
        setFeedbackModalOpen(true);
    };

    const handleSubmitFeedbackModal = async (e) => {
        if (e) e.preventDefault();
        if (feedbackTargetIndex === null) return;
        setFeedbackSubmitting(true);

        try {
            const { data } = await submitChatFeedback(activeChatId, feedbackTargetIndex, {
                rating: 'dislike',
                category: feedbackCategory,
                comment: feedbackComment
            });

            setMessages(prev => prev.map((m, idx) => idx === feedbackTargetIndex ? { ...m, feedback: data.feedback } : m));
            setFeedbackModalOpen(false);

            if (data.accepted) {
                setToastMessage({
                    type: 'success',
                    text: 'Feedback recorded! Thank you for helping improve PricePilot AI.'
                });
            } else {
                setToastMessage({
                    type: 'info',
                    text: 'Feedback received. Note: Off-topic query feedback (e.g. travel/trivia unrelated to e-commerce) is automatically filtered out from model training.'
                });
            }
            setTimeout(() => setToastMessage(null), 5000);
        } catch (err) {
            console.error('Submit feedback failed:', err);
            setToastMessage({ type: 'error', text: 'Failed to submit feedback. Please try again.' });
            setTimeout(() => setToastMessage(null), 4000);
        } finally {
            setFeedbackSubmitting(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isExpanded]);

    // Load chat history on mount & listen for Explain with AI events
    useEffect(() => {
        const handleExplainWithAI = (e) => {
            const { title, prompt: customPrompt, contextData, autoSubmit } = e.detail || {};
            setIsOpen(true);
            const prompt = customPrompt 
                ? (contextData && Object.keys(contextData).length > 0 
                    ? `${customPrompt}\nContext: ${JSON.stringify(contextData)}` 
                    : customPrompt)
                : `/explain-simply explain ${title || 'item'}: ${JSON.stringify(contextData || {})}`;
            setInput(prompt);
            if (autoSubmit) {
                setTimeout(() => {
                    const sendBtn = document.getElementById('chat-widget-submit-btn');
                    if (sendBtn) sendBtn.click();
                }, 150);
            }
        };

        window.addEventListener('open_explain_with_ai', handleExplainWithAI);
        return () => window.removeEventListener('open_explain_with_ai', handleExplainWithAI);
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadChats();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const loadChats = async () => {
        try {
            const { data } = await getChats();
            setChats(data);
            if (data.length > 0 && !activeChatId) {
                loadSingleChat(data[0]._id);
            } else if (data.length === 0) {
                handleNewChat();
            }
        } catch (error) {
            console.error("Failed to load chats", error);
        }
    };

    const loadSingleChat = async (id) => {
        try {
            const { data } = await getChat(id);
            setActiveChatId(id);
            setMessages(data.messages || []);
        } catch (error) {
            console.error("Failed to load chat", error);
        }
    };

    const handleNewChat = async () => {
        try {
            const { data } = await createChat({ title: 'New Chat', messages: [] });
            setChats([data, ...chats]);
            setActiveChatId(data._id);
            setMessages([{ role: 'model', content: "Hi! I'm PricePilot AI. How can I help you optimize your pricing and inventory today?" }]);
            setAttachedFile(null);
            setExtractedText(null);
        } catch (error) {
            console.error("Failed to create chat", error);
        }
    };

    const handleDeleteChat = async (e, id) => {
        e.stopPropagation();
        try {
            await deleteChat(id);
            setChats(chats.filter(c => c._id !== id));
            if (activeChatId === id) {
                setActiveChatId(null);
                setMessages([]);
                if (chats.length > 1) {
                    const nextChat = chats.find(c => c._id !== id);
                    if (nextChat) loadSingleChat(nextChat._id);
                } else {
                    handleNewChat();
                }
            }
        } catch (error) {
            console.error("Failed to delete chat", error);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setAttachedFile(file);
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const { data } = await uploadChatContext(formData);
            setExtractedText(data.text);
        } catch (error) {
            console.error("File parsing failed", error);
            setAttachedFile({ name: "Unable to read this file" });
            setExtractedText(null);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);

        const words = val.split(/\s+/);
        const lastWord = words[words.length - 1] || '';

        if (lastWord.startsWith('@')) {
            setActiveTrigger('@');
            setAutocompleteQuery(lastWord.substring(1));
            setPopoverOpen(true);
        } else if (lastWord.startsWith('/')) {
            setActiveTrigger('/');
            setAutocompleteQuery(lastWord.substring(1));
            setPopoverOpen(true);
        } else {
            setPopoverOpen(false);
            setActiveTrigger(null);
            setAutocompleteQuery('');
        }
    };

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setPopoverOpen(false);
        setIsLoading(true);

        // Update local state temporarily
        const newMessages = [...messages, { role: 'user', content: userMsg }];
        setMessages(newMessages);

        try {
            let chatId = activeChatId;
            if (!chatId) {
                const { data } = await createChat({ title: userMsg.substring(0, 30), messages: [] });
                chatId = data._id;
                setActiveChatId(chatId);
            }

            const payload = { message: userMsg };
            if (extractedText) {
                payload.contextText = extractedText;
                setAttachedFile(null);
                setExtractedText(null);
            }

            const { data } = await sendChatMessage(chatId, payload);
            setMessages(data.chat.messages);
            loadChats(); // refresh titles
        } catch (error) {
            console.error("Failed to send message", error);
            setMessages([...newMessages, { role: 'model', content: "Sorry, I encountered an error. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (location.pathname === '/dashboard/chat') {
        return null; // Don't render floating widget on full chat page
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Floating Trigger Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    aria-label="PricePilot AI Chatbot"
                    title="PricePilot AI Chatbot"
                    className="relative group w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-[0_4px_24px_rgba(168,90,60,0.4)] hover:shadow-[0_6px_28px_rgba(168,90,60,0.55)] transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center border border-white/20 cursor-pointer"
                >
                    <div className="relative flex items-center justify-center">
                        <ChatbotAiAvatar className="w-8 h-8 text-white filter drop-shadow-xs transition-transform duration-200 group-hover:scale-110" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-sage border-2 border-primary rounded-full animate-pulse"></span>
                    </div>
                </button>
            )}

            {/* Chat Drawer Widget */}
            <div className={`transition-all duration-300 ease-in-out transform ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8 pointer-events-none absolute bottom-0 right-0'}`}>
                <div className={`bg-surface/95 backdrop-blur-xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden transition-all duration-300 ${
                    isExpanded 
                    ? 'w-[calc(100vw-3rem)] h-[calc(100vh-6rem)] max-w-5xl rounded-3xl' 
                    : 'w-[90vw] sm:w-[420px] h-[580px] rounded-3xl'
                }`}>
                    {/* Header */}
                    <div className="p-4 bg-surface-lighter/80 backdrop-blur-md border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 p-0.5 shadow-xs flex items-center justify-center">
                                <ChatbotAiAvatar className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-text text-sm tracking-wide flex items-center gap-2">
                                    PricePilot AI
                                    <span className="text-[10px] bg-primary/15 text-primary-light border border-primary/25 px-2 py-0.5 rounded-full font-medium">Assistant</span>
                                </h3>
                                <p className="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse"></span> Active • Type @ for products, / for methods
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button 
                                onClick={handleNewChat}
                                className="p-2 text-text-muted hover:text-text hover:bg-surface-lighter rounded-lg transition-colors"
                                title="New Conversation"
                            >
                                <HiOutlinePlus className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => navigate('/dashboard/chat')}
                                className="p-2 text-text-muted hover:text-text hover:bg-surface-lighter rounded-lg transition-colors"
                                title="Open Full Screen AI Workspace"
                            >
                                <HiOutlineChatAlt2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-text-muted hover:text-text hover:bg-surface-lighter rounded-lg transition-colors"
                                title="Close"
                            >
                                <HiOutlineX className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-muted space-y-3">
                                <div className="w-16 h-16 rounded-full bg-surface-lighter flex items-center justify-center border border-border">
                                    <HiOutlineChatAlt2 className="w-8 h-8 text-primary" />
                                </div>
                                <p className="text-sm font-semibold text-text">Start a new conversation</p>
                                <p className="text-xs text-text-muted">Type <code className="text-primary font-mono font-bold">@</code> to tag products or <code className="text-copper font-mono font-bold">/</code> to run methods.</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className="max-w-[85%] flex flex-col">
                                    <div className={`px-4 py-3 shadow-xs relative ${
                                        msg.role === 'user' 
                                        ? 'bg-primary text-white rounded-2xl rounded-tr-xs border border-primary/40 self-end' 
                                        : 'bg-surface-light border border-border text-text rounded-2xl rounded-tl-xs self-start'
                                    }`}>
                                        {msg.role === 'user' ? (
                                            editingIndex === idx ? (
                                                <div className="space-y-2 min-w-[220px]">
                                                    <textarea
                                                        value={editingText}
                                                        onChange={(e) => setEditingText(e.target.value)}
                                                        className="w-full rounded-lg bg-black/30 border border-white/20 p-2 text-xs text-white outline-none focus:border-primary min-h-[50px] custom-scrollbar"
                                                    />
                                                    <div className="flex items-center justify-end gap-1.5 text-[11px]">
                                                        <button
                                                            type="button"
                                                            onClick={handleCancelEdit}
                                                            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveEdit(idx)}
                                                            disabled={!editingText.trim() || isLoading}
                                                            className="px-2 py-1 rounded bg-white text-primary font-bold hover:bg-white/90 disabled:opacity-50 cursor-pointer"
                                                        >
                                                            Save & Submit
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-[13px] whitespace-pre-wrap leading-relaxed font-normal">
                                                    {renderFormattedChatMessage(msg.content, true)}
                                                </p>
                                            )
                                        ) : (
                                            <p className="text-[13px] whitespace-pre-wrap leading-relaxed font-normal">
                                                {renderFormattedChatMessage(msg.content, false, (payload) => {
                                                    if (location.pathname !== '/dashboard') {
                                                        navigate('/dashboard');
                                                    }
                                                    setTimeout(() => {
                                                        const event = new CustomEvent('launch_what_if_simulator', { detail: payload });
                                                        window.dispatchEvent(event);
                                                    }, 200);
                                                })}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Bar (Copy, Edit Pencil for User / Copy, Like, Dislike for Model) */}
                                    {editingIndex !== idx && (
                                        <div className={`mt-1 flex items-center gap-1.5 text-[11px] ${msg.role === 'user' ? 'justify-end text-text-muted' : 'justify-start text-text-muted'}`}>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyText(msg.content, idx)}
                                                className="inline-flex items-center gap-1 px-1 py-0.5 rounded hover:bg-surface-lighter hover:text-text transition-colors"
                                                title="Copy text"
                                            >
                                                {copiedIndex === idx ? (
                                                    <>
                                                        <HiOutlineCheck className="w-3.5 h-3.5 text-sage" />
                                                        <span className="text-[10px] font-semibold text-sage">Copied!</span>
                                                    </>
                                                ) : (
                                                    <HiOutlineDuplicate className="w-3.5 h-3.5" />
                                                )}
                                            </button>

                                            {msg.role === 'user' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEdit(idx, msg.content)}
                                                    className="inline-flex items-center gap-1 px-1 py-0.5 rounded hover:bg-surface-lighter hover:text-primary transition-colors"
                                                    title="Edit prompt"
                                                >
                                                    <HiOutlinePencil className="w-3.5 h-3.5" />
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickLike(idx, msg)}
                                                        className={`p-1 rounded transition-colors ${
                                                            msg.feedback?.rating === 'like'
                                                                ? 'text-sage bg-sage/10'
                                                                : 'hover:text-sage hover:bg-surface-lighter'
                                                        }`}
                                                        title="Like response"
                                                    >
                                                        <HiOutlineThumbUp className="w-3.5 h-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenFeedbackModal(idx)}
                                                        className={`p-1 rounded transition-colors ${
                                                            msg.feedback?.rating === 'dislike'
                                                                ? 'text-danger bg-danger/10'
                                                                : 'hover:text-danger hover:bg-surface-lighter'
                                                        }`}
                                                        title="Dislike / Give feedback"
                                                    >
                                                        <HiOutlineThumbDown className="w-3.5 h-3.5" />
                                                    </button>

                                                    {msg.feedback?.status === 'ignored_offtopic' && (
                                                        <span className="text-[9px] text-brass bg-brass/10 border border-brass/20 px-1.5 py-0.5 rounded-full font-medium ml-1">
                                                            Off-topic
                                                        </span>
                                                    )}
                                                    {msg.feedback?.status === 'accepted' && (
                                                        <span className="text-[9px] text-sage bg-sage/10 border border-sage/20 px-1.5 py-0.5 rounded-full font-medium ml-1">
                                                            Recorded
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <AILoadingState variant="chat" />
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Attachment Indicator */}
                    {attachedFile && (
                        <div className="px-4 pb-2">
                            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary-light text-xs px-3 py-1.5 rounded-full">
                                <HiOutlineDocumentText className="w-4 h-4" />
                                <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                                <button onClick={() => {setAttachedFile(null); setExtractedText(null);}} className="hover:text-text ml-1">
                                    <HiOutlineX className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-3.5 bg-surface/95 backdrop-blur-md border-t border-border relative z-20">
                        {/* Autocomplete Popover */}
                        <ChatAutocompletePopover
                            input={input}
                            setInput={setInput}
                            inputRef={inputRef}
                            isOpen={popoverOpen}
                            setIsOpen={setPopoverOpen}
                            activeTrigger={activeTrigger}
                            setActiveTrigger={setActiveTrigger}
                            query={autocompleteQuery}
                            setQuery={setAutocompleteQuery}
                        />

                        <form onSubmit={handleSend} className="relative flex items-center group">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,.txt,.csv"
                                onChange={handleFileUpload}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute left-3 text-text-muted hover:text-primary transition-colors z-10"
                                title="Attach PDF or Text file"
                            >
                                <HiOutlinePaperClip className="w-5 h-5" />
                            </button>
                            
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={handleInputChange}
                                placeholder={extractedText ? "Ask about attached file..." : "Type @ for products, / for methods..."}
                                className="w-full bg-surface-light border border-border rounded-full pl-10 pr-12 py-3 text-xs text-text focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-text-muted"
                            />
                            
                            <button
                                id="chat-widget-submit-btn"
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1.5 bg-primary hover:bg-primary-dark text-white p-2 rounded-full shadow-[0_2px_10px_rgba(168,90,60,0.35)] disabled:opacity-50 transition-all duration-300"
                            >
                                <svg className="w-3.5 h-3.5 translate-x-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Toast Notifications */}
            {toastMessage && (
                <div className="fixed bottom-24 right-6 z-50 animate-bounce-in">
                    <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border shadow-2xl text-xs font-semibold ${
                        toastMessage.type === 'success'
                            ? 'bg-surface border-sage/40 text-sage'
                            : toastMessage.type === 'info'
                            ? 'bg-surface border-brass/40 text-brass'
                            : 'bg-surface border-danger/40 text-danger'
                    }`}>
                        <span>{toastMessage.text}</span>
                        <button type="button" onClick={() => setToastMessage(null)} className="p-0.5 hover:opacity-80">
                            <HiOutlineX className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {feedbackModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
                    <div className="relative w-full max-w-sm bg-surface border border-border rounded-2xl p-5 shadow-2xl space-y-3.5 text-text">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-danger/10 text-danger flex items-center justify-center">
                                    <HiOutlineThumbDown className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-text text-sm">Provide AI Response Feedback</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFeedbackModalOpen(false)}
                                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-lighter transition-colors"
                            >
                                <HiOutlineX className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitFeedbackModal} className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
                                    What was the issue with this response?
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        'Incorrect Pricing Data',
                                        'Vague Explanation',
                                        'Off-Topic Response',
                                        'Unhelpful Formatting',
                                        'Other'
                                    ].map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setFeedbackCategory(cat)}
                                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                                                feedbackCategory === cat
                                                    ? 'bg-primary/20 border-primary/40 text-primary-light font-semibold'
                                                    : 'bg-surface-lighter border-border text-text-muted hover:text-text'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
                                    Additional details (optional)
                                </label>
                                <textarea
                                    value={feedbackComment}
                                    onChange={(e) => setFeedbackComment(e.target.value)}
                                    placeholder="Tell us how PricePilot AI can improve..."
                                    className="w-full rounded-xl bg-surface-light border border-border p-2.5 text-xs text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[75px] custom-scrollbar"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setFeedbackModalOpen(false)}
                                    className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-text-muted hover:text-text hover:bg-surface-lighter transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={feedbackSubmitting}
                                    className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold transition-all disabled:opacity-50"
                                >
                                    {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
