import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    createChat, deleteChat, getChat, getChats, sendChatMessage, uploadChatContext,
} from '../api';
import {
    HiOutlineArrowRight,
    HiOutlineBell,
    HiOutlineChartBar,
    HiOutlineChatAlt2,
    HiOutlineDocumentText,
    HiOutlineLightningBolt,
    HiOutlinePaperAirplane,
    HiOutlinePaperClip,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineTrendingUp,
    HiOutlineX,
    HiOutlineTag,
    HiOutlineCube,
} from 'react-icons/hi';
import ChatAutocompletePopover, { renderFormattedChatMessage, SLASH_COMMANDS } from '../components/ChatAutocompletePopover';

const GREETING = "Hi! I'm PricePilot AI. How can I help you optimize your pricing and inventory today?";

const suggestions = [
    {
        title: 'Optimize stock',
        description: 'Find products that are ready for a discount this week.',
        prompt: 'Can you suggest which products I can put on discount this week?',
        icon: HiOutlineLightningBolt,
    },
    {
        title: 'Analyze competitors',
        description: 'Compare our price positioning against market leaders.',
        prompt: 'Analyze our competitor pricing trends and show me where we are priced too high or too low.',
        icon: HiOutlineChartBar,
    },
    {
        title: 'Forecast demand',
        description: 'Surface the strongest signals for the upcoming month.',
        prompt: 'Show me the key demand signals and sales forecasts for the upcoming month.',
        icon: HiOutlineTrendingUp,
    },
    {
        title: 'Plan alerts',
        description: 'Set a sensible strategy for pricing and inventory alerts.',
        prompt: 'How should I configure alerts for sudden competitor price drops or high inventory levels?',
        icon: HiOutlineBell,
    },
];

