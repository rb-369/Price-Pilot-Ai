import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div;
const MotionSpan = motion.span;

export default function Animated404() {
    // Stage controller: 'bars' (0-0.7s) -> 'number' (0.7s+)
    const [isGraphStage, setIsGraphStage] = useState(true);

    useEffect(() => {
        // Transition from bars collapsing to 404 pop-up at 0.7 seconds
        const timer = setTimeout(() => {
            setIsGraphStage(false);
        }, 700);

        return () => clearTimeout(timer);
    }, []);

    // Radiating burst rays for state 4 (404 pop up)
    const burstRays = [
        { angle: '-rotate-45', position: '-top-3 -left-3 sm:-top-5 sm:-left-5' },
        { angle: '-rotate-15', position: '-top-5 left-1/4 sm:-top-8' },
        { angle: 'rotate-0', position: '-top-6 left-1/2 -translate-x-1/2 sm:-top-9' },
        { angle: 'rotate-15', position: '-top-5 right-1/4 sm:-top-8' },
        { angle: 'rotate-45', position: '-top-3 -right-3 sm:-top-5 sm:-right-5' },
        { angle: '-rotate-90', position: 'top-1/2 -left-6 -translate-y-1/2 sm:-left-9' },
        { angle: 'rotate-90', position: 'top-1/2 -right-6 -translate-y-1/2 sm:-right-9' },
    ];

    return (
        <div className="relative flex items-center justify-center w-full h-[130px] sm:h-[160px] md:h-[180px] select-none my-1">
            <AnimatePresence mode="wait">
                {isGraphStage ? (
                    /* ─── STAGE 1, 2, 3: 3-BAR GRAPH ANIMATION (0.7 SEC DURATION) ─── */
                    <MotionDiv
                        key="bars-container"
                        className="relative flex items-end justify-center gap-3 sm:gap-4 h-[110px] sm:h-[135px] w-full max-w-[200px]"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.08 } }}
                    >
                        {/* Floating Spark Accents around bars */}
                        <MotionSpan
                            className="absolute -left-2 top-7 w-1 h-3 rounded-full bg-[#0a192f] dark:bg-blue-400 -rotate-12 pointer-events-none"
                            animate={{
                                opacity: [0.3, 0.9, 0.4, 0.8, 0],
                                y: [0, -3, 1, -2, 4],
                            }}
                            transition={{ duration: 0.68, ease: 'easeInOut' }}
                        />
                        <MotionSpan
                            className="absolute -right-2 top-11 w-1 h-3.5 rounded-full bg-[#1d4ed8] dark:bg-sky-400 rotate-25 pointer-events-none"
                            animate={{
                                opacity: [0.4, 0.8, 0.3, 0.7, 0],
                                y: [0, -2, 2, -1, 3],
                            }}
                            transition={{ duration: 0.68, ease: 'easeInOut' }}
                        />
                        <MotionSpan
                            className="absolute top-1 left-[46%] w-1.5 h-1.5 rounded-full bg-[#1e3a8a] dark:bg-blue-300 pointer-events-none"
                            animate={{
                                opacity: [0.2, 0.8, 0.3, 0.6, 0],
                                scale: [0.8, 1.2, 0.9, 1.1, 0],
                            }}
                            transition={{ duration: 0.68, ease: 'easeInOut' }}
                        />

                        {/* Bar 1 (Left - Navy Blue) */}
                        <div className="flex flex-col items-center justify-end h-full">
                            <MotionDiv
                                className="w-6 sm:w-8 rounded-t-xl rounded-b-md bg-gradient-to-t from-[#050b14] via-[#0a192f] to-[#1e293b] dark:from-[#020617] dark:via-[#0f172a] dark:to-[#1e3a8a] shadow-sm"
                                initial={{ height: 45 }}
                                animate={{
                                    height: [45, 80, 55, 75, 12, 0],
                                    opacity: [1, 1, 1, 1, 0.8, 0],
                                }}
                                transition={{
                                    duration: 0.68,
                                    times: [0, 0.28, 0.55, 0.78, 0.92, 1],
                                    ease: 'easeInOut',
                                }}
                            />
                        </div>

                        {/* Bar 2 (Middle - Tallest Dark Blue) */}
                        <div className="flex flex-col items-center justify-end h-full">
                            <MotionDiv
                                className="w-6 sm:w-8 rounded-t-xl rounded-b-md bg-gradient-to-t from-[#0f2744] via-[#1e3a8a] to-[#2563eb] dark:from-[#0a192f] dark:via-[#1e40af] dark:to-[#3b82f6] shadow-sm"
                                initial={{ height: 75 }}
                                animate={{
                                    height: [75, 115, 85, 125, 16, 0],
                                    opacity: [1, 1, 1, 1, 0.8, 0],
                                }}
                                transition={{
                                    duration: 0.68,
                                    times: [0, 0.28, 0.55, 0.78, 0.92, 1],
                                    ease: 'easeInOut',
                                }}
                            />
                        </div>

                        {/* Bar 3 (Right - Bit Dark Blue) */}
                        <div className="flex flex-col items-center justify-end h-full">
                            <MotionDiv
                                className="w-6 sm:w-8 rounded-t-xl rounded-b-md bg-gradient-to-t from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] dark:from-[#1d4ed8] dark:via-[#3b82f6] dark:to-[#60a5fa] shadow-sm"
                                initial={{ height: 50 }}
                                animate={{
                                    height: [50, 32, 68, 48, 10, 0],
                                    opacity: [1, 1, 1, 1, 0.8, 0],
                                }}
                                transition={{
                                    duration: 0.68,
                                    times: [0, 0.28, 0.55, 0.78, 0.92, 1],
                                    ease: 'easeInOut',
                                }}
                            />
                        </div>
                    </MotionDiv>
                ) : (
                    /* ─── STAGE 4 & 5: 404 POPS UP AND SETTLES INTO STATIC STATE ─── */
                    <MotionDiv
                        key="number-container"
                        className="relative inline-flex items-center justify-center"
                        initial={{ scale: 0.6, opacity: 0, y: 16 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{
                            type: 'spring',
                            damping: 15,
                            stiffness: 260,
                            mass: 0.7,
                        }}
                    >
                        {/* Radiating Accent Burst Rays */}
                        {burstRays.map((ray, idx) => (
                            <MotionSpan
                                key={idx}
                                className={`absolute ${ray.position} ${ray.angle} w-1 h-3 sm:h-4 rounded-full bg-blue-900/80 dark:bg-blue-400/90 pointer-events-none origin-bottom`}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: [0, 1.25, 0],
                                    opacity: [0, 0.9, 0],
                                }}
                                transition={{
                                    duration: 0.4,
                                    delay: 0.02,
                                    ease: 'easeOut',
                                }}
                            />
                        ))}

                        {/* 404 Text - Pops up and remains static */}
                        <h1 className="text-8xl sm:text-9xl md:text-[140px] font-black tracking-tight leading-none text-slate-900 dark:text-white select-none">
                            404
                        </h1>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
}
