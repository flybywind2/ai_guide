import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hover = false,
}) => {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${
        hover ? 'hover:border-primary-300 hover:shadow-md cursor-pointer' : ''
      } transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
