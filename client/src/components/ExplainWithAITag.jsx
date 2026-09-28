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
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/15 hover:border-primary/40 transition-all shadow-sm cursor-pointer group flex-shrink-0 ${className}`}
            title="Get instant plain-English AI explanation for normal sellers"
        >
            <HiOutlineChip className="w-3.5 h-3.5 text-primary group-hover:rotate-12 transition-transform flex-shrink-0" />
            <span className="text-primary font-bold whitespace-nowrap" style={{ WebkitTextFillColor: 'currentColor' }}>{title}</span>
        </button>
    );
}
