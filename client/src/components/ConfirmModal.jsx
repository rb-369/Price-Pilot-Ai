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
                className="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-2xl p-6 text-text overflow-hidden animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header decorative bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                    variant === 'danger' 
                        ? 'bg-gradient-to-r from-danger to-danger/80' 
                        : variant === 'warning'
                        ? 'bg-gradient-to-r from-brass to-copper'
                        : 'bg-gradient-to-r from-primary to-copper'
                }`} />

                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl flex-shrink-0 ${
                        variant === 'danger'
                            ? 'bg-danger/10 text-danger border border-danger/20'
                            : variant === 'warning'
                            ? 'bg-brass/10 text-brass border border-brass/20'
                            : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                        {variant === 'danger' ? <HiOutlineTrash size={22} /> : <HiOutlineExclamation size={22} />}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-text tracking-tight">{title}</h3>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-lighter transition-colors"
                            >
                                <HiOutlineX size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-text-muted mt-2 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-surface hover:bg-surface-lighter border border-border text-text transition-all cursor-pointer disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
                            variant === 'danger'
                                ? 'bg-danger hover:bg-danger/90 shadow-danger/20'
                                : variant === 'warning'
                                ? 'bg-brass hover:bg-brass/90 shadow-brass/20'
                                : 'bg-primary hover:bg-primary-hover shadow-primary/20'
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
