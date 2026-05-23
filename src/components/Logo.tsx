import React from 'react';
import { motion } from 'motion/react';

export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Background Glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute inset-0 bg-brand-blue/30 blur-xl rounded-full"
      />
      
      {/* SVG Logo */}
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full"
      >
        {/* Main Math Symbol / M Shape */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d="M20 80V20L50 50L80 20V80"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        />
        
        {/* Abstract "Derivative" / Dot */}
        <motion.circle
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, duration: 0.5, type: "spring" }}
          cx="80"
          cy="80"
          r="8"
          fill="currentColor"
          className="text-brand-blue"
        />

        {/* Floating Accent Line */}
        <motion.path
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          d="M30 15H70"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className="text-brand-blue"
        />
      </svg>
    </div>
  );
};
