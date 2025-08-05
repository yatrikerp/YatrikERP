import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import Features from '../components/Features';
import TripPlanner from '../components/TripPlanner';
import LiveTracker from '../components/LiveTracker';
import NewsCard from '../components/NewsCard';
import Footer from '../components/Footer';


function LandingPage() {
  return (
    <>
      <Header />
      <HeroSection />
      <Features />
      <TripPlanner />
      <LiveTracker />
      <NewsCard />
      <Footer />
    </>
  );
}

export default LandingPage;
