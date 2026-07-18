import { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
    getChats, getChat, createChat, deleteChat, sendChatMessage, uploadChatContext 
} from '../api';
import { 
    HiOutlineTrash, HiOutlinePlus, HiOutlineChatAlt2, HiOutlineX, 
    HiOutlinePaperClip, HiOutlineDocumentText,
    HiOutlineTrendingUp, HiOutlineChartBar, HiOutlineLightningBolt, HiOutlineBell
} from 'react-icons/hi';
import logoUrl from '../assets/FINAL.svg';

const Chat = () => {
    const { sidebarOpen } = useOutletContext() || {};
    
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Terminal-style input history state
    const [inputHistory, setInputHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentDraft, setCurrentDraft] = useState('');

    const [attachedFile, setAttachedFile] = useState(null);
    const [extractedText, setExtractedText] = useState(null);
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    // Load chat history on mount
    useEffect(() => {
        loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            setAttachedFile(null);
            setExtractedText(null);
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
            setHistoryIndex(-1);
            setCurrentDraft('');
        } catch (error) {
            console.error("Failed to create chat", error);
        }
    };

    const handleDeleteChat = async (e, id) => {
        e.stopPropagation();
        try {
            await deleteChat(id);
            const filteredChats = chats.filter(c => c._id !== id);
            setChats(filteredChats);
            if (activeChatId === id) {
                setActiveChatId(null);
                setMessages([]);
                if (filteredChats.length > 0) {
                    loadSingleChat(filteredChats[0]._id);
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

    const handleSend = async (e, customInput = null) => {
        if (e) e.preventDefault();
        const textToSend = customInput !== null ? customInput : input;
        if (!textToSend.trim() || isLoading) return;

        setIsLoading(true);
        let chatId = activeChatId;

        // If there's no active chat, let's create one first
        if (!chatId) {
            try {
                const { data } = await createChat({ title: textToSend.substring(0, 30), messages: [] });
                chatId = data._id;
                setActiveChatId(chatId);
                setChats(prev => [data, ...prev]);
            } catch (error) {
                console.error("Failed to create chat on-the-fly", error);
                setIsLoading(false);
                return;
            }
        }

        // Filter default bot greeting out of active history so we show a clean message flow
        const userMsg = { role: 'user', content: textToSend };
        const newMessages = [...messages.filter(m => m.role !== 'model' || m.content !== "Hi! I'm PricePilot AI. How can I help you optimize your pricing and inventory today?"), userMsg];
        setMessages(newMessages);
        
        // Add user prompt to history (terminal style)
        const trimmedText = textToSend.trim();
        setInputHistory(prev => {
            const last = prev[prev.length - 1];
            if (last === trimmedText) return prev;
            return [...prev, trimmedText];
        });
        setHistoryIndex(-1);
        setCurrentDraft('');

        if (customInput === null) {
            setInput('');
        }

        try {
            const payload = { message: textToSend };
            if (extractedText) {
                payload.contextText = extractedText;
                setAttachedFile(null);
                setExtractedText(null);
            }

            const { data } = await sendChatMessage(chatId, payload);
            setMessages(data.chat.messages);
            
            // Refresh chats list to update titles
            const { data: updatedChats } = await getChats();
            setChats(updatedChats);
        } catch (error) {
            console.error("Failed to send message", error);
            setMessages([...newMessages, { role: 'model', content: "⚠️ Sorry, I encountered an error. Please try again later." }]);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    // Terminal history navigation handler
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (inputHistory.length === 0) return;
            
            let newIndex;
            if (historyIndex === -1) {
                setCurrentDraft(input);
                newIndex = inputHistory.length - 1;
            } else {
                newIndex = Math.max(0, historyIndex - 1);
            }
            setHistoryIndex(newIndex);
            setInput(inputHistory[newIndex]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex === -1) return;
            
            if (historyIndex === inputHistory.length - 1) {
                setHistoryIndex(-1);
                setInput(currentDraft);
            } else {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setInput(inputHistory[newIndex]);
            }
        }
    };

    // Helper to format model responses nicely with custom inline styling
    const formatMessageContent = (content) => {
        if (!content) return null;
        
        const lines = content.split('\n');
        let currentList = [];
        const rendered = [];

        const flushList = (key) => {
            if (currentList.length > 0) {
                rendered.push(
                    <ul key={`list-${key}`} className="list-disc pl-5 my-2 space-y-1 text-text">
                        {currentList}
                    </ul>
                );
                currentList = [];
            }
        };

        lines.forEach((line, idx) => {
            const trimmed = line.trim();
            
            // Lists
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                const contentText = trimmed.substring(2);
                currentList.push(
                    <li key={`li-${idx}`} className="text-sm leading-relaxed">
                        {parseInlineMarkdown(contentText)}
                    </li>
                );
            } else {
                flushList(idx);
                
                // Headings
                if (line.startsWith('### ')) {
                    rendered.push(
                        <h4 key={idx} className="text-sm font-semibold text-text mt-4 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full inline-block"></span>
                            {parseInlineMarkdown(line.substring(4))}
                        </h4>
                    );
                } else if (line.startsWith('## ')) {
                    rendered.push(
                        <h3 key={idx} className="text-base font-bold text-indigo-200 mt-5 mb-2 border-b border-border pb-1">
                            {parseInlineMarkdown(line.substring(3))}
                        </h3>
                    );
                } else if (line.startsWith('# ')) {
                    rendered.push(
                        <h2 key={idx} className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 mt-5 mb-2.5">
                            {parseInlineMarkdown(line.substring(2))}
                        </h2>
                    );
                } else if (trimmed) {
                    rendered.push(
                        <p key={idx} className="text-sm text-text leading-relaxed my-2">
                            {parseInlineMarkdown(line)}
                        </p>
                    );
                } else {
                    rendered.push(<div key={idx} className="h-2"></div>);
                }
            }
        });

        flushList('end');
        return rendered;
    };

    const parseInlineMarkdown = (text) => {
        const parts = [];
        let currentText = text;
        const regex = /(\*\*.*?\*\*|`.*?`)/;
        let index = 0;

        while (currentText) {
            const match = currentText.match(regex);
            if (!match) {
                parts.push(<span key={index}>{currentText}</span>);
                break;
            }

            const matchIndex = match.index;
            if (matchIndex > 0) {
                parts.push(<span key={index}>{currentText.substring(0, matchIndex)}</span>);
                index++;
            }

            const matchedStr = match[0];
            if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
                parts.push(
                    <strong key={index} className="font-semibold text-white drop-shadow-[0_0_1px_rgba(255,255,255,0.25)]">
                        {matchedStr.substring(2, matchedStr.length - 2)}
                    </strong>
                );
            } else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
                parts.push(
                    <code key={index} className="bg-surface-lighter border border-border text-accent font-mono text-[11px] px-1.5 py-0.5 rounded mx-0.5 font-medium">
                        {matchedStr.substring(1, matchedStr.length - 1)}
                    </code>
                );
            }
            index++;
            currentText = currentText.substring(matchIndex + matchedStr.length);
        }

        return parts;
    };

    const suggestions = [
        {
            title: "Optimize Stock",
            desc: "Which products should I discount this week?",
            prompt: "Can u suggest which products can i put on discount this week?",
            icon: <HiOutlineLightningBolt className="w-5 h-5" />
        },
        {
            title: "Analyze Competitors",
            desc: "Compare our prices against market leaders",
            prompt: "Analyze our competitor pricing trends and show me where we are priced too high or too low.",
            icon: <HiOutlineChartBar className="w-5 h-5" />
        },
        {
            title: "Forecast Demand",
            desc: "What are the demand signals for next month?",
            prompt: "Show me the key demand signals and sales forecasts for the upcoming month.",
            icon: <HiOutlineTrendingUp className="w-5 h-5" />
        },
        {
            title: "Alert Strategy",
            desc: "Configure pricing anomaly alerts",
            prompt: "How should I configure alerts for sudden competitor price drops or high inventory levels?",
            icon: <HiOutlineBell className="w-5 h-5" />
        }
    ];

    return (
        <div className="flex-1 w-full h-full bg-surface flex overflow-hidden relative font-sans">
            
            {/* Chat Sidebar */}
            <div className="flex flex-col bg-surface-light border-r border-border w-64 md:w-80 h-full relative z-10 shrink-0">
                {/* Sidebar Header - Dynamic Left Padding to Clear Dashboard Menu Toggle Button */}
                <div className={`p-4 flex items-center justify-between border-b border-border ${!sidebarOpen ? 'pl-[72px]' : ''} h-[68px] transition-all duration-300`}>
                    <button 
                        onClick={handleNewChat}
                        className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary-light border border-primary/20 hover:bg-primary hover:text-white py-2.5 rounded-xl transition-all font-medium text-xs shadow-[0_0_15px_rgba(99,102,241,0.05)] hover:shadow-[0_0_20px_rgba(99,102,241,0.25)]"
                    >
                        <HiOutlinePlus className="w-4 h-4" /> New Chat
                    </button>
                </div>
                
                {/* Chat Sessions list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                    {chats.map(chat => (
                        <div 
                            key={chat._id} 
                            onClick={() => loadSingleChat(chat._id)}
                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all duration-200 border ${
                                activeChatId === chat._id 
                                ? 'bg-primary/10 border-primary/15 text-white font-medium shadow-[0_4px_12px_rgba(99,102,241,0.08)]' 
                                : 'border-transparent text-text-muted hover:bg-surface-lighter hover:text-text'
                            }`}
                        >
                            <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                                <HiOutlineChatAlt2 className={`w-4.5 h-4.5 shrink-0 ${activeChatId === chat._id ? 'text-primary-light animate-pulse' : 'text-text-muted'}`} />
                                <span className="text-xs truncate">{chat.title}</span>
                            </div>
                            <button 
                                onClick={(e) => handleDeleteChat(e, chat._id)}
                                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger/90 hover:scale-105 transition-all p-1 rounded-md hover:bg-surface-lighter"
                                title="Delete Chat"
                            >
                                <HiOutlineTrash className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Workspace */}
            <div className="flex-1 flex flex-col h-[100dvh] bg-surface relative overflow-hidden">
                {/* Decorative Glowing Mesh Orbs */}
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none"></div>

                {/* Workspace Header */}
                <div className="flex items-center justify-between px-6 h-[68px] border-b border-border bg-surface/30 backdrop-blur-md relative z-10">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-surface-lighter border border-border flex items-center justify-center p-0.5 shadow-sm overflow-hidden">
                                <img src="/chabot-assistant-without-bg.png" alt="PricePilot Logo" className="w-full h-full object-cover scale-110" />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-surface rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-text text-xs tracking-wider uppercase">PricePilot AI</h3>
                            <p className="text-[9px] text-success tracking-widest font-semibold flex items-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-ping"></span> Online
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar bg-transparent relative z-10">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-start mt-8 md:mt-16 max-w-3xl mx-auto px-4 text-center animate-fade-in pb-8">
                            {/* Glowing Brand Icon */}
                            {/* Floating Assistant Character */}
                            <div className="relative mb-8 mt-4">
                                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse-glow"></div>
                                <img 
                                    src="/chabot-assistant-without-bg.png" 
                                    alt="PricePilot AI Assistant" 
                                    className="w-32 h-32 md:w-40 md:h-40 object-contain relative z-10 animate-float drop-shadow-2xl"
                                />
                            </div>
                            
                            {/* Welcoming Text */}
                            <h2 className="text-2xl md:text-3xl font-extrabold page-header tracking-tight">
                                Meet PricePilot AI
                            </h2>
                            <p className="text-text-muted text-sm md:text-base mt-2 max-w-lg leading-relaxed">
                                Your real-time intelligence assistant for pricing optimization, competitor tracking, and smart inventory decisions.
                            </p>
                            
                            {/* Suggestion prompt cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 w-full">
                                {suggestions.map((sug, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleSend(null, sug.prompt)}
                                        className="glass-card p-5 rounded-2xl border border-border bg-surface-lighter/50 hover:bg-surface-lighter cursor-pointer flex flex-col items-start text-left group transition-all duration-300 hover:border-primary/40 hover:shadow-[0_8px_24px_rgba(99,102,241,0.12)] hover:-translate-y-1 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/15 transition-all duration-500 pointer-events-none"></div>
                                        <div className="w-10 h-10 rounded-xl bg-surface-light/50 border border-border flex items-center justify-center text-primary-light mb-3 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                                            {sug.icon}
                                        </div>
                                        <h4 className="text-sm font-semibold text-text group-hover:text-white transition-colors duration-200">
                                            {sug.title}
                                        </h4>
                                        <p className="text-xs text-text-muted mt-2 leading-relaxed group-hover:text-text transition-colors duration-200">
                                            {sug.desc}
                                        </p>
                                        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-primary-light group-hover:text-primary-light font-medium uppercase tracking-wider">
                                            <span>Try prompt</span>
                                            <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform duration-200">→</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
                            {msg.role !== 'user' && (
                                <div className="w-8 h-8 rounded-full bg-surface-lighter border border-border mr-3 mt-1 shrink-0 shadow-sm transform transition-transform group-hover:scale-105 overflow-hidden flex items-center justify-center">
                                    <img src="/chabot-assistant-without-bg.png" alt="AI" className="w-full h-full object-cover scale-110" />
                                </div>
                            )}
                            <div className={`max-w-[85%] px-5 py-4 rounded-2xl shadow-lg border relative ${
                                msg.role === 'user' 
                                ? 'bg-gradient-to-br from-primary to-primary-dark border-primary/20 text-white rounded-tr-sm shadow-[0_4px_20px_rgba(99,102,241,0.2)]' 
                                : 'bg-surface-light/55 backdrop-blur-md border-border text-text rounded-tl-sm'
                            }`}>
                                {msg.role === 'user' ? (
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                ) : (
                                    <div className="space-y-0.5">
                                        {formatMessageContent(msg.content)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="flex justify-start animate-in fade-in duration-300">
                            <div className="bg-surface-light/55 backdrop-blur-md border border-border rounded-2xl rounded-tl-sm px-5 py-4 flex space-x-2.5">
                                <div className="w-2 h-2 bg-primary-light rounded-full animate-bounce shadow-[0_0_8px_rgba(129,140,248,0.5)]"></div>
                                <div className="w-2 h-2 bg-primary-light rounded-full animate-bounce shadow-[0_0_8px_rgba(129,140,248,0.5)]" style={{ animationDelay: '0.15s' }}></div>
                                <div className="w-2 h-2 bg-primary-light rounded-full animate-bounce shadow-[0_0_8px_rgba(129,140,248,0.5)]" style={{ animationDelay: '0.3s' }}></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Attached File Toast indicator */}
                {attachedFile && (
                    <div className="px-6 pb-2 relative z-10">
                        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary-light text-xs px-3.5 py-2 rounded-xl">
                            <HiOutlineDocumentText className="w-4 h-4 text-primary-light" />
                            <span className="truncate max-w-[200px] font-medium">{attachedFile.name}</span>
                            <button onClick={() => {setAttachedFile(null); setExtractedText(null);}} className="hover:text-white ml-1 text-text-muted transition-colors">
                                <HiOutlineX className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Chat Action Input bar */}
                <div className="w-full px-4 pb-1 pt-3 relative z-20 bg-gradient-to-t from-surface via-surface/95 to-transparent">
                    <div className="max-w-4xl mx-auto">
                        <form onSubmit={(e) => handleSend(e)} className="relative flex items-center group shadow-xl rounded-2xl bg-surface-lighter border border-border transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.15)]">
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
                                className="absolute left-3 text-text-muted hover:text-primary-light transition-colors z-10 p-2 rounded-xl hover:bg-surface"
                                title="Attach PDF or Text file"
                            >
                                <HiOutlinePaperClip className="w-5 h-5" />
                            </button>
                            
                            <input
                                type="text"
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={extractedText ? "Ask about your attached file..." : "Message PricePilot AI..."}
                                className="w-full bg-transparent pl-14 pr-16 py-4 text-[15px] text-text focus:outline-none placeholder-text-muted"
                            />
                            
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 bg-gradient-to-r from-primary to-primary-dark text-white p-2.5 rounded-xl hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] disabled:opacity-40 disabled:hover:shadow-none transition-all duration-300 transform active:scale-95 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4 translate-x-[0.5px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                            </button>
                        </form>
                        <p className="text-center text-[10px] text-text-muted mt-1 mb-1 font-medium tracking-wide opacity-70">AI can make mistakes. Consider verifying important information.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
