import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'admin' | 'app';
  rightElement?: React.ReactNode;
}

export const SearchInput: React.FC<SearchInputProps> = ({ 
  variant = 'admin', 
  className = '', 
  rightElement,
  ...props 
}) => {
  const isAdmin = variant === 'admin';

  return (
    <div className={`relative ${className}`}>
      <Search 
        className={`${isAdmin ? 'w-4 h-4 left-3' : 'w-5 h-5 left-4'} text-[#8A8A8E] absolute top-1/2 -translate-y-1/2`} 
      />
      <input 
        type="search"
        className={`w-full bg-white border border-[#E5E5EA] text-[#273a5a] font-medium outline-none focus:border-[#ef4523] focus:ring-1 focus:ring-[#ef4523]/20 transition-all placeholder:text-[#8A8A8E] ${
          isAdmin 
            ? 'h-9 pl-9 pr-3 rounded-md text-[13px] shadow-sm' 
            : 'h-[52px] pl-12 pr-4 rounded-xl text-[15px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
        } ${rightElement ? 'pr-12' : ''}`}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  );
};
