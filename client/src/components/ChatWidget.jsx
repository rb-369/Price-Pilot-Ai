import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
    getChats, getChat, createChat, deleteChat, sendChatMessage, uploadChatContext 
} from '../api';
import { HiOutlineTrash, HiOutlinePlus, HiOutlineChatAlt2, HiOutlineX, HiOutlinePaperClip, HiOutlineDocumentText } from 'react-icons/hi';

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
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

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
            console.error('File parsing failed', error);
            setAttachedFile({ name: 'Error uploading file' });
            setExtractedText(null);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        let chatId = activeChatId;

        if (!chatId) {
            try {
                const { data } = await createChat({ title: input.substring(0, 30), messages: [] });
                chatId = data._id;
                setChats([data, ...chats]);
                setActiveChatId(chatId);
                setAttachedFile(null);
                setExtractedText(null);
            } catch (error) {
                console.error("Failed to create chat", error);
                return;
            }
        }

        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        // If this is the first real user message, we might want to update the sidebar title
        if (messages.length <= 1) {
            // Optimistic update of title
            setChats(chats.map(c => c._id === chatId ? { ...c, title: input.substring(0, 30) } : c));
        }

        try {
            const payload = { message: input };
            if (extractedText) {
                payload.contextText = extractedText;
                setAttachedFile(null);
                setExtractedText(null);
            }

            const { data } = await sendChatMessage(chatId, payload);
            setMessages(data.chat.messages);
            loadChats(); // Refresh sidebar titles
        } catch {
            setMessages([...newMessages, { role: 'model', content: "⚠️ Sorry, I encountered an error. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (location.pathname === '/dashboard/chat') return null;

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_rgba(168,85,247,0.7)] hover:scale-110 transition-all duration-300 z-50 group border border-white/10"
            >
                <HiOutlineChatAlt2 className="w-7 h-7 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300" />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-0 right-0 md:bottom-6 md:right-6 bg-slate-900/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] rounded-t-2xl md:rounded-2xl flex transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-50 overflow-hidden
            ${isExpanded ? 'w-full h-full md:w-[90vw] md:h-[90vh] md:max-w-[1200px]' : 'w-full h-[600px] md:w-[380px] md:h-[600px]'}`}>
            
            {/* Sidebar (Only visible when expanded) */}
            <div className={`flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${isExpanded ? 'w-64 opacity-100' : 'w-0 opacity-0 hidden'}`}>
                <div className="p-4">
                    <button 
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white py-2.5 rounded-xl transition-colors font-medium text-sm"
                    >
                        <HiOutlinePlus className="w-5 h-5" /> New Chat
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
                    {chats.map(chat => (
                        <div 
                            key={chat._id} 
                            onClick={() => loadSingleChat(chat._id)}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-colors ${activeChatId === chat._id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}
                        >
                            <span className="text-sm truncate pr-2">{chat.title}</span>
                            <button 
                                onClick={(e) => handleDeleteChat(e, chat._id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                            >
                                <HiOutlineTrash className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col h-full relative">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-slate-900/40 relative overflow-hidden">
                    {/* Header subtle glow */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80"></div>
                    <div className="flex items-center space-x-3 relative z-10">
                        <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1px]">
                                <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center">
                                    <HiOutlineChatAlt2 className="w-5 h-5 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400" />
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-100 text-sm tracking-wide">PricePilot AI</h3>
                            <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span> Online
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-400">
                        <button onClick={() => { setIsOpen(false); navigate('/dashboard/chat'); }} className="p-2 hover:bg-slate-800 rounded-lg hover:text-white transition-colors" title="Open in full page">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                        </button>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg hover:text-red-400 transition-colors">
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-slate-900/20">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-70 space-y-4">
                            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center border border-white/5">
                                <HiOutlineChatAlt2 className="w-10 h-10 text-indigo-400" />
                            </div>
                            <p className="text-sm tracking-wide">Start a new conversation</p>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[85%] px-5 py-3.5 shadow-lg relative ${
                                msg.role === 'user' 
                                ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl rounded-tr-sm border border-white/10' 
                                : 'bg-slate-800/80 backdrop-blur-md border border-white/5 text-slate-200 rounded-2xl rounded-tl-sm'
                            }`}>
                                <p className="text-[14px] whitespace-pre-wrap leading-relaxed font-normal">{msg.content}</p>
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
                    <div className="px-5 pb-2">
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
                <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-white/5 relative z-20">
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
                            className="absolute left-4 text-slate-400 hover:text-indigo-400 transition-colors z-10"
                            title="Attach PDF or Text file"
                        >
                            <HiOutlinePaperClip className="w-5 h-5" />
                        </button>
                        
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={extractedText ? "Ask about your attached file..." : "Message PricePilot AI..."}
                            className="w-full bg-slate-800/80 border border-white/10 rounded-full pl-12 pr-14 py-3.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:bg-slate-800 shadow-inner transition-all placeholder-slate-500"
                        />
                        
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-2.5 rounded-full hover:from-indigo-400 hover:to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] disabled:opacity-50 disabled:hover:shadow-none transition-all duration-300 transform active:scale-95"
                        >
                            <svg className="w-4 h-4 translate-x-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-slate-500 mt-3 font-medium tracking-wide">AI can make mistakes. Consider verifying important information.</p>
                </div>
            </div>
        </div>
    );
};

export default ChatWidget;
