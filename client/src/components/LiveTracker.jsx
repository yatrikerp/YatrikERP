import React from 'react';
import '../App.css';

function LiveTracker() {
  return (
    <section className="live-tracker">
      <h2>Live Bus Tracker</h2>
      <iframe
        title="Map"
        src="https://www.google.com/maps/embed?..."
        width="100%"
        height="300"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
      ></iframe>
    </section>
  );
}

export default LiveTracker;
