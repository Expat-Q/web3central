import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Inbox } from 'lucide-react';

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4'
  };

  return (
    <div
      className={`${sizeClasses[size]} border-indigo-200 border-t-indigo-600 rounded-full animate-spin ${className}`}
    />
  );
}

export function LoadingState({
  message = 'Loading...',
  fullScreen = false,
  className = ''
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
    >
      <LoadingSpinner size="md" />
      <p className="text-gray-500 text-lg">{message}</p>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        {content}
      </div>
    );
  }

  return content;
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
  retryLabel = 'Try Again',
  fullScreen = false,
  className = ''
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center gap-4 text-center ${className}`}
    >
      <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">Error</h3>
        <p className="text-gray-500 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {retryLabel}
        </button>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        {content}
      </div>
    );
  }

  return content;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No results found',
  description = '',
  action,
  className = ''
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center gap-4 py-16 text-center ${className}`}
    >
      <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-gray-500 max-w-md">{description}</p>}
      </div>
      {action}
    </motion.div>
  );
}

export function DataStateWrapper({
  isLoading,
  isError,
  error,
  isEmpty,
  onRetry,
  loadingMessage,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  fullScreen = false,
  children
}) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} fullScreen={fullScreen} />;
  }

  if (isError) {
    return <ErrorState message={error} onRetry={onRetry} fullScreen={fullScreen} />;
  }

  if (isEmpty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return children;
}
