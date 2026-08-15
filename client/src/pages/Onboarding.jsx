import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import newLightLogo from '../assets/new_light_logo.png';
import newDarkLogo from '../assets/new_dark_logo.png';
import { SiAmazon, SiShopify, SiWoocommerce } from 'react-icons/si';
import {
    HiOutlineShoppingBag,
    HiOutlineTrendingUp,
    HiOutlineLightningBolt,
    HiOutlineShieldCheck,
    HiOutlineScale,
    HiOutlineCube,
    HiOutlineSparkles,
    HiOutlineArrowRight,
    HiOutlineArrowLeft,
    HiOutlineCheck,
    HiOutlineGlobeAlt,
    HiOutlineCurrencyDollar,
    HiOutlineAdjustments,
    HiOutlineChartBar
} from 'react-icons/hi';

const SALES_CHANNELS = [
    {
        id: 'amazon',
        name: 'Amazon',
        desc: 'SP-API & Buy Box repricing',
        badge: 'Marketplace',
        icon: SiAmazon,
        color: '#FF9900',
        borderColor: 'hover:border-[#FF9900]/60',
        activeBg: 'bg-[#FF9900]/10 border-[#FF9900] ring-1 ring-[#FF9900]/30',
    },
    {
        id: 'shopify',
        name: 'Shopify',
        desc: 'Direct-to-consumer storefront',
        badge: 'D2C Store',
        icon: SiShopify,
        color: '#96BF48',
        borderColor: 'hover:border-[#96BF48]/60',
        activeBg: 'bg-[#96BF48]/10 border-[#96BF48] ring-1 ring-[#96BF48]/30',
    },
    {
        id: 'flipkart',
        name: 'Flipkart',
        desc: 'Seller Hub catalog sync',
        badge: 'Marketplace',
        icon: HiOutlineShoppingBag,
        color: '#2874F0',
        borderColor: 'hover:border-[#2874F0]/60',
        activeBg: 'bg-[#2874F0]/10 border-[#2874F0] ring-1 ring-[#2874F0]/30',
    },
    {
        id: 'woocommerce',
        name: 'WooCommerce',
        desc: 'WordPress eCommerce store',
        badge: 'Self-Hosted',
        icon: SiWoocommerce,
        color: '#9B5C8F',
        borderColor: 'hover:border-[#9B5C8F]/60',
        activeBg: 'bg-[#9B5C8F]/10 border-[#9B5C8F] ring-1 ring-[#9B5C8F]/30',
    },
    {
        id: 'meesho',
        name: 'Meesho',
        desc: 'Social commerce & value selling',
        badge: 'Social / Reseller',
        icon: HiOutlineSparkles,
        color: '#F43397',
        borderColor: 'hover:border-[#F43397]/60',
        activeBg: 'bg-[#F43397]/10 border-[#F43397] ring-1 ring-[#F43397]/30',
    },
    {
        id: 'quickcommerce',
        name: 'Quick Commerce',
        desc: 'Blinkit, Zepto, Instamart',
        badge: 'Instant Delivery',
        icon: HiOutlineLightningBolt,
        color: '#10B981',
        borderColor: 'hover:border-[#10B981]/60',
        activeBg: 'bg-[#10B981]/10 border-[#10B981] ring-1 ring-[#10B981]/30',
    },
    {
        id: 'custom',
        name: 'Custom / Other',
        desc: 'Custom API or retail store',
        badge: 'Omnichannel',
        icon: HiOutlineGlobeAlt,
        color: '#6366F1',
        borderColor: 'hover:border-[#6366F1]/60',
        activeBg: 'bg-[#6366F1]/10 border-[#6366F1] ring-1 ring-[#6366F1]/30',
    },
];

