/**
 * Button: Reusable mystical button component
 * 
 * Props:
 * @param {string} children - Button text
 * @param {function} onClick - Click handler
 * @param {string} variant - 'primary' | 'secondary' | 'danger' (default: primary)
 * @param {boolean} disabled - Disable button
 * @param {string} className - Additional Tailwind classes
 */
export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  ...props
}) {
  const baseClasses =
    'px-6 py-2 rounded font-semibold transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-red-600 text-white hover:bg-red-500 active:scale-95',
    secondary: 'border-2 border-gray-200 text-gray-200 hover:bg-gray-200 hover:text-gray-900',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-95',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
