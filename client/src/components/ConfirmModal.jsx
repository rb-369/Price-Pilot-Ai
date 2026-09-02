import { useEffect } from 'react';
import { HiOutlineExclamation, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed with this action?',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    variant = 'danger', // 'danger' | 'warning' | 'info'
    loading = false
}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !loading) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div 
                className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0d1326] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-slate-900 dark:text-slate-100 overflow-hidden animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header decorative bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                    variant === 'danger' 
                        ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                        : variant === 'warning'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                }`} />

                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl flex-shrink-0 ${
                        variant === 'danger'
                            ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                            : variant === 'warning'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                            : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20'
                    }`}>
                        {variant === 'danger' ? <HiOutlineTrash size={22} /> : <HiOutlineExclamation size={22} />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <HiOutlineX size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
                            variant === 'danger'
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                                : variant === 'warning'
                                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                        }`}
                    >
                        {loading ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
