'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface DiscoveryProgressProps {
  niche: string | null;
  pillarName: string;
}

export function DiscoveryProgress({ niche, pillarName }: DiscoveryProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 rounded-full border-2 border-[#8a00c4]/30 border-t-[#8a00c4] flex items-center justify-center"
      >
        <Search size={20} className="text-[#c084fc]" />
      </motion.div>

      <div className="text-center space-y-2">
        <p className="text-[#d4d4d4] font-mono text-sm">
          Searching {niche || 'your niche'} content for{' '}
          <span className="text-[#c084fc] font-bold">{pillarName}</span>...
        </p>
        <motion.div
          className="flex justify-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#8a00c4]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </motion.div>
      </div>

      <p className="text-[#4a4a4a] text-xs font-mono">Analyzing sources across Google News, Reddit, and Twitter</p>
    </div>
  );
}
