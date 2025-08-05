import React from 'react';
import '../App.css';

function Header() {
  return (
    <header className="navbar">
      <div className="logo">🚌 YatrikERP</div>
      <nav>
        <a href="#planner">Planner</a>
        <a href="#features">Features</a>
        <a href="#login">Login</a>
        <button className="cta">Plan Your Trip</button>
      </nav>
    </header>
  );
}

export default Header;
