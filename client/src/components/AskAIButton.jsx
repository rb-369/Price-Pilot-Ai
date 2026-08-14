import { HiOutlineChip, HiOutlineArrowRight, HiOutlineLightBulb } from 'react-icons/hi';

/**
 * Universal 'Ask AI' trigger component for technical pages.
 * Opens the Copilot widget and seeds it with context-aware prompts.
 */
export const triggerAskAI = ({ prompt, contextData = {}, autoSubmit = false }) => {
    const event = new CustomEvent('open_explain_with_ai', {
        detail: {
            title: prompt,
            prompt,
            contextData,
            autoSubmit
        }
    });
    window.dispatchEvent(event);
};

export default function AskAIButton({ 
    label = 'Ask AI', 
    prompt = '', 
    contextData = {}, 
    variant = 'chip', 
    autoSubmit = false,
    className = '' 
}) {
    const handleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        triggerAskAI({ prompt: prompt || label, contextData, autoSubmit });
    };

    if (variant === 'chip') {
        return (
            <button
                type="button"
                onClick={handleClick}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/20 transition-all shadow-sm cursor-pointer group ${className}`}
                title={`Ask AI: ${prompt || label}`}
            >
                <HiOutlineChip className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
                <span>{label}</span>
            </button>
        );
    }

    if (variant === 'button') {
        return (
            <button
                type="button"
                onClick={handleClick}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md hover:shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 transition-all cursor-pointer ${className}`}
                title={`Ask AI: ${prompt || label}`}
            >
                <HiOutlineChip size={15} />
                <span>{label}</span>
            </button>
        );
    }

    if (variant === 'quick-prompt') {
        return (
            <button
                type="button"
                onClick={handleClick}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-xs text-slate-700 hover:text-indigo-600 shadow-sm dark:bg-[#131b2e] dark:border-slate-800 dark:hover:border-indigo-500/40 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer group text-left ${className}`}
            >
                <div className="flex items-center gap-2 truncate">
                    <HiOutlineLightBulb className="text-amber-500 dark:text-indigo-400 flex-shrink-0" size={14} />
                    <span className="truncate font-medium">{label}</span>
                </div>
                <HiOutlineArrowRight className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" size={12} />
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-500/20 transition-all cursor-pointer ${className}`}
            title={`Ask AI: ${prompt || label}`}
        >
            <HiOutlineChip size={16} />
        </button>
    );
}
