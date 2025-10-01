import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import heroBusImage from '../assets/hero-bus.png';

const MobileHeroWithImage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);

  const handleBookNow = () => {
    if (!user) {
      navigate('/login?next=/passenger/mobile');
      return;
    }
    navigate('/passenger/mobile');
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div style={{
      position: 'relative',
      background: `linear-gradient(135deg, rgba(233, 30, 99, 0.85) 0%, rgba(236, 64, 122, 0.85) 100%), url(${heroBusImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat',
      color: 'white',
      padding: '40px 20px',
      textAlign: 'center',
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    }}>
      {/* Overlay Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        opacity: 0.6
      }} />

      {/* Bus Icon Overlay */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255,255,255,0.3)'
      }}>
        <Bus size={30} color="white" />
      </div>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        maxWidth: '100%'
      }}>
        {/* Hero Bus Image */}
        <div style={{
          width: '120px',
          height: '120px',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          backdropFilter: 'blur(15px)',
          border: '3px solid rgba(255,255,255,0.3)',
          boxShadow: '0 8px 32px rgba(255,255,255,0.1)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <img 
            src={heroBusImage} 
            alt="YATRIK Bus Fleet" 
            onError={handleImageError}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '16px',
              filter: 'brightness(1.1) contrast(1.1)',
              display: imageError ? 'none' : 'block'
            }}
          />
          {imageError && (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '16px'
            }}>
              <Bus size={48} color="white" />
            </div>
          )}
        </div>

        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '16px',
          lineHeight: '1.1',
          textShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>
          Travel Smart, Travel Safe
        </h1>
        
        <p style={{
          fontSize: '18px',
          opacity: 0.95,
          marginBottom: '24px',
          lineHeight: '1.5',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          maxWidth: '90%',
          margin: '0 auto 24px'
        }}>
          Book your bus tickets with YATRIK ERP - Your trusted travel partner
        </p>
        
        {/* Rating */}
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center',
          marginBottom: '32px',
          alignItems: 'center'
        }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={18} color="#fbbf24" fill="#fbbf24" />
          ))}
          <span style={{ 
            fontSize: '16px', 
            marginLeft: '8px', 
            opacity: 0.95,
            textShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}>
            4.8/5 Rating
          </span>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleBookNow}
          style={{
            padding: '16px 32px',
            borderRadius: '50px',
            background: 'linear-gradient(135deg, #00ACC1 0%, #00838F 100%)',
            color: 'white',
            border: 'none',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 8px 25px rgba(0, 172, 193, 0.4)',
            transition: 'all 0.3s ease',
            margin: '0 auto',
            minWidth: '200px'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 12px 30px rgba(0, 172, 193, 0.5)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 25px rgba(0, 172, 193, 0.4)';
          }}
        >
          <Bus size={20} />
          Book Your Journey
        </button>
      </div>
    </div>
  );
};

export default MobileHeroWithImage;
