import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { updateProfile, changePassword } from '../api';
import toast from 'react-hot-toast';
import {
    HiOutlineUser,
    HiOutlineCog,
    HiOutlineColorSwatch,
    HiOutlineAdjustments,
    HiOutlineBell,
    HiOutlineShieldCheck,
    HiOutlinePlus,
    HiOutlineCheck,
    HiOutlineTrash,
    HiOutlinePencil,
    HiOutlineLightningBolt,
    HiOutlineMoon,
    HiOutlineSun,
    HiOutlineDesktopComputer,
    HiOutlineKey,
    HiOutlineCloudUpload,
    HiOutlineSwitchHorizontal,
    HiOutlineRefresh,
    HiOutlineExclamation
} from 'react-icons/hi';
import { SiGoogle, SiShopify, SiAmazon } from 'react-icons/si';
import ConfirmModal from '../components/ConfirmModal';

const PRESET_AVATARS = [
    '⚡', '🚀', '👑', '💼', '🎯', '💡', '🤖', '🔥', '🌟', '🛒'
];

const STORE_TYPES = [
    { value: 'general', label: 'General Store' },
    { value: 'electronics', label: 'Electronics & Gadgets' },
    { value: 'fashion', label: 'Fashion & Apparel' },
    { value: 'groceries', label: 'Groceries & Supermarket' },
    { value: 'fitness', label: 'Fitness & Sports' },
    { value: 'beauty', label: 'Beauty & Personal Care' },
    { value: 'home', label: 'Home & Furniture' },
    { value: 'books', label: 'Books & Stationery' },
    { value: 'pharmacy', label: 'Pharmacy & Health' },
    { value: 'jewelry', label: 'Jewelry & Accessories' },
    { value: 'automotive', label: 'Automotive & Parts' },
    { value: 'toys', label: 'Toys & Kids' },
    { value: 'food', label: 'Food & Beverages' },
    { value: 'digital', label: 'Digital Products' },
    { value: 'other', label: 'Other Niche' },
];

const PLATFORMS = [
    { id: 'Shopify', name: 'Shopify Store', color: '#96bf48' },
    { id: 'Amazon', name: 'Amazon Seller', color: '#ff9900' },
    { id: 'Flipkart', name: 'Flipkart Hub', color: '#2874f0' },
    { id: 'WooCommerce', name: 'WooCommerce', color: '#96588a' },
    { id: 'Custom', name: 'Custom API / Direct', color: '#6366f1' },
];

