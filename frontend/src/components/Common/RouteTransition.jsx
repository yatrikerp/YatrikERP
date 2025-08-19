import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const RouteTransition = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const location = useLocation();

  useEffect(() => {
    if (children !== displayChildren) {
      setIsTransitioning(true);
      
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setIsTransitioning(false);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [children, displayChildren]);

  return (
    <div className={`route-transition ${isTransitioning ? 'transitioning' : ''}`}>
      <div className={`${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} transition-all duration-200 ease-in-out`}>
        {displayChildren}
      </div>
    </div>
  );
};

export default RouteTransition;
