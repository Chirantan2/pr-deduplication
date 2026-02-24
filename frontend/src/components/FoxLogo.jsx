import React from 'react';

const FoxLogo = ({ className = "h-8 w-8" }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ears */}
        <polygon points="15,10 30,40 5,45" fill="#E87D2F" />
        <polygon points="85,10 70,40 95,45" fill="#E87D2F" />
        <polygon points="20,18 28,38 10,42" fill="#F5A623" />
        <polygon points="80,18 72,38 90,42" fill="#F5A623" />

        {/* Head */}
        <ellipse cx="50" cy="55" rx="38" ry="35" fill="#E87D2F" />

        {/* Face mask */}
        <ellipse cx="50" cy="62" rx="26" ry="24" fill="#F5D6B8" />

        {/* Eyes */}
        <ellipse cx="37" cy="50" rx="5" ry="6" fill="#2D2D2D" />
        <ellipse cx="63" cy="50" rx="5" ry="6" fill="#2D2D2D" />
        <ellipse cx="38.5" cy="48.5" rx="2" ry="2.5" fill="#FFFFFF" />
        <ellipse cx="64.5" cy="48.5" rx="2" ry="2.5" fill="#FFFFFF" />

        {/* Nose */}
        <ellipse cx="50" cy="62" rx="5" ry="3.5" fill="#2D2D2D" />

        {/* Mouth line */}
        <path d="M50 65.5 L46 70" stroke="#2D2D2D" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M50 65.5 L54 70" stroke="#2D2D2D" strokeWidth="1.5" strokeLinecap="round" />

        {/* Cheek tufts */}
        <path d="M16 55 Q25 65 32 72" stroke="#E87D2F" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M84 55 Q75 65 68 72" stroke="#E87D2F" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
);

export default FoxLogo;