export default function Settings() {
    const { user, activeProfile, updateUser, switchProfile } = useAuth();
    const { theme, setTheme } = useTheme();
    const { currency, setCurrency, currencies } = useCurrency();

    const [activeTab, setActiveTab] = useState('profiles'); // 'profiles', 'general', 'appearance', 'ai-rules', 'notifications', 'security'
    const [saving, setSaving] = useState(false);

    // Profile & Personal state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        storeName: '',
        storeType: 'general',
        avatar: '⚡',
    });

    // Preferences & AI state
    const [preferences, setPreferences] = useState({
        theme: 'dark',
        currency: 'INR',
        minMarginFloor: 15,
        maxSurgeCeiling: 35,
        autoApplyRecommendations: false,
        recommendationThreshold: 90,
        pricingStrategy: 'undercut_1',
        emailNotifications: true,
        priceDropAlerts: true,
        weeklyDigest: true,
    });

    // Multi-profile state
    const [profiles, setProfiles] = useState([]);
    const [showNewProfileModal, setShowNewProfileModal] = useState(false);
    const [editingProfileId, setEditingProfileId] = useState(null);
    const [deleteProfileTarget, setDeleteProfileTarget] = useState(null);
    const [isDeletingProfile, setIsDeletingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: '',
        storeType: 'general',
        platform: 'Shopify',
        role: 'Store Owner',
        currency: 'INR',
        color: '#6366f1',
        targetMargin: 20,
    });

    // Security state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [changingPassword, setChangingPassword] = useState(false);

    // Initialize state from user object
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                storeName: user.storeName || 'Primary Store',
                storeType: user.storeType || 'general',
                avatar: user.avatar || '⚡',
            });

            if (user.preferences) {
                setPreferences((prev) => ({
                    ...prev,
                    ...user.preferences,
                }));
            }

            if (user.profiles && user.profiles.length > 0) {
                setProfiles(user.profiles);
            } else {
                // Default initial profile
                const defaultProfile = {
                    id: 'default',
                    name: user.storeName || `${user.name}'s Primary Store`,
                    storeType: user.storeType || 'general',
                    platform: 'Shopify',
                    role: user.role === 'admin' ? 'Administrator' : 'Store Owner',
                    currency: currency || 'INR',
                    color: '#6366f1',
                    isDefault: true,
                    targetMargin: 20,
                };
                setProfiles([defaultProfile]);
            }
        }
    }, [user]);

    // Handle saving General Profile info
    const handleSaveGeneral = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            const res = await updateProfile({
                name: formData.name,
                phone: formData.phone,
                storeName: formData.storeName,
                storeType: formData.storeType,
                avatar: formData.avatar,
            });
            updateUser(res.data);
            toast.success('Profile details saved successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    // Handle saving Preferences & AI Rules
    const handleSavePreferences = async (newPrefs) => {
        const payload = newPrefs || preferences;
        setSaving(true);
        try {
            const res = await updateProfile({
                preferences: payload,
            });
            updateUser(res.data);
            toast.success('Preferences updated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    // Profile Switching
    const handleSwitchProfile = async (profileId) => {
        switchProfile(profileId);
        const selected = profiles.find(p => p.id === profileId);
        if (selected?.currency) {
            setCurrency(selected.currency);
        }
        toast.success(`Switched to "${selected?.name || 'Store Profile'}"`);
        try {
            await updateProfile({ activeProfileId: profileId });
        } catch (err) {
            console.error('Failed to sync active profile to server', err);
        }
    };

    // Add or Edit Store Profile
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!profileForm.name.trim()) {
            toast.error('Store profile name is required');
            return;
        }

        let updatedProfiles = [...profiles];
        if (editingProfileId) {
            updatedProfiles = updatedProfiles.map(p => p.id === editingProfileId ? {
                ...p,
                ...profileForm,
            } : p);
            toast.success('Store profile updated!');
        } else {
            const newId = `profile_${Date.now()}`;
            const newProfile = {
                id: newId,
                ...profileForm,
                isDefault: updatedProfiles.length === 0,
            };
            updatedProfiles.push(newProfile);
            toast.success(`Store profile "${profileForm.name}" created!`);
        }

        setProfiles(updatedProfiles);
        setShowNewProfileModal(false);
        setEditingProfileId(null);
        setProfileForm({
            name: '',
            storeType: 'general',
            platform: 'Shopify',
            role: 'Store Owner',
            currency: 'INR',
            color: '#6366f1',
            targetMargin: 20,
        });

        try {
            const res = await updateProfile({ profiles: updatedProfiles });
            updateUser(res.data);
        } catch (err) {
            toast.error('Failed to save profile on server');
        }
    };

    // Delete Store Profile
    const handleDeleteProfile = (profile) => {
        if (profiles.length <= 1) {
            toast.error('You must keep at least one store profile');
            return;
        }
        setDeleteProfileTarget(profile);
    };

    const confirmDeleteProfile = async () => {
        if (!deleteProfileTarget) return;
        setIsDeletingProfile(true);

        const profileId = deleteProfileTarget.id;
        const updated = profiles.filter(p => p.id !== profileId);
        setProfiles(updated);

        // If deleting active profile, switch to first available
        if (activeProfile?.id === profileId) {
            switchProfile(updated[0].id);
        }

        try {
            const res = await updateProfile({
                profiles: updated,
                activeProfileId: activeProfile?.id === profileId ? updated[0].id : activeProfile?.id,
            });
            updateUser(res.data);
            toast.success('Store profile deleted');
            setDeleteProfileTarget(null);
        } catch (err) {
            toast.error('Failed to update profiles on server');
        } finally {
            setIsDeletingProfile(false);
        }
    };

    // Password Change
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setChangingPassword(true);
        try {
            await changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            toast.success('Password changed successfully!');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update password');
        } finally {
            setChangingPassword(false);
        }
    };

    const tabs = [
        { id: 'profiles', label: 'Store Profiles', icon: HiOutlineSwitchHorizontal, badge: profiles.length },
        { id: 'general', label: 'Account & Profile', icon: HiOutlineUser },
        { id: 'appearance', label: 'Appearance & Region', icon: HiOutlineColorSwatch },
        { id: 'ai-rules', label: 'AI & Pricing Rules', icon: HiOutlineAdjustments },
        { id: 'notifications', label: 'Notifications', icon: HiOutlineBell },
        { id: 'security', label: 'Security & Auth', icon: HiOutlineShieldCheck },
    ];

    return (
        <div className="space-y-8 pb-16">
            {/* Top Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/30 via-accent/20 to-primary/10 flex items-center justify-center text-2xl border border-primary/20 shadow-lg shadow-primary/10">
                            {formData.avatar || '⚡'}
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight flex items-center gap-2">
                                Settings & Preferences
                            </h1>
                            <p className="text-sm text-text-muted mt-0.5">
                                Manage your multiple store profiles, AI repricing guardrails, and account settings
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Active Store Status Pill */}
                <div className="flex items-center gap-3 bg-surface-light/60 border border-border/80 px-4 py-2.5 rounded-2xl backdrop-blur-md">
                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: activeProfile?.color || '#6366f1' }} />
                    <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Active Workspace</div>
                        <div className="text-xs font-bold text-text truncate max-w-[160px]">{activeProfile?.name || 'Primary Store'}</div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                        {activeProfile?.platform || 'Shopify'}
                    </span>
                </div>
            </div>

            {/* Main Tabs Navigation Bar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-border/40">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
                                isActive
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25 font-semibold'
                                    : 'text-text-muted hover:text-text hover:bg-surface-light/60'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                            {tab.badge !== undefined && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                    isActive ? 'bg-white/25 text-white' : 'bg-surface-lighter text-text-muted'
                                }`}>
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: Multi-Store Profiles Switcher */}
            {activeTab === 'profiles' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-text">Store Profiles & Workspaces</h2>
                            <p className="text-xs text-text-muted">
                                Switch between different stores or marketplace channels with 1-click.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setEditingProfileId(null);
                                setProfileForm({
                                    name: '',
                                    storeType: 'general',
                                    platform: 'Shopify',
                                    role: 'Store Owner',
                                    currency: currency || 'INR',
                                    color: '#6366f1',
                                    targetMargin: 20,
                                });
                                setShowNewProfileModal(true);
                            }}
                            className="btn-primary flex items-center gap-2 text-xs py-2.5 px-4"
                        >
                            <HiOutlinePlus className="w-4 h-4" />
                            Add Store Profile
                        </button>
                    </div>

                    {/* Profile Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {profiles.map((prof) => {
                            const isCurrentActive = activeProfile?.id === prof.id;
                            return (
                                <div
                                    key={prof.id}
                                    className={`glass-card p-5 rounded-2xl relative transition-all duration-300 flex flex-col justify-between border ${
                                        isCurrentActive
                                            ? 'border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/20'
                                            : 'border-border/60 hover:border-border hover:shadow-lg'
                                    }`}
                                >
                                    <div>
                                        {/* Top Card Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md"
                                                    style={{ backgroundColor: prof.color || '#6366f1' }}
                                                >
                                                    {prof.platform === 'Shopify' ? <SiShopify className="w-4 h-4" /> :
                                                     prof.platform === 'Amazon' ? <SiAmazon className="w-4 h-4" /> :
                                                     <HiOutlineSwitchHorizontal className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-text text-sm truncate max-w-[150px]">{prof.name}</h3>
                                                    <span className="text-[10px] text-text-muted font-medium">{prof.platform || 'Shopify'} • {prof.currency || 'INR'}</span>
                                                </div>
                                            </div>

                                            {isCurrentActive && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">
                                                    <HiOutlineCheck className="w-3 h-3" /> Active
                                                </span>
                                            )}
                                        </div>

                                        {/* Profile Specs */}
                                        <div className="space-y-2 py-3 border-y border-border/30 my-2 text-xs">
                                            <div className="flex justify-between text-text-muted">
                                                <span>Store Niche:</span>
                                                <span className="font-medium text-text capitalize">{prof.storeType || 'General'}</span>
                                            </div>
                                            <div className="flex justify-between text-text-muted">
                                                <span>Assigned Role:</span>
                                                <span className="font-medium text-text">{prof.role || 'Store Owner'}</span>
                                            </div>
                                            <div className="flex justify-between text-text-muted">
                                                <span>Target Margin:</span>
                                                <span className="font-semibold text-primary-light">{prof.targetMargin || 20}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 pt-3">
                                        {!isCurrentActive ? (
                                            <button
                                                type="button"
                                                onClick={() => handleSwitchProfile(prof.id)}
                                                className="btn-secondary flex-1 py-2 text-xs font-semibold text-center justify-center flex items-center gap-1.5"
                                            >
                                                <HiOutlineSwitchHorizontal className="w-3.5 h-3.5" />
                                                Switch to Store
                                            </button>
                                        ) : (
                                            <div className="flex-1 py-2 text-xs text-center font-bold text-primary bg-primary/10 rounded-xl border border-primary/20">
                                                Currently Active
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingProfileId(prof.id);
                                                setProfileForm({
                                                    name: prof.name,
                                                    storeType: prof.storeType || 'general',
                                                    platform: prof.platform || 'Shopify',
                                                    role: prof.role || 'Store Owner',
                                                    currency: prof.currency || 'INR',
                                                    color: prof.color || '#6366f1',
                                                    targetMargin: prof.targetMargin || 20,
                                                });
                                                setShowNewProfileModal(true);
                                            }}
                                            className="p-2 rounded-xl border border-border/80 text-text-muted hover:text-text hover:bg-surface-lighter transition-colors"
                                            title="Edit Profile"
                                        >
                                            <HiOutlinePencil className="w-3.5 h-3.5" />
                                        </button>
                                        {profiles.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteProfile(prof)}
                                                className="p-2 rounded-xl border border-border/80 text-text-muted hover:text-danger hover:border-danger/30 hover:bg-danger/10 transition-colors cursor-pointer"
                                                title="Delete Profile"
                                            >
                                                <HiOutlineTrash className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: General Profile & Account */}
            {activeTab === 'general' && (
                <div className="max-w-3xl space-y-6 animate-fade-in">
                    <div className="glass-card p-6 sm:p-8 rounded-2xl border border-border/60">
                        <h2 className="text-lg font-bold text-text mb-1">Account & Store Details</h2>
                        <p className="text-xs text-text-muted mb-6">Update your account information and default store niche.</p>

                        <form onSubmit={handleSaveGeneral} className="space-y-5">
                            {/* Avatar Picker */}
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Choose Profile Avatar</label>
                                <div className="flex flex-wrap gap-2.5 items-center">
                                    {PRESET_AVATARS.map((av) => (
                                        <button
                                            key={av}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, avatar: av })}
                                            className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition-transform cursor-pointer border ${
                                                formData.avatar === av
                                                    ? 'border-primary bg-primary/20 scale-110 shadow-md shadow-primary/20 ring-2 ring-primary/30'
                                                    : 'border-border/60 bg-surface hover:scale-105'
                                            }`}
                                        >
                                            {av}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Full Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Email Address</label>
                                    <input
                                        type="email"
                                        className="input-field opacity-60 cursor-not-allowed"
                                        value={formData.email}
                                        disabled
                                        title="Email cannot be changed directly"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Default Store Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. Apex Electronics Store"
                                        value={formData.storeName}
                                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Contact Phone</label>
                                    <input
                                        type="tel"
                                        className="input-field"
                                        placeholder="+1 234 567 8900"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Primary Store Niche / Category</label>
                                <select
                                    className="input-field"
                                    value={formData.storeType}
                                    onChange={(e) => setFormData({ ...formData, storeType: e.target.value })}
                                >
                                    {STORE_TYPES.map(st => (
                                        <option key={st.value} value={st.value}>{st.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end pt-3">
                                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 py-2.5 px-6 text-sm">
                                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiOutlineCloudUpload className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TAB 3: Appearance & Localization */}
            {activeTab === 'appearance' && (
                <div className="max-w-3xl space-y-6 animate-fade-in">
                    <div className="glass-card p-6 sm:p-8 rounded-2xl border border-border/60 space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-text mb-1">Theme & Display</h2>
                            <p className="text-xs text-text-muted">Customize how PricePilot AI looks on your screen.</p>
                        </div>

                        {/* Theme Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setTheme('dark');
                                    handleSavePreferences({ ...preferences, theme: 'dark' });
                                }}
                                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                    theme === 'dark'
                                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/15 ring-2 ring-primary/20'
                                        : 'border-border/60 bg-surface hover:border-border'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-primary-light">
                                        <HiOutlineMoon className="w-5 h-5" />
                                    </div>
                                    {theme === 'dark' && <HiOutlineCheck className="w-5 h-5 text-primary" />}
                                </div>
                                <h3 className="text-sm font-bold text-text">Dark Obsidian (Recommended)</h3>
                                <p className="text-xs text-text-muted mt-1">High-contrast dark mode tailored for low eye strain and premium feel.</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setTheme('light');
                                    handleSavePreferences({ ...preferences, theme: 'light' });
                                }}
                                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                    theme === 'light'
                                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/15 ring-2 ring-primary/20'
                                        : 'border-border/60 bg-surface hover:border-border'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-amber-500">
                                        <HiOutlineSun className="w-5 h-5" />
                                    </div>
                                    {theme === 'light' && <HiOutlineCheck className="w-5 h-5 text-primary" />}
                                </div>
                                <h3 className="text-sm font-bold text-text">Clean Light</h3>
                                <p className="text-xs text-text-muted mt-1">Crisp, high-clarity daylight theme with soft shadows and slate tones.</p>
                            </button>
                        </div>

                        {/* Currency Selector */}
                        <div className="pt-4 border-t border-border/40">
                            <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Primary Display Currency</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {currencies.map((curr) => (
                                    <button
                                        key={curr}
                                        type="button"
                                        onClick={() => {
                                            setCurrency(curr);
                                            handleSavePreferences({ ...preferences, currency: curr });
                                        }}
                                        className={`py-3 px-4 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer ${
                                            currency === curr
                                                ? 'border-primary bg-primary/15 text-primary ring-2 ring-primary/20 shadow-md'
                                                : 'border-border/60 bg-surface text-text-muted hover:text-text hover:border-border'
                                        }`}
                                    >
                                        {curr}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: AI Engine & Pricing Rules */}
            {activeTab === 'ai-rules' && (
                <div className="max-w-3xl space-y-6 animate-fade-in">
                    <div className="glass-card p-6 sm:p-8 rounded-2xl border border-border/60 space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-text mb-1">AI Pricing Engine Guardrails</h2>
                            <p className="text-xs text-text-muted">Configure safety bounds so algorithms always protect your profit margins.</p>
                        </div>

                        {/* Sliders */}
                        <div className="space-y-6 pt-2">
                            {/* Minimum Margin Floor */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-sm font-bold text-text">Minimum Margin Floor</h4>
                                        <p className="text-[11px] text-text-muted">AI will never recommend a price that yields profit margins below this %.</p>
                                    </div>
                                    <span className="text-sm font-extrabold text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                                        {preferences.minMarginFloor}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="50"
                                    value={preferences.minMarginFloor}
                                    onChange={(e) => setPreferences({ ...preferences, minMarginFloor: Number(e.target.value) })}
                                    className="w-full accent-primary cursor-pointer"
                                />
                            </div>

                            {/* Max Surge Ceiling */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="text-sm font-bold text-text">Maximum Price Surge Ceiling</h4>
                                        <p className="text-[11px] text-text-muted">Caps price jumps to prevent customer sticker-shock during high demand.</p>
                                    </div>
                                    <span className="text-sm font-extrabold text-accent-light bg-accent/10 px-3 py-1 rounded-lg border border-accent/20">
                                        +{preferences.maxSurgeCeiling}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={preferences.maxSurgeCeiling}
                                    onChange={(e) => setPreferences({ ...preferences, maxSurgeCeiling: Number(e.target.value) })}
                                    className="w-full accent-accent cursor-pointer"
                                />
                            </div>

                            {/* Strategy Mode */}
                            <div className="space-y-2 pt-2">
                                <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider">Default Competitor Strategy</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        { id: 'undercut_1', name: 'Undercut by 1-2%', desc: 'Aggressive volume capture' },
                                        { id: 'match_lowest', name: 'Match Lowest Price', desc: 'Equal parity positioning' },
                                        { id: 'premium_5', name: 'Premium Brand +5%', desc: 'Maximize perceived value' },
                                    ].map((strat) => (
                                        <button
                                            key={strat.id}
                                            type="button"
                                            onClick={() => setPreferences({ ...preferences, pricingStrategy: strat.id })}
                                            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                                preferences.pricingStrategy === strat.id
                                                    ? 'border-primary bg-primary/15 ring-2 ring-primary/20'
                                                    : 'border-border/60 bg-surface hover:border-border'
                                            }`}
                                        >
                                            <div className="font-bold text-xs text-text">{strat.name}</div>
                                            <div className="text-[10px] text-text-muted mt-1">{strat.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Auto Apply Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-lighter/50 border border-border/60">
                                <div>
                                    <h4 className="text-xs font-bold text-text">Auto-Apply High Confidence Recommendations</h4>
                                    <p className="text-[11px] text-text-muted">Automatically sync price changes when AI confidence exceeds 90%.</p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={preferences.autoApplyRecommendations}
                                    onChange={(e) => setPreferences({ ...preferences, autoApplyRecommendations: e.target.checked })}
                                    className="w-5 h-5 accent-primary cursor-pointer rounded"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-3">
                            <button
                                type="button"
                                onClick={() => handleSavePreferences()}
                                disabled={saving}
                                className="btn-primary flex items-center gap-2 py-2.5 px-6 text-sm"
                            >
                                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiOutlineCloudUpload className="w-4 h-4" />}
                                Save AI Rules
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 5: Notifications & Alerts */}
            {activeTab === 'notifications' && (
                <div className="max-w-3xl space-y-6 animate-fade-in">
                    <div className="glass-card p-6 sm:p-8 rounded-2xl border border-border/60 space-y-5">
                        <div>
                            <h2 className="text-lg font-bold text-text mb-1">Notification Preferences</h2>
                            <p className="text-xs text-text-muted">Stay notified about critical price anomalies and market surges.</p>
                        </div>

                        <div className="space-y-4 pt-2">
                            {[
                                {
                                    key: 'emailNotifications',
                                    title: 'Email Alerts for Critical Price Drops',
                                    desc: 'Receive immediate email when a competitor drops price by >10%.',
                                },
                                {
                                    key: 'priceDropAlerts',
                                    title: 'Real-Time Price Mismatch Warnings',
                                    desc: 'Notify inside the dashboard when live platform price diverges from catalog.',
                                },
                                {
                                    key: 'weeklyDigest',
                                    title: 'Weekly AI Executive Revenue Report',
                                    desc: 'Receive an automated summary of revenue gained via price optimizations.',
                                },
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-surface-lighter/50 border border-border/60">
                                    <div>
                                        <h4 className="text-xs font-bold text-text">{item.title}</h4>
                                        <p className="text-[11px] text-text-muted mt-0.5">{item.desc}</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={preferences[item.key]}
                                        onChange={(e) => {
                                            const updated = { ...preferences, [item.key]: e.target.checked };
                                            setPreferences(updated);
                                            handleSavePreferences(updated);
                                        }}
                                        className="w-5 h-5 accent-primary cursor-pointer rounded"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 6: Security & Connected Auth */}
            {activeTab === 'security' && (
                <div className="max-w-3xl space-y-6 animate-fade-in">
                    {/* Password Update Card */}
                    <div className="glass-card p-6 sm:p-8 rounded-2xl border border-border/60 space-y-5">
                        <div>
                            <h2 className="text-lg font-bold text-text mb-1">Update Password</h2>
                            <p className="text-xs text-text-muted">Change your account password for enhanced security.</p>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Current Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="••••••••"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">New Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="Min 6 characters"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="Repeat new password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={changingPassword} className="btn-primary flex items-center gap-2 py-2.5 px-6 text-sm">
                                    {changingPassword ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <HiOutlineKey className="w-4 h-4" />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Connected Accounts Card */}
                    <div className="glass-card p-6 sm:p-8 rounded-2xl border border-border/60 space-y-4">
                        <div>
                            <h2 className="text-lg font-bold text-text mb-1">Connected Authentication Providers</h2>
                            <p className="text-xs text-text-muted">Manage your social & Single Sign-On connections.</p>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-surface-lighter/50 border border-border/60">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                    <SiGoogle className="w-5 h-5" style={{ color: '#4285F4' }} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-text">Google Account</h4>
                                    <p className="text-[11px] text-text-muted">{user?.email || 'Connected'}</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-success/15 text-success border border-success/30">
                                Linked & Active
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Add or Edit Store Profile */}
            {showNewProfileModal && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card p-6 sm:p-8 rounded-2xl max-w-lg w-full border border-primary/30 shadow-2xl relative animate-scale-up">
                        <h3 className="text-lg font-extrabold text-text mb-1">
                            {editingProfileId ? 'Edit Store Profile' : 'Add New Store Profile'}
                        </h3>
                        <p className="text-xs text-text-muted mb-5">
                            Create a distinct workspace with its own platform, target margin, and currency.
                        </p>

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Store Workspace Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. Amazon US Electronics"
                                    value={profileForm.name}
                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Platform</label>
                                    <select
                                        className="input-field"
                                        value={profileForm.platform}
                                        onChange={(e) => setProfileForm({ ...profileForm, platform: e.target.value })}
                                    >
                                        {PLATFORMS.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Store Niche</label>
                                    <select
                                        className="input-field"
                                        value={profileForm.storeType}
                                        onChange={(e) => setProfileForm({ ...profileForm, storeType: e.target.value })}
                                    >
                                        {STORE_TYPES.map(st => (
                                            <option key={st.value} value={st.value}>{st.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Currency</label>
                                    <select
                                        className="input-field"
                                        value={profileForm.currency}
                                        onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
                                    >
                                        {currencies.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Target Profit Margin (%)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        className="input-field"
                                        value={profileForm.targetMargin}
                                        onChange={(e) => setProfileForm({ ...profileForm, targetMargin: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Color Selector */}
                            <div>
                                <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">Profile Tag Color</label>
                                <div className="flex gap-2">
                                    {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#14b8a6'].map(col => (
                                        <button
                                            key={col}
                                            type="button"
                                            onClick={() => setProfileForm({ ...profileForm, color: col })}
                                            className={`w-8 h-8 rounded-full transition-transform cursor-pointer ${
                                                profileForm.color === col ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-surface' : 'hover:scale-110'
                                            }`}
                                            style={{ backgroundColor: col }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewProfileModal(false);
                                        setEditingProfileId(null);
                                    }}
                                    className="btn-secondary py-2 px-4 text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary py-2 px-5 text-xs font-bold"
                                >
                                    {editingProfileId ? 'Update Store' : 'Create Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Non-blocking Confirm Delete Store Modal */}
            <ConfirmModal
                isOpen={!!deleteProfileTarget}
                onClose={() => setDeleteProfileTarget(null)}
                onConfirm={confirmDeleteProfile}
                title="Delete Store Profile"
                message={`Are you sure you want to delete the store profile "${deleteProfileTarget?.name || 'this profile'}"?`}
                confirmText="Delete Profile"
                variant="danger"
                loading={isDeletingProfile}
            />
        </div>
    );
}
