import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    getChats, getChat, createChat, deleteChat, sendChatMessage, uploadChatContext 
} from '../api';
import { HiOutlineTrash, HiOutlinePlus, HiOutlineChatAlt2, HiOutlineX, HiOutlinePaperClip, HiOutlineDocumentText } from 'react-icons/hi';
import ChatAutocompletePopover, { renderFormattedChatMessage } from './ChatAutocompletePopover';

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
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isExpanded]);

    // Load chat history on mount
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
                    className="relative group bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-4 rounded-full shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-3 border border-white/20"
                >
                    <div className="relative">
                        <img src="/chabot-assistant-without-bg.png" alt="AI Assistant" className="w-8 h-8 object-contain filter drop-shadow-md" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse"></span>
                    </div>
                    <span className="font-semibold text-sm pr-1 tracking-wide hidden sm:inline">Ask PricePilot AI</span>
                </button>
            )}

            {/* Chat Drawer Widget */}
            <div className={`transition-all duration-300 ease-in-out transform ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8 pointer-events-none absolute bottom-0 right-0'}`}>
                <div className={`bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transition-all duration-300 ${
                    isExpanded 
                    ? 'w-[calc(100vw-3rem)] h-[calc(100vh-6rem)] max-w-5xl rounded-3xl' 
                    : 'w-[90vw] sm:w-[420px] h-[580px] rounded-3xl'
                }`}>
                    {/* Header */}
                    <div className="p-4 bg-slate-800/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-md">
                                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden">
                                    <img src="/chabot-assistant-without-bg.png" alt="AI" className="w-7 h-7 object-contain" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm tracking-wide flex items-center gap-2">
                                    PricePilot AI
                                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium">Assistant</span>
                                </h3>
                                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active • Type @ for products, / for methods
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button 
                                onClick={handleNewChat}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                                title="New Conversation"
                            >
                                <HiOutlinePlus className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => navigate('/dashboard/chat')}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                                title="Open Full Screen AI Workspace"
                            >
                                <HiOutlineChatAlt2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                                title="Close"
                            >
                                <HiOutlineX className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center border border-white/5">
                                    <HiOutlineChatAlt2 className="w-8 h-8 text-indigo-400" />
                                </div>
                                <p className="text-sm font-semibold text-slate-200">Start a new conversation</p>
                                <p className="text-xs text-slate-400">Type <code className="text-indigo-400">@</code> to tag products or <code className="text-purple-400">/</code> to run methods.</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                <div className={`max-w-[85%] px-4 py-3 shadow-lg relative ${
                                    msg.role === 'user' 
                                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl rounded-tr-sm border border-white/10' 
                                    : 'bg-slate-800/80 backdrop-blur-md border border-white/5 text-slate-200 rounded-2xl rounded-tl-sm'
                                }`}>
                                    <p className="text-[13px] whitespace-pre-wrap leading-relaxed font-normal">
                                        {renderFormattedChatMessage(msg.content, msg.role === 'user')}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start animate-in fade-in duration-300">
                                <div className="bg-slate-800/80 backdrop-blur-md border border-white/5 rounded-2xl rounded-tl-sm px-5 py-4 flex space-x-2">
                                    <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(129,140,248,0.6)]"></div>
                                    <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(129,140,248,0.6)]" style={{ animationDelay: '0.15s' }}></div>
                                    <div className="w-2 h-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full animate-bounce shadow-[0_0_8px_rgba(129,140,248,0.6)]" style={{ animationDelay: '0.3s' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Attachment Indicator */}
                    {attachedFile && (
                        <div className="px-4 pb-2">
                            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-3 py-1.5 rounded-full">
                                <HiOutlineDocumentText className="w-4 h-4" />
                                <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                                <button onClick={() => {setAttachedFile(null); setExtractedText(null);}} className="hover:text-white ml-1">
                                    <HiOutlineX className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-3.5 bg-slate-900/80 backdrop-blur-md border-t border-white/5 relative z-20">
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
                                className="absolute left-3 text-slate-400 hover:text-indigo-400 transition-colors z-10"
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
                                className="w-full bg-slate-800/80 border border-white/10 rounded-full pl-10 pr-12 py-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:bg-slate-800 transition-all placeholder-slate-500"
                            />
                            
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-2 rounded-full hover:from-indigo-400 hover:to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 transition-all duration-300"
                            >
                                <svg className="w-3.5 h-3.5 translate-x-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatWidget;
