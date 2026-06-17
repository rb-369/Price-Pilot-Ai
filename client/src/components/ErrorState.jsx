import { HiOutlineExclamationCircle, HiRefresh } from 'react-icons/hi';

export default function ErrorState({ title = "Something went wrong", message = "We couldn't load this data. Please try again.", onRetry }) {
    return (
        <div className="glass-card p-10 flex flex-col items-center justify-center text-center w-full min-h-[300px] border-danger/20">
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-4">
                <HiOutlineExclamationCircle className="w-8 h-8 text-danger" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 max-w-md mb-6">{message}</p>
            {onRetry && (
                <button 
                    onClick={onRetry}
                    className="btn-secondary flex items-center gap-2 hover:bg-danger/10 hover:border-danger/30 hover:text-danger transition-colors"
                >
                    <HiRefresh className="w-4 h-4" /> Try Again
                </button>
            )}
        </div>
    );
}
