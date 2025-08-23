import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bus, Search, Calendar, Navigation, MessageSquare, X } from 'lucide-react';

const FloatingActionButton = ({ onActionClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      id: 'search',
      label: 'Search Trips',
      icon: <Search className="w-5 h-5" />,
      color: 'from-blue-500 to-blue-600',
      delay: 0.1
    },
    {
      id: 'bookings',
      label: 'My Bookings',
      icon: <Calendar className="w-5 h-5" />,
      color: 'from-green-500 to-green-600',
      delay: 0.2
    },
    {
      id: 'tracking',
      label: 'Live Track',
      icon: <Navigation className="w-5 h-5" />,
      color: 'from-purple-500 to-purple-600',
      delay: 0.3
    },
    {
      id: 'support',
      label: 'Support',
      icon: <MessageSquare className="w-5 h-5" />,
      color: 'from-orange-500 to-orange-600',
      delay: 0.4
    }
  ];

  const mainButtonVariants = {
    initial: { scale: 1, rotate: 0 },
    hover: { scale: 1.1, rotate: 0 },
    tap: { scale: 0.95, rotate: 0 },
    open: { scale: 1, rotate: 45 }
  };

  const actionButtonVariants = {
    initial: { scale: 0, opacity: 0, y: 20 },
    animate: (i) => ({
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }),
    exit: (i) => ({
      scale: 0,
      opacity: 0,
      y: 20,
      transition: {
        delay: i * 0.05,
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    })
  };

  const handleActionClick = (actionId) => {
    onActionClick(actionId);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Action Buttons */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-20 right-0 space-y-3">
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                custom={index}
                variants={actionButtonVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex items-center space-x-3"
              >
                {/* Action Label */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                  className="bg-white px-4 py-2 rounded-full shadow-lg border border-gray-200 whitespace-nowrap"
                >
                  <span className="text-sm font-medium text-gray-700">{action.label}</span>
                </motion.div>

                {/* Action Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleActionClick(action.id)}
                  className={`w-14 h-14 rounded-full bg-gradient-to-r ${action.color} 
                    text-white shadow-lg hover:shadow-xl transition-all duration-200
                    flex items-center justify-center group`}
                >
                  {action.icon}
                  <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-200" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        variants={mainButtonVariants}
        initial="initial"
        animate={isOpen ? "open" : "initial"}
        whileHover="hover"
        whileTap="tap"
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 
          text-white shadow-2xl hover:shadow-3xl transition-all duration-300
          flex items-center justify-center group relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
        
        {/* Icon */}
        <div className="relative z-10">
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </div>

        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white opacity-20"
          initial={{ scale: 0 }}
          animate={{ scale: isOpen ? 1.5 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingActionButton;
