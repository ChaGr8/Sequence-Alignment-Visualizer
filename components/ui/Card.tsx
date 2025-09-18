
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-light-card dark:bg-dark-card shadow-lg rounded-xl p-6 transition-colors duration-300 ${className}`}>
      {title && <h3 className="text-xl font-bold mb-4 text-light-text dark:text-dark-text">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
