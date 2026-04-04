import type { Variants } from 'framer-motion'

export const fadeSlideUp: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] } },
}

export const staggerContainer: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
}

export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0, 0, 0.2, 1] } },
}

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -4, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
}

export const sheetVariants: Variants = {
  hidden:  { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 350, damping: 35 } },
  exit:    { x: '100%', opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
}

export const overlayVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
}

export const modalVariants: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit:    { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
}
