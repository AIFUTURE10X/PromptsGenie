import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../ui/button';

interface ToolLayoutProps {
  // Header
  title: string;
  description?: string;
  icon?: string;
  onBack?: () => void;

  // Actions
  actions?: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryActions?: ReactNode;

  // Content
  children: ReactNode;

  // Footer
  footer?: ReactNode;

  // Layout options
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  headerSticky?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-full',
};

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  title,
  description,
  icon,
  onBack,
  actions,
  primaryAction,
  secondaryActions,
  children,
  footer,
  maxWidth = '2xl',
  headerSticky = false,
}) => {
  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gray-900/50 border-b border-gray-700 ${headerSticky ? 'sticky top-0 z-10 backdrop-blur-sm' : ''}`}
      >
        <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-6`}>
          {/* Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <svg
                className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Tools</span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Title Section */}
            <div className="flex items-start gap-4">
              {icon && <div className="text-4xl">{icon}</div>}
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
                {description && (
                  <p className="text-gray-400 text-sm sm:text-base max-w-2xl">{description}</p>
                )}
              </div>
            </div>

            {/* Actions Section */}
            <div className="flex items-center gap-3">
              {/* Secondary Actions */}
              {secondaryActions}

              {/* Custom Actions */}
              {actions}

              {/* Primary Action */}
              {primaryAction && (
                <Button
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled || primaryAction.loading}
                  className="bg-brand-accent hover:bg-brand-accent/90 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {primaryAction.loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      {primaryAction.label}
                    </span>
                  ) : (
                    primaryAction.label
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>

      {/* Footer */}
      {footer && (
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8`}>
            {footer}
          </div>
        </div>
      )}
    </div>
  );
};
