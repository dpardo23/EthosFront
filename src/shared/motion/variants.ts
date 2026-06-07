import { easeOut } from './easings';

/**
 * Reusable Framer Motion animation variant presets (fadeUp, fadeIn, staggerContainer) used across landing and dashboard pages.
 */
export const fadeUpView = (delay = 0, duration = 0.65) => ({
  initial: { opacity: 0, y: 14 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true as const },
  transition: { duration, delay, ease: easeOut },
});

export const fadeUp = (delay = 0, duration = 0.65) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration, delay, ease: easeOut },
});

export const slideUpView = (delay = 0, duration = 0.78) => ({
  initial: { y: '105%', opacity: 0 },
  whileInView: { y: 0, opacity: 1 },
  viewport: { once: true as const },
  transition: { duration, delay, ease: easeOut },
});

export const slideLeftView = (delay = 0, duration = 0.75) => ({
  initial: { opacity: 0, x: -28 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true as const },
  transition: { duration, delay, ease: easeOut },
});

export const slideRightView = (delay = 0, duration = 0.75) => ({
  initial: { opacity: 0, x: 28 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true as const },
  transition: { duration, delay, ease: easeOut },
});

export const scaleUpView = (delay = 0, duration = 0.8) => ({
  initial: { opacity: 0, scale: 0.92 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true as const },
  transition: { duration, delay, ease: easeOut },
});

export const fadeView = (delay = 0, duration = 0.5) => ({
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true as const },
  transition: { duration, delay },
});
