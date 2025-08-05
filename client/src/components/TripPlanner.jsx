import React from 'react';
import '../App.css';

function TripPlanner() {
  return (
    <section id="planner" className="trip-planner">
      <h2>Smart Kerala Trip Planner</h2>
      <form>
        <input type="text" placeholder="Start Point" />
        <input type="text" placeholder="Destination" />
        <button type="submit">Calculate Fare & Route</button>
      </form>
    </section>
  );
}

export default TripPlanner;
