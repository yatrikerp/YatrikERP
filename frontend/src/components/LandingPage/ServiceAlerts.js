import React from 'react';
import { AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';

const ServiceAlerts = ({ alerts }) => {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'info':
        return <Info className="alert__icon alert__icon--info" />;
      case 'warning':
        return <AlertTriangle className="alert__icon alert__icon--warning" />;
      case 'success':
        return <CheckCircle className="alert__icon alert__icon--success" />;
      default:
        return <AlertCircle className="alert__icon alert__icon--default" />;
    }
  };

  return (
    <div className="service-alerts">
      <h3 className="service-alerts__title">Service Updates</h3>
      <div className="service-alerts__list">
        {alerts.map((alert, index) => (
          <div key={index} className={`alert alert--${alert.type}`}>
            <div className="alert__content">
              {getAlertIcon(alert.type)}
              <p className="alert__message">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceAlerts;
