import { useState, useRef, useEffect } from 'react';
import { 
    getChats, getChat, createChat, deleteChat, sendChatMessage, uploadChatContext 
} from '../api';
import { HiOutlineTrash, HiOutlinePlus, HiOutlineChatAlt2, HiOutlineX, HiOutlinePaperClip, HiOutlineDocumentText } from 'react-icons/hi';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    
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

        if (!activeChatId) {
            await handleNewChat();
        }

        const userMsg = { role: 'user', content: input };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        // If this is the first real user message, we might want to update the sidebar title
        if (messages.length <= 1) {
            // Optimistic update of title
            setChats(chats.map(c => c._id === activeChatId ? { ...c, title: input.substring(0, 30) } : c));
        }

        try {
            const payload = { message: input };
            if (extractedText) {
                payload.contextText = extractedText;
                setAttachedFile(null);
                setExtractedText(null);
            }

            const { data } = await sendChatMessage(activeChatId, payload);
            setMessages(data.chat.messages);
            loadChats(); // Refresh sidebar titles
        } catch (error) {
            setMessages([...newMessages, { role: 'model', content: "⚠️ Sorry, I encountered an error. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:bg-indigo-500 hover:scale-110 transition-all z-50 group"
            >
                <HiOutlineChatAlt2 className="w-7 h-7 group-hover:scale-110 transition-transform" />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-0 right-0 md:bottom-6 md:right-6 bg-[rgba(15,23,42,0.95)] backdrop-blur-xl border border-slate-700 shadow-2xl rounded-t-2xl md:rounded-2xl flex transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-50 overflow-hidden
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
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 bg-slate-900/50">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                                <HiOutlineChatAlt2 className="w-5 h-5 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-100 text-sm">PricePilot AI</h3>
                            <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold">Online</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1 text-slate-400">
                        <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 hover:bg-slate-800 rounded-lg hover:text-white transition-colors">
                            {isExpanded ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                            )}
                        </button>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg hover:text-red-400 transition-colors">
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-slate-900/20">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50 space-y-4">
                            <HiOutlineChatAlt2 className="w-16 h-16" />
                            <p className="text-sm">Start a new conversation</p>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'}`}>
                                <p className="text-[14px] whitespace-pre-wrap leading-relaxed font-normal">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm px-5 py-4 flex space-x-2">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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
                <div className="p-4 bg-slate-900 border-t border-slate-800">
                    <form onSubmit={handleSend} className="relative flex items-center">
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
                            className="absolute left-3 text-slate-400 hover:text-indigo-400 transition-colors"
                            title="Attach PDF or Text file"
                        >
                            <HiOutlinePaperClip className="w-5 h-5" />
                        </button>
                        
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={extractedText ? "Ask about your attached file..." : "Message PricePilot AI..."}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-full pl-11 pr-14 py-3 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-slate-800 shadow-inner transition-all placeholder-slate-500"
                        />
                        
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] disabled:opacity-50 disabled:hover:shadow-none transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        </button>
                    </form>
                    <p className="text-center text-[10px] text-slate-500 mt-2">AI can make mistakes. Consider verifying important information.</p>
                </div>
            </div>
        </div>
    );
};

export default ChatWidget;
