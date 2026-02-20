import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  isLoading: boolean;
  text?: string;
  subtitle?: string;
  onComplete?: () => void;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  isLoading, 
  text = "Chargement...", 
  subtitle = "Veuillez patienter",
  onComplete 
}) => {
  const [isVisible, setIsVisible] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
    } else {
      // Délai pour l'animation de fade-out
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`page-loader ${!isLoading ? 'fade-out' : ''}`}>
      <div className="loader-content">
        <div className="loader-spinner"></div>
        <div className="loader-text">{text}</div>
        <div className="loader-subtitle">{subtitle}</div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 