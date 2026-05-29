import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { easeOut } from './easings';

interface FadeInViewProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
}

export function FadeInView({ children, delay = 0, duration = 0.65, y = 14, className }: FadeInViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration, delay, ease: easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
