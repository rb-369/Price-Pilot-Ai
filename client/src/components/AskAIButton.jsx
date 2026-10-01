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
                style={{ WebkitTextFillColor: 'currentColor' }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 dark:bg-primary/15 dark:text-[#C57A5A] dark:border-primary/30 dark:hover:bg-primary/25 transition-all shadow-sm cursor-pointer group flex-shrink-0 ${className}`}
                title={`Ask AI: ${prompt || label}`}
            >
                <HiOutlineChip className="w-3.5 h-3.5 text-primary dark:text-[#C57A5A] group-hover:rotate-12 transition-transform flex-shrink-0" />
                <span className="font-semibold whitespace-nowrap" style={{ WebkitTextFillColor: 'currentColor' }}>{label}</span>
            </button>
        );
    }

    if (variant === 'button') {
        return (
            <button
                type="button"
                onClick={handleClick}
                style={{ WebkitTextFillColor: 'currentColor' }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary-dark text-white shadow-sm hover:shadow-primary/20 transition-all cursor-pointer flex-shrink-0 ${className}`}
                title={`Ask AI: ${prompt || label}`}
            >
                <HiOutlineChip size={15} className="flex-shrink-0" />
                <span className="text-white font-semibold whitespace-nowrap" style={{ WebkitTextFillColor: 'currentColor' }}>{label}</span>
            </button>
        );
    }

    if (variant === 'quick-prompt') {
        return (
            <button
                type="button"
                onClick={handleClick}
                style={{ WebkitTextFillColor: 'currentColor' }}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface border border-border hover:border-primary/50 text-xs text-text hover:text-primary shadow-xs dark:bg-surface dark:border-border dark:hover:border-primary/50 transition-all cursor-pointer group text-left ${className}`}
            >
                <div className="flex items-center gap-2 truncate">
                    <HiOutlineLightBulb className="text-primary dark:text-[#C57A5A] flex-shrink-0" size={14} />
                    <span className="truncate font-medium text-text group-hover:text-primary transition-colors" style={{ WebkitTextFillColor: 'currentColor' }}>{label}</span>
                </div>
                <HiOutlineArrowRight className="text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" size={12} />
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            style={{ WebkitTextFillColor: 'currentColor' }}
            className={`p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/15 border border-transparent hover:border-primary/20 transition-all cursor-pointer flex-shrink-0 ${className}`}
            title={`Ask AI: ${prompt || label}`}
        >
            <HiOutlineChip size={16} />
        </button>
    );
}
