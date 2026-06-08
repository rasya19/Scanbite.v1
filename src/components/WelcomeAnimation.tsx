import { motion } from 'motion/react';
import React from 'react';
import { Coffee } from 'lucide-react';

interface WelcomeAnimationProps {
  onComplete: () => void;
}

export default function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#FDFBF7] p-6 text-center"
      onAnimationComplete={onComplete}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <div className="w-20 h-20 bg-[#8C6239] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <Coffee className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-black text-[#1C1612] tracking-tighter">Selamat Datang!</h1>
        <p className="text-sm text-[#786455] mt-3 font-medium tracking-wide">Nikmati kemudahan pesan mandiri di meja Anda.</p>
      </motion.div>
    </motion.div>
  );
}
