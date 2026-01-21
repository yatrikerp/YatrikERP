/**
 * YATRIK Quick Help - Main Component
 * Zero-latency in-app assistant
 * Floating button + chat panel
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { matchIntent } from './chatbot/matcher';
import { getResponse } from './chatbot/responses';
import cache from './chatbot/cache';
import { apiFetch } from '../../utils/api';
import { Sparkles, X, Send } from 'lucide-react';
import './chatbot/styles.css';

const WELCOME_MESSAGE_GUEST = "Hi 👋 I'm Yatrik Quick Help!\n\nI can help you with:\n• How to book tickets\n• Finding buses & routes\n• Bus timings\n• Getting started\n\nLogin to unlock more features!";
const WELCOME_MESSAGE_USER = "Hi 👋 I'm Yatrik Quick Help.\nAsk me about booking, seats, routes, or live buses.";

export default function YatrikQuickHelp() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [locationRequested, setLocationRequested] = useState(false);
  
  // Drag state
  const [position, setPosition] = useState({ top: 24, right: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const buttonRef = useRef(null);

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('yatrikBotPosition');
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        setPosition(pos);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem('yatrikBotPosition', JSON.stringify(position));
  }, [position]);

  // Initialize welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMsg = user ? WELCOME_MESSAGE_USER : WELCOME_MESSAGE_GUEST;
      setMessages([{
        type: 'assistant',
        text: welcomeMsg,
        timestamp: Date.now()
      }]);
    }
  }, [isOpen, messages.length, user]);

  // Preload data on login
  useEffect(() => {
    if (user && user.role) {
      // Preload data in background (non-blocking)
      cache.preloadData(user.role, apiFetch).catch(() => {
        // Silently fail - cache will use localStorage fallback
      });
    }

    // Request location permission once (works for guests too)
    if (!locationRequested && 'geolocation' in navigator) {
      setLocationRequested(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          cache.setUserLocation(
            position.coords.latitude,
            position.coords.longitude
          );
        },
        () => {
          // User denied or error - ignore silently
        },
        { timeout: 5000, maximumAge: 300000 } // Cache for 5 min
      );
    }
  }, [user, locationRequested]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /**
   * Handle user message - INSTANT response
   */
  const handleSend = useCallback((messageText) => {
    const text = messageText.trim();
    if (!text) return;

    // Add user message
    const userMessage = {
      type: 'user',
      text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // INSTANT response - no delay, no loading
    const intent = matchIntent(text);
    const responseText = getResponse(intent, user?.role, text);

    // Add assistant response immediately
    setTimeout(() => {
      setMessages(prev => [...prev, {
        type: 'assistant',
        text: responseText,
        timestamp: Date.now()
      }]);
    }, 0); // Zero delay - instant response
  }, [user]);

  /**
   * Handle quick suggestion click
   */
  const handleSuggestionClick = useCallback((suggestion) => {
    handleSend(suggestion.text);
  }, [handleSend]);

  /**
   * Toggle panel
   */
  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  /**
   * Close panel
   */
  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Handle Enter key
   */
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }, [input, handleSend]);

  /**
   * Handle drag start
   */
  const handleMouseDown = useCallback((e) => {
    setHasMoved(false);
    setIsDragging(true);
    setDragStart({
      x: e.clientX - (window.innerWidth - position.right),
      y: e.clientY - position.top
    });
    e.preventDefault();
    e.stopPropagation();
  }, [position]);

  /**
   * Handle drag move and end
   */
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setHasMoved(true);
        const newRight = window.innerWidth - (e.clientX - dragStart.x);
        const newTop = e.clientY - dragStart.y;
        
        // Constrain to viewport
        const constrainedRight = Math.max(0, Math.min(newRight, window.innerWidth - 48));
        const constrainedTop = Math.max(0, Math.min(newTop, window.innerHeight - 48));
        
        setPosition({
          top: constrainedTop,
          right: constrainedRight
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Reset hasMoved after a short delay to allow click handler to check it
      setTimeout(() => setHasMoved(false), 0);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, dragStart]);

  // Quick suggestions (different for guests vs logged in)
  const quickSuggestions = user ? [
    { text: 'How to book seat?', intent: 'BOOK_SEAT' },
    { text: 'Bus timing', intent: 'BUS_TIMING' },
    { text: 'Track my bus', intent: 'LIVE_TRACK' },
    { text: 'My location', intent: 'USER_LOCATION' },
  ] : [
    { text: 'How to book seat?', intent: 'BOOK_SEAT' },
    { text: 'How to login?', intent: 'LOGIN' },
    { text: 'Bus timing', intent: 'BUS_TIMING' },
    { text: 'Getting started', intent: 'DEFAULT' },
  ];

  // Render for both guests and logged-in users
  // No early return - show on landing page too

  return (
    <>
      {/* Floating Button */}
      <button
        ref={buttonRef}
        className={`yatrik-quick-help-btn ${!isOpen ? 'pulse' : ''} ${isDragging ? 'dragging' : ''}`}
        onClick={(e) => {
          // Don't toggle if we dragged (only toggle on click without drag)
          if (!hasMoved && !isDragging) {
            togglePanel();
          }
        }}
        onMouseDown={handleMouseDown}
        aria-label="Quick Help"
        title="Quick Help - Drag to move"
        style={{
          top: `${position.top}px`,
          right: `${position.right}px`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      >
        <span className="yatrik-robot-icon">🤖</span>
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div 
          className="yatrik-quick-help-panel"
          style={{
            top: `${position.top + 64}px`,
            right: `${position.right}px`
          }}
        >
          {/* Header */}
          <div className="yatrik-quick-help-header">
            <h3>Yatrik Quick Help</h3>
            <button
              className="yatrik-quick-help-close"
              onClick={closePanel}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="yatrik-quick-help-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`yatrik-quick-help-message ${msg.type}`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length <= 1 && (
            <div className="yatrik-quick-help-suggestions">
              {quickSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  className="yatrik-quick-help-suggestion"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="yatrik-quick-help-input-area">
            <input
              ref={inputRef}
              type="text"
              className="yatrik-quick-help-input"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="yatrik-quick-help-send"
              onClick={() => handleSend(input)}
              disabled={!input.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
