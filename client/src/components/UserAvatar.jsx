import { useState } from 'react';

export default function UserAvatar({
    avatar,
    name = '',
    className = 'w-8 h-8 rounded-xl text-sm',
    imageClassName = '',
    textClassName = '',
}) {
    const [imgError, setImgError] = useState(false);

    const isImageUrl =
        typeof avatar === 'string' &&
        (avatar.startsWith('http://') ||
            avatar.startsWith('https://') ||
            avatar.startsWith('data:image/') ||
            avatar.startsWith('/'));

    if (isImageUrl && !imgError) {
        return (
            <div
                className={`overflow-hidden flex-shrink-0 flex items-center justify-center bg-surface-lighter ring-1 ring-primary/20 shadow-sm ${className}`}
            >
                <img
                    src={avatar}
                    alt={name ? `${name}'s avatar` : 'User avatar'}
                    className={`w-full h-full object-cover rounded-[inherit] ${imageClassName}`}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }

    // If it's a short string (emoji or 1-3 chars), show it. Otherwise fall back to user's first letter
    const displayChar =
        typeof avatar === 'string' && avatar.length > 0 && avatar.length <= 4
            ? avatar
            : name
            ? name.trim().charAt(0).toUpperCase()
            : '⚡';

    return (
        <div
            className={`overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-tr from-primary/30 via-accent/20 to-primary/10 border border-primary/20 text-text font-bold shadow-sm select-none ${className}`}
        >
            <span className={textClassName}>{displayChar}</span>
        </div>
    );
}
