/**
 * Dropdown: Reusable select dropdown component
 * 
 * Props:
 * @param {Array} options - Array of { value, label } objects
 * @param {string|number} value - Currently selected value
 * @param {function} onChange - Selection change handler
 * @param {string} placeholder - Default placeholder text
 * @param {string} className - Additional Tailwind classes
 */
export default function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  className = '',
  ...props
}) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className={`
        w-full px-4 py-2 rounded
        bg-gray-800 text-gray-100
        border-2 border-blue-700
        hover:border-red-500
        focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50
        cursor-pointer
        transition-colors duration-200
        ${className}
      `}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
