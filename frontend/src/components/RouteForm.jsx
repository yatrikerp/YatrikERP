import React from 'react';
import ModernRouteForm from './ModernRouteForm';

const RouteForm = ({ isOpen, onClose, route = null, mode = 'create' }) => {
  return (
    <ModernRouteForm 
      isOpen={isOpen} 
      onClose={onClose} 
      route={route} 
      mode={mode} 
    />
  );
};

export default RouteForm;