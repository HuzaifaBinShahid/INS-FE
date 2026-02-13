function Card({ children, className = '', hover = false, padding = 'md' }) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClass = hover ? 'hover:shadow-lg transition-shadow duration-300' : '';

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${paddingClasses[padding]} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
}

export default Card;

