/**
 * Shared easing curves and spring configs for consistent animation feel across the application.
 */
export const easeOut = [0.16, 1, 0.3, 1] as const;
export const easeIn = [0.43, 0, 0.57, 1] as const;
export const easeInOut = [0.45, 0, 0.55, 1] as const;

export const springConfig = { stiffness: 38, damping: 18, mass: 1.2 } as const;
export const springSnappy = { stiffness: 260, damping: 20 } as const;