const PRIMARY_GOALS = [
    {
        id: 'profit',
        title: 'Maximize Profit Margins',
        desc: 'Optimize unit economics & defend healthy profit margins without losing volume.',
        icon: HiOutlineCurrencyDollar,
        highlight: 'Target: +18-25% Gross Margin',
        color: '#10B981',
    },
    {
        id: 'sales_velocity',
        title: 'Accelerate Sales & Volume',
        desc: 'Capture peak market demand, boost organic rankings, and ramp order counts.',
        icon: HiOutlineTrendingUp,
        highlight: 'Target: High Sales Velocity',
        color: '#6366F1',
    },
    {
        id: 'clear_inventory',
        title: 'Liquidate Excess / Aging Stock',
        desc: 'Swiftly clear overstocked SKUs before warehouse holding fees accumulate.',
        icon: HiOutlineCube,
        highlight: 'Target: Reduce Holding Days',
        color: '#F59E0B',
    },
    {
        id: 'competitor_defense',
        title: 'Win Buy Box & Track Competitors',
        desc: 'Stay ahead of aggressive discounters with real-time price monitoring and undercutting.',
        icon: HiOutlineShieldCheck,
        highlight: 'Target: 95%+ Buy Box Win Rate',
        color: '#06B6D4',
    },
    {
        id: 'price_testing',
        title: 'AI Price Elasticity & A/B Testing',
        desc: 'Algorithmically discover maximum willingness-to-pay using live elasticity tests.',
        icon: HiOutlineScale,
        highlight: 'Target: Optimal Price Frontier',
        color: '#EC4899',
    },
];

const PRICING_STRATEGIES = [
    {
        id: 'undercut_1',
        name: 'Smart Undercut (1-2%)',
        tagline: 'Aggressive Volume Capture',
        desc: 'Automated 1-2% discount below the cheapest verified competitor to win the Buy Box.',
        badge: 'Most Popular',
    },
    {
        id: 'match_lowest',
        name: 'Price Parity Matching',
        tagline: 'Equal Market Ground',
        desc: 'Match the lowest rival price exactly to avoid destructive price wars while preserving rank.',
        badge: 'Balanced',
    },
    {
        id: 'premium_5',
        name: 'Premium Positioning (+5%)',
        tagline: 'Brand Equity & Margin',
        desc: 'Maintain a 5% price premium to reinforce perceived quality and maximize per-unit gross profits.',
        badge: 'High Margin',
    },
];

const CATALOG_SIZES = [
    { id: '1_50', label: '1 - 50 SKUs', subtitle: 'Focused / Boutique Catalog' },
    { id: '51_500', label: '51 - 500 SKUs', subtitle: 'Growing Brand' },
    { id: '501_2500', label: '501 - 2,500 SKUs', subtitle: 'Mid-Market Omnichannel' },
    { id: '2500_plus', label: '2,500+ SKUs', subtitle: 'Enterprise Scale Catalog' },
];

const STORE_NICHES = [
    { value: 'electronics', label: 'Electronics & Gadgets' },
    { value: 'fashion', label: 'Fashion & Apparel' },
    { value: 'beauty', label: 'Beauty & Personal Care' },
    { value: 'groceries', label: 'Groceries & Gourmet' },
    { value: 'fitness', label: 'Fitness & Sports' },
    { value: 'home', label: 'Home, Decor & Furniture' },
    { value: 'jewelry', label: 'Jewelry & Accessories' },
    { value: 'automotive', label: 'Automotive & Parts' },
    { value: 'books', label: 'Books & Stationery' },
    { value: 'pharmacy', label: 'Health & Pharmacy' },
    { value: 'pet', label: 'Pet Supplies' },
    { value: 'general', label: 'General / Multi-Category' },
];

