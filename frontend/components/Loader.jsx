import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ fullPage = false }) => {
  return (
    <div
      className={[
        'flex items-center justify-center',
        fullPage ? 'fixed inset-0 z-50 bg-[rgba(244,239,232,0.78)] backdrop-blur-xl' : 'p-8',
      ].join(' ')}
    >
      <div className="glass-card px-6 py-5 flex items-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          className="relative h-11 w-11 rounded-2xl bg-button shadow-[0_14px_28px_rgba(31,41,55,0.14)]"
        >
          <div className="absolute inset-[3px] rounded-[13px] bg-surface/90" />
          <div className="absolute inset-[10px] rounded-lg bg-button/75" />
        </motion.div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] font-extrabold text-muted">Loading</p>
          <p className="text-sm font-semibold text-ink/80">Preparing your campus workspace.</p>
        </div>
      </div>
    </div>
  );
};

export default Loader;
