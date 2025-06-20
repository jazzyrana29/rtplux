"use client"

import type { Variants } from "framer-motion"

// Page transition animations
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
}

export const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4,
}

// Card animations
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 15,
    },
  },
}

// Button animations
export const buttonVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      type: "spring",
      stiffness: 600,
      damping: 15,
    },
  },
}

// Casino-specific animations
export const chipVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
    rotate: -180,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
  hover: {
    scale: 1.1,
    rotate: 5,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
  tap: {
    scale: 0.9,
    rotate: -5,
  },
  selected: {
    scale: 1.15,
    boxShadow: "0 0 20px rgba(0, 255, 0, 0.6)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15,
    },
  },
}

// Roulette wheel animation
export const wheelVariants: Variants = {
  idle: {
    rotate: 0,
  },
  spinning: {
    rotate: 1800, // 5 full rotations
    transition: {
      duration: 3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

// Modal animations
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      duration: 0.2,
    },
  },
}

export const overlayVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
}

// Text animations
export const textVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
}

// Stagger animations for lists
export const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

// Floating animation for decorative elements
export const floatingVariants: Variants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
}

// Pulse animation for notifications
export const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
}

// Slide animations
export const slideVariants: Variants = {
  slideInLeft: {
    x: -100,
    opacity: 0,
  },
  slideInRight: {
    x: 100,
    opacity: 0,
  },
  slideInUp: {
    y: 100,
    opacity: 0,
  },
  slideInDown: {
    y: -100,
    opacity: 0,
  },
  center: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
}

// Game result animations
export const resultVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
    rotate: -180,
  },
  win: {
    opacity: 1,
    scale: [1, 1.2, 1],
    rotate: 0,
    color: "#00ff00",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
      scale: {
        times: [0, 0.5, 1],
        duration: 0.8,
      },
    },
  },
  lose: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    color: "#ff4444",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
}

// Loading animations
export const loadingVariants: Variants = {
  loading: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Number.POSITIVE_INFINITY,
      ease: "linear",
    },
  },
}

// Confetti animation
export const confettiVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
    y: -100,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
  fall: {
    y: 500,
    rotate: 720,
    opacity: 0,
    transition: {
      duration: 2,
      ease: "easeIn",
    },
  },
}
