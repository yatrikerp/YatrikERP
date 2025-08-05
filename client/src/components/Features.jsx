import React from 'react';
import '../App.css';

function Features() {
  const items = [
    '📍 Real-time GPS Tracking',
    '📲 QR-based Ticketing',
    '🗺️ Route Planner Integration',
    '📋 Admin & Crew Dashboards',
  ];
  return (
    <section className="features">
      <h2>Why Travel With Yatrik?</h2>
      <ul>
        {items.map((feature, idx) => (
          <li key={idx}>{feature}</li>
        ))}
      </ul>
    </section>
  );
}

export default Features;
