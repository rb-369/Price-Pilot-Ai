import { HiOutlineChip } from 'react-icons/hi';

export default function ExplainWithAITag({ title = 'Explain with AI', contextData = {}, className = '' }) {
    const handleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();

        // Dispatch custom event to trigger ChatWidget
        const event = new CustomEvent('open_explain_with_ai', {
            detail: {
                title,
                contextData
            }
        });
        window.dispatchEvent(event);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            style={{ WebkitTextFillColor: 'currentColor' }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/25 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/20 transition-all shadow-sm cursor-pointer group flex-shrink-0 ${className}`}
            title="Get instant plain-English AI explanation for normal sellers"
        >
            <HiOutlineChip className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform flex-shrink-0" />
            <span className="text-indigo-700 dark:text-indigo-300 font-bold whitespace-nowrap" style={{ WebkitTextFillColor: 'currentColor' }}>{title}</span>
        </button>
    );
}
