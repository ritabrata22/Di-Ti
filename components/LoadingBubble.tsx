"use strict";

import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingBubble() {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: [-4, 4, -4] }
  };

  return (
    <div className="flex justify-start mb-6">
      <div className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl rounded-tl-none p-4 max-w-[85%] md:max-w-[70%] shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="text-xs font-medium text-zinc-400 mr-1 animate-pulse">Ahead AI is thinking</div>
          <div className="flex space-x-1 items-center h-4">
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                variants={dotVariants}
                initial="initial"
                animate="animate"
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.15
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}