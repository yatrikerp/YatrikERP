import { FaBus } from 'react-icons/fa';

const Logo = ({ size = 'default', className = '' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  const textSizes = {
    small: 'text-sm',
    default: 'text-lg',
    large: 'text-xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg shadow-lg">
        <FaBus className={`${sizeClasses[size]} text-white`} />
      </div>
      <span className={`font-bold text-gray-900 tracking-wide ${textSizes[size]}`}>
        YATRIK ERP
      </span>
    </div>
  );
};

export default Logo; 