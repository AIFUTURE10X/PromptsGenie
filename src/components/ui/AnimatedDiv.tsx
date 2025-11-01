import React, { useState, useEffect } from 'react';

interface AnimatedDivProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  type?: 'fade' | 'slide' | 'scale' | 'fade-slide';
}

/**
 * Lightweight animation component to replace Framer Motion for simple animations
 * Reduces bundle size by ~30KB when used instead of Framer Motion
 *
 * Supports fade, slide, scale, and combined animations
 */
export const AnimatedDiv: React.FC<AnimatedDivProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 300,
  type = 'fade-slide',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Animation type classes
  const getAnimationClasses = () => {
    const baseClasses = `transition-all ease-out`;
    const durationClass = `duration-[${duration}ms]`;

    if (!isVisible) {
      switch (type) {
        case 'fade':
          return `${baseClasses} ${durationClass} opacity-0`;
        case 'slide':
          return `${baseClasses} ${durationClass} translate-y-4`;
        case 'scale':
          return `${baseClasses} ${durationClass} scale-95 opacity-0`;
        case 'fade-slide':
        default:
          return `${baseClasses} ${durationClass} opacity-0 translate-y-4`;
      }
    }

    switch (type) {
      case 'fade':
        return `${baseClasses} ${durationClass} opacity-100`;
      case 'slide':
        return `${baseClasses} ${durationClass} translate-y-0`;
      case 'scale':
        return `${baseClasses} ${durationClass} scale-100 opacity-100`;
      case 'fade-slide':
      default:
        return `${baseClasses} ${durationClass} opacity-100 translate-y-0`;
    }
  };

  return (
    <div className={`${getAnimationClasses()} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Staggered animation container for lists
 * Automatically adds delays to children
 */
interface AnimatedListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
  type?: 'fade' | 'slide' | 'scale' | 'fade-slide';
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  className = '',
  staggerDelay = 50,
  type = 'fade-slide',
}) => {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <AnimatedDiv
          key={index}
          delay={index * staggerDelay}
          type={type}
          className={className}
        >
          {child}
        </AnimatedDiv>
      ))}
    </>
  );
};
