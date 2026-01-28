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
      className={`glass-card p-6 ${
        hover ? 'hover:shadow-lg cursor-pointer transform hover:-translate-y-1' : ''
      } transition-all duration-300 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
