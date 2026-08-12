import { HiOutlineSparkles } from 'react-icons/hi';

export default function ExplainWithAITag({ title = 'Explain with AI', contextData = {}, className = '' }) {
    const handleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();

        // Dispatch custom event to trigger ChatWidget with /explain-simply
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
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-primary/20 via-purple-500/20 to-accent/20 text-primary-light border border-primary/30 hover:border-primary hover:from-primary/30 hover:to-accent/30 transition-all shadow-sm cursor-pointer group ${className}`}
            title="Get instant plain-English AI explanation for normal sellers"
        >
            <HiOutlineSparkles className="w-3.5 h-3.5 text-warning animate-pulse group-hover:scale-110 transition-transform" />
            <span>{title}</span>
        </button>
    );
}
