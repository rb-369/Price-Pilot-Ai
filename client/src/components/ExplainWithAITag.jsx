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
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 hover:border-indigo-500/50 hover:bg-indigo-500/20 transition-all shadow-sm cursor-pointer group ${className}`}
            title="Get instant plain-English AI explanation for normal sellers"
        >
            <HiOutlineChip className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span>{title}</span>
        </button>
    );
}
