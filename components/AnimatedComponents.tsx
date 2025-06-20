"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { View, Text, Pressable } from "react-native"
import {
  buttonVariants,
  cardVariants,
  chipVariants,
  modalVariants,
  overlayVariants,
  textVariants,
  pulseVariants,
  floatingVariants,
} from "../lib/animations"

// Animated View wrapper
export const AnimatedView = motion(View)
export const AnimatedText = motion(Text)
export const AnimatedPressable = motion(Pressable)

// Animated Button Component
interface AnimatedButtonProps {
  children: React.ReactNode
  onPress?: () => void
  variant?: "primary" | "secondary" | "danger" | "success"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  className?: string
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-casino-gold text-casino-primary"
      case "secondary":
        return "bg-casino-secondary text-white border border-casino-accent"
      case "danger":
        return "bg-red-600 text-white"
      case "success":
        return "bg-green-600 text-white"
      default:
        return "bg-casino-gold text-casino-primary"
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "py-2 px-4 text-sm"
      case "md":
        return "py-3 px-6 text-base"
      case "lg":
        return "py-4 px-8 text-lg"
      default:
        return "py-3 px-6 text-base"
    }
  }

  return (
    <AnimatedPressable
      variants={buttonVariants}
      initial="idle"
      whileHover={!disabled ? "hover" : "idle"}
      whileTap={!disabled ? "tap" : "idle"}
      onPress={disabled ? undefined : onPress}
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        font-bold rounded-lg shadow-lg
        ${disabled ? "opacity-50" : ""}
        ${className}
      `}
      style={{
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <AnimatedText variants={textVariants} initial="hidden" animate="visible" className="text-center font-bold">
        {children}
      </AnimatedText>
    </AnimatedPressable>
  )
}

// Animated Card Component
interface AnimatedCardProps {
  children: React.ReactNode
  onPress?: () => void
  className?: string
  delay?: number
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({ children, onPress, className = "", delay = 0 }) => {
  return (
    <AnimatedPressable
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      transition={{ delay }}
      onPress={onPress}
      className={`
        bg-casino-secondary rounded-xl p-4 shadow-xl border border-casino-accent
        ${className}
      `}
    >
      {children}
    </AnimatedPressable>
  )
}

// Animated Chip Component
interface AnimatedChipProps {
  value: number
  selected?: boolean
  onPress?: () => void
  className?: string
  delay?: number
}

export const AnimatedChip: React.FC<AnimatedChipProps> = ({
  value,
  selected = false,
  onPress,
  className = "",
  delay = 0,
}) => {
  return (
    <AnimatedPressable
      variants={chipVariants}
      initial="hidden"
      animate={selected ? "selected" : "visible"}
      whileHover="hover"
      whileTap="tap"
      transition={{ delay }}
      onPress={onPress}
      className={`
        w-16 h-16 rounded-full border-4 border-yellow-400
        flex items-center justify-center
        ${selected ? "bg-green-500" : "bg-casino-gold"}
        ${className}
      `}
    >
      <AnimatedText variants={textVariants} className="text-casino-primary font-bold text-lg">
        ${value}
      </AnimatedText>
    </AnimatedPressable>
  )
}

// Animated Modal Component
interface AnimatedModalProps {
  isVisible: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({ isVisible, onClose, children, title }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <AnimatedView
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black bg-opacity-60 z-40"
            onTouchEnd={onClose}
          />

          {/* Modal */}
          <AnimatedView
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-4 bg-casino-secondary rounded-xl border-2 border-casino-gold z-50 p-6"
          >
            {title && (
              <AnimatedText
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="text-2xl font-bold text-casino-gold mb-4 text-center"
              >
                {title}
              </AnimatedText>
            )}

            <AnimatedView className="flex-1">{children}</AnimatedView>

            <AnimatedButton variant="danger" onPress={onClose} className="mt-4">
              Close
            </AnimatedButton>
          </AnimatedView>
        </>
      )}
    </AnimatePresence>
  )
}

// Animated Text with typewriter effect
interface TypewriterTextProps {
  text: string
  delay?: number
  speed?: number
  className?: string
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({ text, delay = 0, speed = 50, className = "" }) => {
  const [displayText, setDisplayText] = React.useState("")

  React.useEffect(() => {
    const timer = setTimeout(() => {
      let i = 0
      const interval = setInterval(() => {
        setDisplayText(text.slice(0, i + 1))
        i++
        if (i >= text.length) {
          clearInterval(interval)
        }
      }, speed)

      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(timer)
  }, [text, delay, speed])

  return (
    <AnimatedText variants={textVariants} initial="hidden" animate="visible" className={className}>
      {displayText}
    </AnimatedText>
  )
}

// Floating Animation Component
interface FloatingElementProps {
  children: React.ReactNode
  className?: string
}

export const FloatingElement: React.FC<FloatingElementProps> = ({ children, className = "" }) => {
  return (
    <AnimatedView variants={floatingVariants} animate="animate" className={className}>
      {children}
    </AnimatedView>
  )
}

// Pulsing Element Component
interface PulsingElementProps {
  children: React.ReactNode
  className?: string
}

export const PulsingElement: React.FC<PulsingElementProps> = ({ children, className = "" }) => {
  return (
    <AnimatedView variants={pulseVariants} animate="pulse" className={className}>
      {children}
    </AnimatedView>
  )
}

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: number
  color?: string
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 40, color = "#ffd700", className = "" }) => {
  return (
    <AnimatedView
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Number.POSITIVE_INFINITY,
        ease: "linear",
      }}
      className={`border-4 border-gray-300 border-t-4 rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        borderTopColor: color,
      }}
    />
  )
}