export default function Onboarding() {
    const { user, completeOnboarding } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const logo = theme === 'dark' ? newDarkLogo : newLightLogo;

    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [calibrating, setCalibrating] = useState(false);
    const [calibrationPhase, setCalibrationPhase] = useState(0);

    // Form State
    const [selectedChannels, setSelectedChannels] = useState(['amazon', 'shopify']);
    const [selectedGoals, setSelectedGoals] = useState(['profit', 'competitor_defense']);
    const [pricingStrategy, setPricingStrategy] = useState(user?.preferences?.pricingStrategy || 'undercut_1');
    const [targetMarginFloor, setTargetMarginFloor] = useState(user?.preferences?.minMarginFloor || 20);
    const [automationLevel, setAutomationLevel] = useState('semi_auto');
    const [catalogSize, setCatalogSize] = useState('51_500');
    const [industryNiche, setIndustryNiche] = useState(user?.storeType || 'general');

    const toggleChannel = (id) => {
        setSelectedChannels((prev) =>
            prev.includes(id) ? (prev.length > 1 ? prev.filter((c) => c !== id) : prev) : [...prev, id]
        );
    };

    const toggleGoal = (id) => {
        setSelectedGoals((prev) =>
            prev.includes(id) ? (prev.length > 1 ? prev.filter((g) => g !== id) : prev) : [...prev, id]
        );
    };

    const handleSkip = async () => {
        try {
            setSubmitting(true);
            await completeOnboarding({
                skipped: true,
                channels: selectedChannels,
                goals: selectedGoals,
                pricingStrategy: 'undercut_1',
                automationLevel: 'semi_auto',
                catalogSize: '51_500',
                industryNiche: user?.storeType || 'general',
                targetMarginFloor: 20,
            });
            toast.success('Welcome aboard! Default settings applied.');
            navigate('/dashboard');
        } catch (err) {
            console.error('Skip error:', err);
            toast.error(err.response?.data?.message || 'Failed to finish onboarding');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinish = async () => {
        setSubmitting(true);
        setCalibrating(true);

        // Sequence of visual calibration phases
        const phaseInterval = setInterval(() => {
            setCalibrationPhase((prev) => {
                if (prev >= 3) {
                    clearInterval(phaseInterval);
                    return 3;
                }
                return prev + 1;
            });
        }, 700);

        try {
            await completeOnboarding({
                channels: selectedChannels,
                goals: selectedGoals,
                pricingStrategy,
                automationLevel,
                catalogSize,
                industryNiche,
                targetMarginFloor: Number(targetMarginFloor),
                skipped: false,
            });

            setTimeout(() => {
                clearInterval(phaseInterval);
                toast.success('AI Pricing Pilot calibrated successfully!');
                navigate('/dashboard');
            }, 3200);
        } catch (err) {
            clearInterval(phaseInterval);
            setCalibrating(false);
            setSubmitting(false);
            toast.error(err.response?.data?.message || 'Failed to save setup');
        }
    };

    const nextStep = () => {
        if (step === 1 && selectedChannels.length === 0) {
            toast.error('Please select at least one sales channel');
            return;
        }
        if (step === 2 && selectedGoals.length === 0) {
            toast.error('Please select at least one primary business goal');
            return;
        }
        setStep((s) => Math.min(s + 1, 4));
    };

    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    return (
        <div className="min-h-screen bg-surface auth-bg text-text p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Orbs */}
            <div className="orb orb-1 opacity-70" />
            <div className="orb orb-2 opacity-60" />
            <div className="orb orb-3 opacity-50" />

            {/* Top Navigation Bar */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-6 z-20">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="PricePilot AI" className="w-9 h-9 object-contain" />
                    <div>
                        <div className="font-extrabold text-sm tracking-tight text-text">PricePilot AI</div>
                        <div className="text-[10px] text-text-muted">Personalized Seller Onboarding</div>
                    </div>
                </div>

                {!calibrating && (
                    <button
                        onClick={handleSkip}
                        disabled={submitting}
                        className="text-xs text-text-muted hover:text-text px-3 py-1.5 rounded-lg border border-border/80 bg-surface-light/60 hover:bg-surface-lighter backdrop-blur-sm transition-all cursor-pointer"
                    >
                        Skip for now →
                    </button>
                )}
            </div>

            {/* Main Modal Card */}
            <div className="w-full max-w-4xl glass-card rounded-3xl p-6 sm:p-10 border border-border/80 shadow-2xl relative z-10 animate-slide-up backdrop-blur-xl">
                {/* CALIBRATION LOADING SCREEN */}
                {calibrating ? (
                    <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-8 animate-fade-in">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping opacity-30" />
                            <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-accent border-b-transparent border-l-transparent animate-spin" />
                            <HiOutlineSparkles className="w-10 h-10 text-primary animate-pulse" />
                        </div>

                        <div className="space-y-2 max-w-md">
                            <h2 className="text-2xl font-black text-text tracking-tight">
                                Calibrating Your AI Pricing Engine...
                            </h2>
                            <p className="text-xs text-text-muted">
                                Personalizing algorithmic models and market signals for{' '}
                                <span className="text-primary font-semibold">{user?.storeName || 'your store'}</span>.
                            </p>
                        </div>

                        {/* Animated Step Checklist */}
                        <div className="w-full max-w-md bg-surface/70 border border-border/60 rounded-2xl p-5 text-left space-y-3 shadow-inner">
                            <div className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${calibrationPhase >= 0 ? 'opacity-100' : 'opacity-30'}`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${calibrationPhase > 0 ? 'bg-success text-white' : 'bg-primary/20 text-primary animate-pulse'}`}>
                                    {calibrationPhase > 0 ? <HiOutlineCheck className="w-3.5 h-3.5" /> : '1'}
                                </div>
                                <span className="font-medium text-text">
                                    Mapping {selectedChannels.map((c) => c.toUpperCase()).join(', ')} channels...
                                </span>
                            </div>

                            <div className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${calibrationPhase >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${calibrationPhase > 1 ? 'bg-success text-white' : 'bg-primary/20 text-primary animate-pulse'}`}>
                                    {calibrationPhase > 1 ? <HiOutlineCheck className="w-3.5 h-3.5" /> : '2'}
                                </div>
                                <span className="font-medium text-text">
                                    Configuring {pricingStrategy.replace('_', ' ').toUpperCase()} strategy rules...
                                </span>
                            </div>

                            <div className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${calibrationPhase >= 2 ? 'opacity-100' : 'opacity-30'}`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${calibrationPhase > 2 ? 'bg-success text-white' : 'bg-primary/20 text-primary animate-pulse'}`}>
                                    {calibrationPhase > 2 ? <HiOutlineCheck className="w-3.5 h-3.5" /> : '3'}
                                </div>
                                <span className="font-medium text-text">
                                    Setting {targetMarginFloor}% profit margin floor & safety guardrails...
                                </span>
                            </div>

                            <div className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${calibrationPhase >= 3 ? 'opacity-100 text-success' : 'opacity-30'}`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${calibrationPhase >= 3 ? 'bg-success text-white' : 'bg-primary/20 text-primary'}`}>
                                    {calibrationPhase >= 3 ? <HiOutlineCheck className="w-3.5 h-3.5" /> : '4'}
                                </div>
                                <span className="font-bold">
                                    AI Engine ready. Entering Mission Control!
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Stepper Progress Header */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
                                <span>Step {step} of 4</span>
                                <span>
                                    {step === 1 && 'Where do you sell?'}
                                    {step === 2 && 'What is your primary goal?'}
                                    {step === 3 && 'Pricing rules & automation'}
                                    {step === 4 && 'Scale & Category'}
                                </span>
                                <span className="text-primary font-bold">{step * 25}%</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 rounded-full"
                                    style={{ width: `${step * 25}%` }}
                                />
                            </div>
                        </div>

                        {/* STEP 1: SALES CHANNELS */}
                        {step === 1 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="text-center sm:text-left space-y-1">
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
                                        Where do you currently sell?
                                    </h2>
                                    <p className="text-sm text-text-muted">
                                        Select all the marketplaces and platforms where you operate. We will prioritize integration connectors for you.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                                    {SALES_CHANNELS.map((channel) => {
                                        const isSelected = selectedChannels.includes(channel.id);
                                        const Icon = channel.icon;
                                        return (
                                            <button
                                                key={channel.id}
                                                type="button"
                                                onClick={() => toggleChannel(channel.id)}
                                                className={`p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer relative group flex flex-col justify-between min-h-[110px] ${
                                                    isSelected
                                                        ? `${channel.activeBg} shadow-lg`
                                                        : `border-border/70 bg-surface-light/40 hover:bg-surface-light/80 ${channel.borderColor}`
                                                }`}
                                            >
                                                <div className="flex items-center justify-between w-full mb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-inner"
                                                            style={{ backgroundColor: `${channel.color}15`, color: channel.color }}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-bold text-sm text-text">{channel.name}</span>
                                                    </div>
                                                    <div
                                                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                                            isSelected ? 'bg-primary border-primary text-white' : 'border-border/80 bg-surface'
                                                        }`}
                                                    >
                                                        {isSelected && <HiOutlineCheck className="w-3.5 h-3.5" />}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-text-muted leading-tight">{channel.desc}</p>
                                                    <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-lighter text-text-muted">
                                                        {channel.badge}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: BUSINESS GOALS & AIMS */}
                        {step === 2 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="text-center sm:text-left space-y-1">
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
                                        What is your primary aim with PricePilot AI?
                                    </h2>
                                    <p className="text-sm text-text-muted">
                                        Select what matters most right now (choose one or more). Our algorithms will calibrate elasticity weightings to your goals.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                                    {PRIMARY_GOALS.map((goal) => {
                                        const isSelected = selectedGoals.includes(goal.id);
                                        const Icon = goal.icon;
                                        return (
                                            <button
                                                key={goal.id}
                                                type="button"
                                                onClick={() => toggleGoal(goal.id)}
                                                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex gap-3.5 ${
                                                    isSelected
                                                        ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-lg'
                                                        : 'border-border/70 bg-surface-light/40 hover:bg-surface-light/80 hover:border-border'
                                                }`}
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
                                                    style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1">
                                                        <h3 className="font-bold text-sm text-text truncate">{goal.title}</h3>
                                                        <div
                                                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                                                isSelected ? 'bg-primary border-primary text-white' : 'border-border bg-surface'
                                                            }`}
                                                        >
                                                            {isSelected && <HiOutlineCheck className="w-3 h-3" />}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-text-muted mb-2 leading-relaxed">{goal.desc}</p>
                                                    <span
                                                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block"
                                                        style={{ backgroundColor: `${goal.color}15`, color: goal.color }}
                                                    >
                                                        {goal.highlight}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* STEP 3: PRICING STRATEGY & AUTOMATION */}
                        {step === 3 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="text-center sm:text-left space-y-1">
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
                                        Pricing Rules & Autonomy
                                    </h2>
                                    <p className="text-sm text-text-muted">
                                        Configure how aggressively PricePilot AI reprices your SKUs and set your safety guardrails.
                                    </p>
                                </div>

                                {/* Strategy Selection */}
                                <div className="space-y-2.5">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                                        Default Repricing Algorithm
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {PRICING_STRATEGIES.map((strat) => {
                                            const isSelected = pricingStrategy === strat.id;
                                            return (
                                                <button
                                                    key={strat.id}
                                                    type="button"
                                                    onClick={() => setPricingStrategy(strat.id)}
                                                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                                        isSelected
                                                            ? 'bg-primary/15 border-primary ring-2 ring-primary/25 shadow-lg'
                                                            : 'border-border/70 bg-surface-light/40 hover:bg-surface-light/80 hover:border-border'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="font-bold text-xs text-text">{strat.name}</span>
                                                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                                                                {strat.badge}
                                                            </span>
                                                        </div>
                                                        <div className="text-[11px] font-medium text-accent mb-1">{strat.tagline}</div>
                                                        <p className="text-[11px] text-text-muted leading-tight">{strat.desc}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Safety Floor Slider & Automation Level */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    {/* Profit Margin Floor */}
                                    <div className="p-4 rounded-2xl bg-surface-light/40 border border-border/70 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <HiOutlineShieldCheck className="w-4 h-4 text-emerald-400" />
                                                <span className="text-xs font-bold text-text">Minimum Profit Margin Floor</span>
                                            </div>
                                            <span className="text-sm font-extrabold text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-400/10">
                                                {targetMarginFloor}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="5"
                                            max="50"
                                            step="1"
                                            value={targetMarginFloor}
                                            onChange={(e) => setTargetMarginFloor(e.target.value)}
                                            className="w-full accent-emerald-400 cursor-pointer h-2 bg-surface-lighter rounded-lg"
                                        />
                                        <p className="text-[11px] text-text-muted">
                                            AI will NEVER suggest or publish prices that dip below this profit margin threshold.
                                        </p>
                                    </div>

                                    {/* Automation Level */}
                                    <div className="p-4 rounded-2xl bg-surface-light/40 border border-border/70 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <HiOutlineAdjustments className="w-4 h-4 text-primary" />
                                            <span className="text-xs font-bold text-text">Automation Level</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { id: 'manual', label: 'Manual', desc: 'Review every change' },
                                                { id: 'semi_auto', label: 'Semi-Auto', desc: 'Auto if >90% conf' },
                                                { id: 'full_auto', label: 'Auto-Pilot', desc: 'Continuous sync' },
                                            ].map((lvl) => (
                                                <button
                                                    key={lvl.id}
                                                    type="button"
                                                    onClick={() => setAutomationLevel(lvl.id)}
                                                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                                        automationLevel === lvl.id
                                                            ? 'bg-primary text-white border-primary shadow'
                                                            : 'bg-surface border-border/60 text-text-muted hover:text-text'
                                                    }`}
                                                >
                                                    <div className="font-bold text-xs">{lvl.label}</div>
                                                    <div className="text-[9px] opacity-80 mt-0.5 truncate">{lvl.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[11px] text-text-muted">
                                            You can modify automation settings anytime inside your Settings tab.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: SCALE & STORE NICHE */}
                        {step === 4 && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="text-center sm:text-left space-y-1">
                                    <h2 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
                                        Catalog Scale & Industry Category
                                    </h2>
                                    <p className="text-sm text-text-muted">
                                        Help us benchmark your pricing trends against similar catalogs in your industry.
                                    </p>
                                </div>

                                {/* Catalog Size */}
                                <div className="space-y-2.5">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                                        Active SKU / Product Count
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {CATALOG_SIZES.map((size) => {
                                            const isSelected = catalogSize === size.id;
                                            return (
                                                <button
                                                    key={size.id}
                                                    type="button"
                                                    onClick={() => setCatalogSize(size.id)}
                                                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-primary/15 border-primary ring-2 ring-primary/25 shadow-lg'
                                                            : 'border-border/70 bg-surface-light/40 hover:bg-surface-light/80 hover:border-border'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-extrabold text-sm text-text">{size.label}</span>
                                                        {isSelected && <HiOutlineCheck className="w-4 h-4 text-primary" />}
                                                    </div>
                                                    <p className="text-xs text-text-muted">{size.subtitle}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Store Niche */}
                                <div className="space-y-2.5 pt-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
                                        Store Primary Industry / Niche
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <select
                                                className="input-field w-full py-3.5 px-4 rounded-xl text-sm"
                                                value={industryNiche}
                                                onChange={(e) => setIndustryNiche(e.target.value)}
                                            >
                                                {STORE_NICHES.map((niche) => (
                                                    <option key={niche.value} value={niche.value}>
                                                        {niche.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="p-3.5 rounded-xl bg-surface-light/40 border border-border/70 flex items-center gap-3">
                                            <HiOutlineChartBar className="w-6 h-6 text-accent flex-shrink-0" />
                                            <p className="text-xs text-text-muted">
                                                We continuously ingest competitor scrapers and demand elasticity data tailored to{' '}
                                                <span className="text-text font-semibold">
                                                    {STORE_NICHES.find((n) => n.value === industryNiche)?.label || 'your industry'}
                                                </span>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bottom Navigation Buttons */}
                        <div className="flex items-center justify-between pt-8 border-t border-border/60 mt-8">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="btn-secondary flex items-center gap-2 py-2.5 px-5 text-xs font-bold"
                                >
                                    <HiOutlineArrowLeft className="w-4 h-4" /> Back
                                </button>
                            ) : (
                                <div />
                            )}

                            {step < 4 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="btn-primary flex items-center gap-2 py-2.5 px-6 text-xs font-bold"
                                >
                                    Continue <HiOutlineArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleFinish}
                                    disabled={submitting}
                                    className="btn-primary flex items-center gap-2 py-3 px-8 text-sm font-extrabold shadow-xl shadow-primary/25 bg-gradient-to-r from-primary to-accent hover:opacity-95"
                                >
                                    <HiOutlineSparkles className="w-4 h-4" /> Complete Setup & Launch Pilot
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