const Chat = () => {
    const { sidebarOpen } = useOutletContext() || {};
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [inputHistory, setInputHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentDraft, setCurrentDraft] = useState('');
    const [attachedFile, setAttachedFile] = useState(null);
    const [extractedText, setExtractedText] = useState(null);
    const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

    // Autocomplete states for @ product tag and / slash commands
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [activeTrigger, setActiveTrigger] = useState(null);
    const [autocompleteQuery, setAutocompleteQuery] = useState('');

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

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
            console.error('Failed to load chats', error);
        }
    };

    const loadSingleChat = async (id) => {
        try {
            const { data } = await getChat(id);
            setActiveChatId(id);
            setMessages(data.messages || []);
            setAttachedFile(null);
            setExtractedText(null);
            setMobileHistoryOpen(false);
        } catch (error) {
            console.error('Failed to load chat', error);
        }
    };

    const handleNewChat = async () => {
        try {
            const { data } = await createChat({ title: 'New Chat', messages: [] });
            setChats((previous) => [data, ...previous]);
            setActiveChatId(data._id);
            setMessages([]);
            setAttachedFile(null);
            setExtractedText(null);
            setHistoryIndex(-1);
            setCurrentDraft('');
            setMobileHistoryOpen(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        } catch (error) {
            console.error('Failed to create chat', error);
        }
    };

    const handleDeleteChat = async (event, id) => {
        event.stopPropagation();
        try {
            await deleteChat(id);
            const filteredChats = chats.filter((chat) => chat._id !== id);
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
            console.error('Failed to delete chat', error);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setAttachedFile(file);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await uploadChatContext(formData);
            setExtractedText(data.text);
        } catch (error) {
            console.error('File parsing failed', error);
            setAttachedFile({ name: 'Unable to read this file' });
            setExtractedText(null);
        }
    };

    const handleInputChange = (event) => {
        const val = event.target.value;
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

    const handleSend = async (event, customInput = null) => {
        if (event) event.preventDefault();
        const textToSend = customInput !== null ? customInput : input;
        if (!textToSend.trim() || isLoading) return;

        setIsLoading(true);
        setPopoverOpen(false);
        let chatId = activeChatId;

        if (!chatId) {
            try {
                const { data } = await createChat({ title: textToSend.substring(0, 30), messages: [] });
                chatId = data._id;
                setActiveChatId(chatId);
                setChats((previous) => [data, ...previous]);
            } catch (error) {
                console.error('Failed to create chat on-the-fly', error);
                setIsLoading(false);
                return;
            }
        }

        const userMessage = { role: 'user', content: textToSend };
        const newMessages = [
            ...messages.filter((message) => message.role !== 'model' || message.content !== GREETING),
            userMessage,
        ];
        setMessages(newMessages);

        const trimmedText = textToSend.trim();
        setInputHistory((previous) => previous[previous.length - 1] === trimmedText ? previous : [...previous, trimmedText]);
        setHistoryIndex(-1);
        setCurrentDraft('');
        if (customInput === null) setInput('');

        try {
            const payload = { message: textToSend };
            if (extractedText) {
                payload.contextText = extractedText;
                setAttachedFile(null);
                setExtractedText(null);
            }

            const { data } = await sendChatMessage(chatId, payload);
            setMessages(data.chat.messages);
            const { data: updatedChats } = await getChats();
            setChats(updatedChats);
        } catch (error) {
            console.error('Failed to send message', error);
            setMessages([...newMessages, { role: 'model', content: 'Sorry, I encountered an error. Please try again later.' }]);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const handleKeyDown = (event) => {
        if (popoverOpen && event.key === 'Escape') {
            event.preventDefault();
            setPopoverOpen(false);
            return;
        }

        if (event.key === 'ArrowUp') {
            if (popoverOpen) return; // Let popover handle it
            event.preventDefault();
            if (inputHistory.length === 0) return;
            const nextIndex = historyIndex === -1 ? inputHistory.length - 1 : Math.max(0, historyIndex - 1);
            if (historyIndex === -1) setCurrentDraft(input);
            setHistoryIndex(nextIndex);
            setInput(inputHistory[nextIndex]);
        } else if (event.key === 'ArrowDown') {
            if (popoverOpen) return;
            event.preventDefault();
            if (historyIndex === -1) return;
            if (historyIndex === inputHistory.length - 1) {
                setHistoryIndex(-1);
                setInput(currentDraft);
            } else {
                const nextIndex = historyIndex + 1;
                setHistoryIndex(nextIndex);
                setInput(inputHistory[nextIndex]);
            }
        }
    };

    const parseInlineMarkdown = (text) => {
        const parts = [];
        let remaining = text;
        let index = 0;
        const regex = /(\*\*.*?\*\*|`.*?`)/;

        while (remaining) {
            const match = remaining.match(regex);
            if (!match) {
                parts.push(<span key={index}>{renderFormattedChatMessage(remaining)}</span>);
                break;
            }
            if (match.index > 0) {
                parts.push(<span key={index}>{renderFormattedChatMessage(remaining.substring(0, match.index))}</span>);
                index += 1;
            }
            const matchedText = match[0];
            if (matchedText.startsWith('**')) {
                parts.push(<strong key={index} className="font-semibold text-text">{matchedText.slice(2, -2)}</strong>);
            } else {
                parts.push(<code key={index} className="mx-0.5 rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-accent">{matchedText.slice(1, -1)}</code>);
            }
            index += 1;
            remaining = remaining.substring(match.index + matchedText.length);
        }
        return parts;
    };

    const formatMessageContent = (content) => {
        if (!content) return null;
        const rendered = [];
        let listItems = [];
        const flushList = (key) => {
            if (listItems.length) {
                rendered.push(<ul key={`list-${key}`} className="my-2 list-disc space-y-1 pl-5 text-sm leading-6 marker:text-primary-light">{listItems}</ul>);
                listItems = [];
            }
        };

        content.split('\n').forEach((line, index) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                listItems.push(<li key={`item-${index}`}>{parseInlineMarkdown(trimmed.slice(2))}</li>);
                return;
            }
            flushList(index);
            if (line.startsWith('### ')) {
                rendered.push(<h4 key={index} className="mt-4 mb-1.5 text-sm font-semibold text-text">{parseInlineMarkdown(line.slice(4))}</h4>);
            } else if (line.startsWith('## ')) {
                rendered.push(<h3 key={index} className="mt-5 mb-2 border-b border-border pb-2 text-base font-semibold text-text">{parseInlineMarkdown(line.slice(3))}</h3>);
            } else if (line.startsWith('# ')) {
                rendered.push(<h2 key={index} className="mt-5 mb-2 text-lg font-bold text-text">{parseInlineMarkdown(line.slice(2))}</h2>);
            } else if (trimmed) {
                rendered.push(<p key={index} className="my-2 text-sm leading-6 text-text">{parseInlineMarkdown(line)}</p>);
            }
        });
        flushList('end');
        return rendered;
    };

    const chatHistory = (
        <aside className="flex h-full w-[272px] shrink-0 flex-col border-r border-border bg-surface-light">
            <div className={`flex h-16 shrink-0 items-center border-b border-border px-3 ${!sidebarOpen ? 'pl-[68px] md:pl-3' : ''}`}>
                <button type="button" onClick={handleNewChat} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary-light transition-colors hover:bg-primary hover:text-white">
                    <HiOutlinePlus className="h-4 w-4" />
                    New Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Chat History</p>
                <div className="space-y-1">
                    {chats.map((chat) => {
                        const isActive = chat._id === activeChatId;
                        return (
                            <div key={chat._id} onClick={() => loadSingleChat(chat._id)} className={`group relative flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${isActive ? 'bg-surface border border-border text-text font-medium' : 'text-text-muted hover:bg-surface-lighter hover:text-text'}`}>
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <HiOutlineChatAlt2 className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary-light' : 'text-text-muted'}`} />
                                    <span className="truncate text-xs">{chat.title || 'Untitled Chat'}</span>
                                </div>
                                <button type="button" onClick={(event) => handleDeleteChat(event, chat._id)} className="opacity-0 transition-opacity hover:text-danger group-hover:opacity-100" title="Delete Chat" aria-label="Delete Chat">
                                    <HiOutlineTrash className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </aside>
    );

    return (
        <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-background font-sans text-text">
            <div className="hidden md:block">{chatHistory}</div>

            {mobileHistoryOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden">
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileHistoryOpen(false)} />
                    <div className="relative z-10 w-72">{chatHistory}</div>
                </div>
            )}

            <main className="flex min-w-0 flex-1 flex-col bg-background">
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setMobileHistoryOpen(true)} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-lighter hover:text-text md:hidden" aria-label="Open chat history">
                            <HiOutlineChatAlt2 className="h-5 w-5" />
                        </button>
                        <h1 className="text-sm font-semibold text-text">PricePilot AI Assistant</h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <button type="button" onClick={handleNewChat} className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-light px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-surface-lighter">
                            <HiOutlinePlus className="h-3.5 w-3.5" />
                            <span>New</span>
                        </button>
                    </div>
                </header>

                <section className="relative flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10 custom-scrollbar" aria-live="polite">
                        <div className="mx-auto flex min-h-full max-w-4xl flex-col">
                            {messages.length === 0 ? (
                                <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-4 sm:py-10">
                                    <div className="flex items-start gap-4 border-b border-border pb-7">
                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/10">
                                            <img src="/chabot-assistant-without-bg.png" alt="" className="h-full w-full scale-110 object-cover" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-light">AI workspace</p>
                                            <h2 className="mt-1 text-2xl font-bold text-text sm:text-3xl">What would you like to improve?</h2>
                                            <p className="mt-2 max-w-xl text-sm leading-6 text-text-muted">
                                                Ask about pricing, inventory, competitors, or demand. Type <code className="text-primary font-mono text-xs font-bold">@</code> to tag products or <code className="text-accent font-mono text-xs font-bold">/</code> to use AI methods.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {suggestions.map((suggestion) => {
                                            const Icon = suggestion.icon;
                                            return (
                                                <button key={suggestion.title} type="button" onClick={() => handleSend(null, suggestion.prompt)} className="group flex min-h-28 flex-col items-start rounded-lg border border-border bg-surface-light p-4 text-left transition-colors hover:border-primary/35 hover:bg-surface-lighter focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                                    <div className="flex w-full items-center justify-between">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary-light"><Icon className="h-4 w-4" /></div>
                                                        <HiOutlineArrowRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary-light" />
                                                    </div>
                                                    <h3 className="mt-3 text-sm font-semibold text-text">{suggestion.title}</h3>
                                                    <p className="mt-1 text-xs leading-5 text-text-muted">{suggestion.description}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 py-2">
                                    {messages.map((message, index) => (
                                        <article key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {message.role !== 'user' && (
                                                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-lighter">
                                                    <img src="/chabot-assistant-without-bg.png" alt="PricePilot AI" className="h-full w-full scale-110 object-cover" />
                                                </div>
                                            )}
                                            <div className={`max-w-[86%] rounded-lg border px-4 py-3 sm:max-w-[76%] ${message.role === 'user' ? 'border-primary/30 bg-primary text-white' : 'border-border bg-surface-light text-text'}`}>
                                                {message.role === 'user' ? <p className="whitespace-pre-wrap text-sm leading-6">{renderFormattedChatMessage(message.content)}</p> : <div>{formatMessageContent(message.content)}</div>}
                                            </div>
                                        </article>
                                    ))}
                                    {isLoading && (
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-lighter"><img src="/chabot-assistant-without-bg.png" alt="PricePilot AI" className="h-full w-full scale-110 object-cover" /></div>
                                            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface-light px-4 py-3" aria-label="PricePilot is responding">
                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-light" />
                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-light" style={{ animationDelay: '0.15s' }} />
                                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-light" style={{ animationDelay: '0.3s' }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    <div className="shrink-0 border-t border-border bg-surface px-4 py-3 sm:px-6 relative">
                        <div className="mx-auto max-w-4xl relative">
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

                            {/* Quick Slash-Command Chips */}
                            <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted shrink-0 mr-1">
                                    Quick Slash Commands:
                                </span>
                                {SLASH_COMMANDS.slice(0, 4).map(cmd => (
                                    <button
                                        key={cmd.cmd}
                                        type="button"
                                        onClick={() => handleSend(null, cmd.prompt)}
                                        className="shrink-0 inline-flex items-center gap-1 bg-surface-lighter hover:bg-primary/10 border border-border hover:border-primary/30 text-text-muted hover:text-primary-light px-2.5 py-1 rounded-full font-mono text-[11px] transition-colors"
                                    >
                                        <HiOutlineTag className="w-3 h-3 text-accent" />
                                        {cmd.cmd}
                                    </button>
                                ))}
                            </div>

                            {attachedFile && (
                                <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-xs text-primary-light">
                                    <HiOutlineDocumentText className="h-4 w-4 shrink-0" />
                                    <span className="truncate font-medium">{attachedFile.name}</span>
                                    <button type="button" onClick={() => { setAttachedFile(null); setExtractedText(null); }} className="rounded p-0.5 text-text-muted transition-colors hover:bg-surface hover:text-text" aria-label="Remove attached file" title="Remove file"><HiOutlineX className="h-3.5 w-3.5" /></button>
                                </div>
                            )}
                            <form onSubmit={handleSend} className="flex items-center gap-2 rounded-xl border border-border bg-surface-light p-2 transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15">
                                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.txt,.csv" onChange={handleFileUpload} />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-surface-lighter hover:text-primary-light" aria-label="Attach PDF, TXT, or CSV file" title="Attach file"><HiOutlinePaperClip className="h-5 w-5" /></button>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder={extractedText ? 'Ask about your attached file...' : 'Message PricePilot AI (Type @ for products, / for methods)...'}
                                    className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-text outline-none placeholder:text-text-muted"
                                />
                                <button type="submit" disabled={!input.trim() || isLoading} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message" title="Send message"><HiOutlinePaperAirplane className="h-4 w-4" /></button>
                            </form>
                            <p className="mt-2 text-center text-[10px] text-text-muted">PricePilot AI can make mistakes. Tag products with @ and invoke methods with /.</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Chat;
