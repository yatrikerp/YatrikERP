import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useHashSection = () => {
  const location = useLocation();
  const [section, setSection] = useState('');

  useEffect(() => {
    // Extract section from hash (e.g., #contact -> 'contact')
    const hash = location.hash.replace('#', '');
    setSection(hash);
  }, [location.hash]);

  const updateSection = (newSection) => {
    setSection(newSection);
    // Update URL hash without triggering navigation
    window.history.replaceState(null, null, `#${newSection}`);
  };

  return { section, setSection: updateSection };
};
