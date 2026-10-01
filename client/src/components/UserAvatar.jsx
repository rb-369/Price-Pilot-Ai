import { useState } from 'react';
import {
    HiOutlineUser,
    HiOutlineShoppingBag,
    HiOutlineSparkles,
    HiOutlineShieldCheck,
    HiOutlineTrendingUp,
    HiOutlineCube,
    HiOutlineScale,
    HiOutlineLightningBolt
} from 'react-icons/hi';

const AVATAR_ICONS = {
    user: HiOutlineUser,
    store: HiOutlineShoppingBag,
    sparkles: HiOutlineSparkles,
    shield: HiOutlineShieldCheck,
    trending: HiOutlineTrendingUp,
    cube: HiOutlineCube,
    scale: HiOutlineScale,
    lightning: HiOutlineLightningBolt,
};

// Helper to detect emojis and suppress them completely
const containsEmoji = (str) => /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(str);

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

    // Check if avatar matches a predefined vector icon
    const IconComponent = avatar && AVATAR_ICONS[avatar];
    if (IconComponent) {
        return (
            <div
                className={`overflow-hidden flex-shrink-0 flex items-center justify-center bg-primary/10 border border-primary/20 text-primary shadow-sm select-none ${className}`}
            >
                <IconComponent className="w-1/2 h-1/2" />
            </div>
        );
    }

    // Never render emojis! If avatar is an emoji, suppress it.
    // If name exists, calculate clean initials (1 or 2 uppercase letters).
    const validAvatarChar =
        typeof avatar === 'string' &&
        avatar.length > 0 &&
        avatar.length <= 3 &&
        !containsEmoji(avatar)
            ? avatar.toUpperCase()
            : null;

    const initials = validAvatarChar || (name
        ? name
              .trim()
              .split(/\s+/)
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
        : '');

    return (
        <div
            className={`overflow-hidden flex-shrink-0 flex items-center justify-center bg-gradient-to-tr from-primary/25 via-primary/15 to-primary/5 border border-primary/20 text-text font-bold shadow-sm select-none ${className}`}
        >
            {initials ? (
                <span className={`tracking-wider ${textClassName}`}>{initials}</span>
            ) : (
                <HiOutlineUser className="w-1/2 h-1/2 text-primary" />
            )}
        </div>
    );
}
