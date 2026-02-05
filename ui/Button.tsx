import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';
  isLoading?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon,
  className = '',
  disabled,
  size = 'md',
  ...props 
}) => {
  const baseStyles = "relative inline-flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed active:translate-x-[1px] active:translate-y-[1px] active:shadow-none uppercase tracking-widest text-[10px] sm:text-xs font-bold border-2";
  
  const sizes = {
    sm: "px-2 py-1",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-sm"
  };

  const variants = {
    primary: "bg-[#00ff66] text-[#000] border-[#000] shadow-[3px_3px_0px_0px_#166534] hover:bg-[#33ff85]",
    accent: "bg-[#00e5ff] text-[#000] border-[#000] shadow-[3px_3px_0px_0px_#007785] hover:bg-[#33eaff]",
    secondary: "bg-[#2a2a32] text-[#fff] border-[#000] shadow-[3px_3px_0px_0px_#141418] hover:bg-[#3f3f46]",
    danger: "bg-[#ff3d3d] text-[#fff] border-[#000] shadow-[3px_3px_0px_0px_#7f1d1d] hover:bg-[#ff5c5c]",
    ghost: "bg-transparent text-zinc-500 hover:text-white border-transparent hover:border-zinc-800"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : icon ? (
        <span className={children ? "mr-2" : ""}>{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;