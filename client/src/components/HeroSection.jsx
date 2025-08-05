import React from 'react';
import '../App.css';

function HeroSection() {
  return (
    <section className="hero">
      <h1>Kerala’s Trusted Smart Transport Companion</h1>
      <p>Track your bus, book tickets, and plan your route — stress-free!</p>
      <div className="hero-buttons">
        <button>Start Planning</button>
        <button>View Active Buses</button>
      </div>
    </section>
  );
}

export default HeroSection;
