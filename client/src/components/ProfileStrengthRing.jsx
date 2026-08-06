import { useEffect, useState } from 'react';

function ProfileStrengthRing({ percent }) {
    const [animatedPercent, setAnimatedPercent] = useState(0);
    const radius = 42;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        const timeout = setTimeout(() => setAnimatedPercent(percent), 100);
        return () => clearTimeout(timeout);
    }, [percent]);

    const offset = circumference - (animatedPercent / 100) * circumference;

    return (
        <div className="relative w-28 h-28 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#E7E5DD" strokeWidth="8" />
                <circle
                    cx="50" cy="50" r={radius} fill="none"
                    stroke="url(#strengthGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
                <defs>
                    <linearGradient id="strengthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0D9488" />
                        <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-xl font-semibold text-ink">{percent}%</span>
                <span className="text-[10px] text-[#9A9890]">complete</span>
            </div>
        </div>
    );
}

export default ProfileStrengthRing;