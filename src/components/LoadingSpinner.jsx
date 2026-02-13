function LoadingSpinner({ fullScreen = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const spinner = (
    <div className="relative">
      <div className={`animate-spin rounded-full border-4 border-gray-200 ${sizeClasses[size]}`}></div>
      <div className={`animate-spin rounded-full border-4 border-primary-600 border-t-transparent absolute top-0 left-0 ${sizeClasses[size]}`}></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-50">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {spinner}
    </div>
  );
}

export default LoadingSpinner;

