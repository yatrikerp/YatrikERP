import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, RefreshCw, Map as MapIcon, Navigation, DollarSign } from "lucide-react";
import { toast } from 'react-hot-toast';
import { apiFetch } from '../../utils/api';
// SimpleMapRouteCreator removed; using RouteMapEditor (Google Maps) instead
import RouteMapEditor from '../../components/RouteMapEditor';
import ConductorPricingDashboard from '../../components/ConductorPricingDashboard';

const StreamlinedRouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [depots, setDepots] = useState([]);
  const [stops, setStops] = useState([]);
  const [farePolicies, setFarePolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [depotFilter, setDepotFilter] = useState('all');
  
  // Form states
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showSingleAddModal, setShowSingleAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showStopManager, setShowStopManager] = useState(false);
  const [showMapRouteModal, setShowMapRouteModal] = useState(false);
  const [showFareMatrixModal, setShowFareMatrixModal] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isQuickActionsMinimized, setIsQuickActionsMinimized] = useState(false);
  
  // Bulk operations
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [bulkOperation, setBulkOperation] = useState('');
  
  // Kerala Auto Route Generation
  const [showKeralaAutoModal, setShowKeralaAutoModal] = useState(false);
  const [showKeralaRoutesModal, setShowKeralaRoutesModal] = useState(false);
  const [showRouteDetailsModal, setShowRouteDetailsModal] = useState(false);
  const [showRouteMapEditor, setShowRouteMapEditor] = useState(false);
  const [showConductorPricing, setShowConductorPricing] = useState(false);
  const [routeForm, setRouteForm] = useState({
    routeNumber: '',
    routeName: '',
    startingPoint: { city: '', location: '', coordinates: { latitude: 0, longitude: 0 } },
    endingPoint: { city: '', location: '', coordinates: { latitude: 0, longitude: 0 } },
    totalDistance: 0,
    estimatedDuration: 0,
    depot: { depotId: '', name: '' },
    busType: 'City / Ordinary',
    baseFare: 0,
    farePerKm: 0,
    status: 'active',
    features: [],
    notes: '',
    intermediateStops: []
  });
  const [keralaAutoForm, setKeralaAutoForm] = useState({
    depotId: '',
    routeType: 'intercity',
    busTypes: ['ordinary', 'fast_passenger', 'ac'],
    farePerKm: 2.5,
    baseFare: 10,
    timeSlots: ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
    daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    generateTrips: true,
    autoAssignBuses: true,
    autoAssignCrew: true,
    // Safe defaults used in KeralaAutoRouteModal rendering logic
    selectedDepots: [],
    depotConfigs: {},
    defaultBusTypes: []
  });

  // Kerala Routes Data
  const [keralaRoutesData] = useState({
    'Thiruvalla Depot': [
      { from: 'Thiruvalla', to: 'Pathanamthitta', distance: 18, duration: 30, type: 'intercity' },
      { from: 'Thiruvalla', to: 'Kottayam', distance: 27, duration: 45, type: 'intercity' },
      { from: 'Thiruvalla', to: 'Alappuzha', distance: 32, duration: 60, type: 'intercity' },
      { from: 'Thiruvalla', to: 'Kollam', distance: 54, duration: 90, type: 'intercity' },
      { from: 'Thiruvalla', to: 'Kochi', distance: 85, duration: 135, type: 'intercity' }
    ],
    'Sulthan Bathery Depot': [
      { from: 'Sulthan Bathery', to: 'Mananthavady', distance: 35, duration: 60, type: 'intercity' },
      { from: 'Sulthan Bathery', to: 'Kalpetta', distance: 19, duration: 35, type: 'intercity' },
      { from: 'Sulthan Bathery', to: 'Kozhikode', distance: 98, duration: 180, type: 'intercity' },
      { from: 'Sulthan Bathery', to: 'Mysuru', distance: 120, duration: 210, type: 'interstate' },
      { from: 'Sulthan Bathery', to: 'Bengaluru', distance: 285, duration: 420, type: 'interstate' }
    ],
    'Pathanamthitta Depot': [
      { from: 'Pathanamthitta', to: 'Thiruvalla', distance: 18, duration: 30, type: 'intercity' },
      { from: 'Pathanamthitta', to: 'Chengannur', distance: 32, duration: 50, type: 'intercity' },
      { from: 'Pathanamthitta', to: 'Erumely', distance: 42, duration: 75, type: 'intercity' },
      { from: 'Pathanamthitta', to: 'Kottayam', distance: 45, duration: 75, type: 'intercity' },
      { from: 'Pathanamthitta', to: 'Sabarimala', distance: 65, duration: 120, type: 'seasonal' }
    ],
    'Palakkad Depot': [
      { from: 'Palakkad', to: 'Thrissur', distance: 79, duration: 135, type: 'intercity' },
      { from: 'Palakkad', to: 'Coimbatore', distance: 55, duration: 90, type: 'interstate' },
      { from: 'Palakkad', to: 'Kozhikode', distance: 155, duration: 270, type: 'intercity' },
      { from: 'Palakkad', to: 'Mannarkkad', distance: 45, duration: 75, type: 'intercity' },
      { from: 'Palakkad', to: 'Shornur', distance: 25, duration: 40, type: 'intercity' }
    ],
    'Kottayam Depot': [
      { from: 'Kottayam', to: 'Pala', distance: 32, duration: 55, type: 'intercity' },
      { from: 'Kottayam', to: 'Ernakulam', distance: 65, duration: 105, type: 'intercity' },
      { from: 'Kottayam', to: 'Alappuzha', distance: 45, duration: 75, type: 'intercity' },
      { from: 'Kottayam', to: 'Thiruvalla', distance: 27, duration: 45, type: 'intercity' },
      { from: 'Kottayam', to: 'Kumily', distance: 114, duration: 210, type: 'hill_station' }
    ],
    'Kozhikode Depot': [
      { from: 'Kozhikode', to: 'Kannur', distance: 92, duration: 150, type: 'intercity' },
      { from: 'Kozhikode', to: 'Kalpetta', distance: 73, duration: 135, type: 'intercity' },
      { from: 'Kozhikode', to: 'Thrissur', distance: 142, duration: 240, type: 'intercity' },
      { from: 'Kozhikode', to: 'Malappuram', distance: 55, duration: 90, type: 'intercity' },
      { from: 'Kozhikode', to: 'Bengaluru', distance: 385, duration: 600, type: 'interstate' },
      { from: 'Kozhikode', to: 'Mysuru', distance: 225, duration: 360, type: 'interstate' },
      { from: 'Kozhikode', to: 'Mangalore', distance: 185, duration: 300, type: 'interstate' },
      { from: 'Kozhikode', to: 'Chennai', distance: 685, duration: 1020, type: 'interstate' },
      { from: 'Kozhikode', to: 'Kochi', distance: 195, duration: 330, type: 'intercity' },
      { from: 'Kozhikode', to: 'Thiruvananthapuram', distance: 425, duration: 660, type: 'intercity' },
      { from: 'Kozhikode', to: 'Kollam', distance: 365, duration: 570, type: 'intercity' },
      { from: 'Kozhikode', to: 'Kottayam', distance: 235, duration: 390, type: 'intercity' },
      { from: 'Kozhikode', to: 'Alappuzha', distance: 285, duration: 450, type: 'intercity' },
      { from: 'Kozhikode', to: 'Palakkad', distance: 155, duration: 270, type: 'intercity' }
    ],
    'Ernakulam Depot': [
      { from: 'Ernakulam', to: 'Thrissur', distance: 74, duration: 120, type: 'intercity' },
      { from: 'Ernakulam', to: 'Kottayam', distance: 65, duration: 105, type: 'intercity' },
      { from: 'Ernakulam', to: 'Alappuzha', distance: 53, duration: 85, type: 'intercity' },
      { from: 'Ernakulam', to: 'Kozhikode', distance: 195, duration: 330, type: 'intercity' },
      { from: 'Ernakulam', to: 'Munnar', distance: 130, duration: 240, type: 'hill_station' },
      { from: 'Ernakulam', to: 'Bengaluru', distance: 485, duration: 720, type: 'interstate' },
      { from: 'Ernakulam', to: 'Chennai', distance: 685, duration: 1020, type: 'interstate' },
      { from: 'Ernakulam', to: 'Mysuru', distance: 325, duration: 480, type: 'interstate' },
      { from: 'Ernakulam', to: 'Coimbatore', distance: 185, duration: 300, type: 'interstate' },
      { from: 'Ernakulam', to: 'Madurai', distance: 285, duration: 420, type: 'interstate' },
      { from: 'Ernakulam', to: 'Thiruvananthapuram', distance: 225, duration: 360, type: 'intercity' },
      { from: 'Ernakulam', to: 'Kollam', distance: 165, duration: 270, type: 'intercity' },
      { from: 'Ernakulam', to: 'Palakkad', distance: 125, duration: 210, type: 'intercity' },
      { from: 'Ernakulam', to: 'Thiruvalla', distance: 95, duration: 150, type: 'intercity' },
      { from: 'Ernakulam', to: 'Pathanamthitta', distance: 115, duration: 180, type: 'intercity' }
    ],
    'Kollam Depot': [
      { from: 'Kollam', to: 'Thiruvananthapuram', distance: 71, duration: 120, type: 'intercity' },
      { from: 'Kollam', to: 'Alappuzha', distance: 85, duration: 135, type: 'intercity' },
      { from: 'Kollam', to: 'Pathanamthitta', distance: 55, duration: 90, type: 'intercity' },
      { from: 'Kollam', to: 'Punalur', distance: 45, duration: 75, type: 'intercity' },
      { from: 'Kollam', to: 'Kottarakkara', distance: 23, duration: 40, type: 'intercity' },
      { from: 'Kollam', to: 'Chennai', distance: 785, duration: 1200, type: 'interstate' },
      { from: 'Kollam', to: 'Bengaluru', distance: 585, duration: 900, type: 'interstate' },
      { from: 'Kollam', to: 'Ernakulam', distance: 165, duration: 270, type: 'intercity' },
      { from: 'Kollam', to: 'Kottayam', distance: 125, duration: 210, type: 'intercity' },
      { from: 'Kollam', to: 'Thiruvalla', distance: 95, duration: 150, type: 'intercity' },
      { from: 'Kollam', to: 'Kozhikode', distance: 365, duration: 570, type: 'intercity' },
      { from: 'Kollam', to: 'Kannur', distance: 455, duration: 720, type: 'intercity' },
      { from: 'Kollam', to: 'Thrissur', distance: 195, duration: 330, type: 'intercity' }
    ],
    'Kannur Depot': [
      { from: 'Kannur', to: 'Thalassery', distance: 22, duration: 35, type: 'intercity' },
      { from: 'Kannur', to: 'Kozhikode', distance: 92, duration: 150, type: 'intercity' },
      { from: 'Kannur', to: 'Kasaragod', distance: 52, duration: 85, type: 'intercity' },
      { from: 'Kannur', to: 'Mangalore', distance: 135, duration: 240, type: 'interstate' },
      { from: 'Kannur', to: 'Payyannur', distance: 35, duration: 55, type: 'intercity' },
      { from: 'Kannur', to: 'Bengaluru', distance: 445, duration: 660, type: 'interstate' },
      { from: 'Kannur', to: 'Mysuru', distance: 285, duration: 420, type: 'interstate' },
      { from: 'Kannur', to: 'Goa', distance: 385, duration: 600, type: 'interstate' },
      { from: 'Kannur', to: 'Udupi', distance: 165, duration: 270, type: 'interstate' },
      { from: 'Kannur', to: 'Manipal', distance: 155, duration: 240, type: 'interstate' },
      { from: 'Kannur', to: 'Kochi', distance: 265, duration: 420, type: 'intercity' },
      { from: 'Kannur', to: 'Thiruvananthapuram', distance: 485, duration: 780, type: 'intercity' },
      { from: 'Kannur', to: 'Kollam', distance: 455, duration: 720, type: 'intercity' },
      { from: 'Kannur', to: 'Thrissur', distance: 225, duration: 360, type: 'intercity' }
    ],
    'Alappuzha Depot': [
      { from: 'Alappuzha', to: 'Ernakulam', distance: 53, duration: 85, type: 'intercity' },
      { from: 'Alappuzha', to: 'Kottayam', distance: 45, duration: 75, type: 'intercity' },
      { from: 'Alappuzha', to: 'Kollam', distance: 85, duration: 135, type: 'intercity' },
      { from: 'Alappuzha', to: 'Thiruvalla', distance: 32, duration: 60, type: 'intercity' },
      { from: 'Alappuzha', to: 'Cherthala', distance: 25, duration: 40, type: 'intercity' }
    ],
    'Kasargod Depot': [
      { from: 'Kasaragod', to: 'Kannur', distance: 52, duration: 85, type: 'intercity' },
      { from: 'Kasaragod', to: 'Mangalore', distance: 85, duration: 150, type: 'interstate' },
      { from: 'Kasaragod', to: 'Kanhangad', distance: 18, duration: 30, type: 'intercity' },
      { from: 'Kasaragod', to: 'Payyannur', distance: 25, duration: 40, type: 'intercity' },
      { from: 'Kasaragod', to: 'Bekal', distance: 12, duration: 20, type: 'intercity' },
      { from: 'Kasaragod', to: 'Bangalore', distance: 380, duration: 540, type: 'interstate' },
      { from: 'Kasaragod', to: 'Mysuru', distance: 195, duration: 300, type: 'interstate' },
      { from: 'Kasaragod', to: 'Udupi', distance: 65, duration: 120, type: 'interstate' },
      { from: 'Kasaragod', to: 'Manipal', distance: 55, duration: 100, type: 'interstate' },
      { from: 'Kasaragod', to: 'Goa', distance: 285, duration: 420, type: 'interstate' },
      { from: 'Kasaragod', to: 'Kochi', distance: 185, duration: 300, type: 'intercity' },
      { from: 'Kasaragod', to: 'Kozhikode', distance: 145, duration: 240, type: 'intercity' },
      { from: 'Kasaragod', to: 'Thiruvananthapuram', distance: 485, duration: 720, type: 'intercity' },
      { from: 'Kasaragod', to: 'Kollam', distance: 420, duration: 630, type: 'intercity' }
    ],
    'Pala Depot': [
      { from: 'Pala', to: 'Kottayam', distance: 32, duration: 55, type: 'intercity' },
      { from: 'Pala', to: 'Erattupetta', distance: 15, duration: 25, type: 'intercity' },
      { from: 'Pala', to: 'Thodupuzha', distance: 45, duration: 75, type: 'intercity' },
      { from: 'Pala', to: 'Vagamon', distance: 42, duration: 90, type: 'hill_station' },
      { from: 'Pala', to: 'Kumily', distance: 85, duration: 150, type: 'hill_station' }
    ],
    'Cherthala Depot': [
      { from: 'Cherthala', to: 'Alappuzha', distance: 25, duration: 40, type: 'intercity' },
      { from: 'Cherthala', to: 'Kochi', distance: 42, duration: 65, type: 'intercity' },
      { from: 'Cherthala', to: 'Kottayam', distance: 65, duration: 105, type: 'intercity' },
      { from: 'Cherthala', to: 'Thiruvalla', distance: 55, duration: 90, type: 'intercity' },
      { from: 'Cherthala', to: 'Changanassery', distance: 45, duration: 75, type: 'intercity' }
    ],
    'Attingal Depot': [
      { from: 'Attingal', to: 'Thiruvananthapuram', distance: 36, duration: 60, type: 'intercity' },
      { from: 'Attingal', to: 'Kollam', distance: 45, duration: 75, type: 'intercity' },
      { from: 'Attingal', to: 'Varkala', distance: 18, duration: 30, type: 'intercity' },
      { from: 'Attingal', to: 'Nedumangad', distance: 25, duration: 40, type: 'intercity' },
      { from: 'Attingal', to: 'Kottarakkara', distance: 35, duration: 55, type: 'intercity' }
    ],
    'Neyyattinkara Depot': [
      { from: 'Neyyattinkara', to: 'Thiruvananthapuram', distance: 22, duration: 35, type: 'intercity' },
      { from: 'Neyyattinkara', to: 'Kanyakumari', distance: 20, duration: 35, type: 'interstate' },
      { from: 'Neyyattinkara', to: 'Nagercoil', distance: 35, duration: 60, type: 'interstate' },
      { from: 'Neyyattinkara', to: 'Varkala', distance: 45, duration: 75, type: 'intercity' },
      { from: 'Neyyattinkara', to: 'Attingal', distance: 55, duration: 90, type: 'intercity' }
    ],
    'Nedumangad Depot': [
      { from: 'Nedumangad', to: 'Thiruvananthapuram', distance: 22, duration: 35, type: 'intercity' },
      { from: 'Nedumangad', to: 'Vithura', distance: 35, duration: 60, type: 'intercity' },
      { from: 'Nedumangad', to: 'Ponmudi', distance: 55, duration: 105, type: 'hill_station' },
      { from: 'Nedumangad', to: 'Attingal', distance: 25, duration: 40, type: 'intercity' },
      { from: 'Nedumangad', to: 'Kollam', distance: 65, duration: 105, type: 'intercity' }
    ],
    'Kayamkulam Depot': [
      { from: 'Kayamkulam', to: 'Kollam', distance: 35, duration: 55, type: 'intercity' },
      { from: 'Kayamkulam', to: 'Alappuzha', distance: 25, duration: 40, type: 'intercity' },
      { from: 'Kayamkulam', to: 'Haripad', distance: 15, duration: 25, type: 'intercity' },
      { from: 'Kayamkulam', to: 'Chengannur', distance: 22, duration: 35, type: 'intercity' },
      { from: 'Kayamkulam', to: 'Kottayam', distance: 55, duration: 90, type: 'intercity' }
    ],
    'Kottarakkara Depot': [
      { from: 'Kottarakkara', to: 'Kollam', distance: 23, duration: 40, type: 'intercity' },
      { from: 'Kottarakkara', to: 'Pathanamthitta', distance: 45, duration: 75, type: 'intercity' },
      { from: 'Kottarakkara', to: 'Punalur', distance: 35, duration: 55, type: 'intercity' },
      { from: 'Kottarakkara', to: 'Thiruvananthapuram', distance: 55, duration: 90, type: 'intercity' },
      { from: 'Kottarakkara', to: 'Ernakulam', distance: 125, duration: 210, type: 'intercity' }
    ],
    'Changanassery Depot': [
      { from: 'Changanassery', to: 'Kottayam', distance: 18, duration: 30, type: 'intercity' },
      { from: 'Changanassery', to: 'Alappuzha', distance: 35, duration: 55, type: 'intercity' },
      { from: 'Changanassery', to: 'Thiruvalla', distance: 15, duration: 25, type: 'intercity' },
      { from: 'Changanassery', to: 'Ernakulam', distance: 75, duration: 120, type: 'intercity' },
      { from: 'Changanassery', to: 'Pala', distance: 42, duration: 65, type: 'intercity' }
    ],
    'Aluva Depot': [
      { from: 'Aluva', to: 'Ernakulam', distance: 25, duration: 40, type: 'intercity' },
      { from: 'Aluva', to: 'Angamaly', distance: 12, duration: 20, type: 'intercity' },
      { from: 'Aluva', to: 'Perumbavoor', distance: 22, duration: 35, type: 'intercity' },
      { from: 'Aluva', to: 'Thrissur', distance: 52, duration: 85, type: 'intercity' },
      { from: 'Aluva', to: 'Kochi Airport', distance: 18, duration: 30, type: 'airport' }
    ],
    'Thodupuzha Depot': [
      { from: 'Thodupuzha', to: 'Ernakulam', distance: 65, duration: 105, type: 'intercity' },
      { from: 'Thodupuzha', to: 'Kottayam', distance: 55, duration: 90, type: 'intercity' },
      { from: 'Thodupuzha', to: 'Muvattupuzha', distance: 32, duration: 50, type: 'intercity' },
      { from: 'Thodupuzha', to: 'Kumily', distance: 85, duration: 150, type: 'hill_station' },
      { from: 'Thodupuzha', to: 'Munnar', distance: 95, duration: 180, type: 'hill_station' }
    ],
    'Kattappana Depot': [
      { from: 'Kattappana', to: 'Kumily', distance: 45, duration: 75, type: 'hill_station' },
      { from: 'Kattappana', to: 'Vandiperiyar', distance: 25, duration: 40, type: 'hill_station' },
      { from: 'Kattappana', to: 'Nedumkandam', distance: 15, duration: 25, type: 'hill_station' },
      { from: 'Kattappana', to: 'Munnar', distance: 35, duration: 60, type: 'hill_station' },
      { from: 'Kattappana', to: 'Ernakulam', distance: 145, duration: 270, type: 'intercity' }
    ],
    'Adimali Depot': [
      { from: 'Adimali', to: 'Munnar', distance: 18, duration: 30, type: 'hill_station' },
      { from: 'Adimali', to: 'Kothamangalam', distance: 45, duration: 75, type: 'intercity' },
      { from: 'Adimali', to: 'Ernakulam', distance: 85, duration: 150, type: 'intercity' },
      { from: 'Adimali', to: 'Kattappana', distance: 35, duration: 60, type: 'hill_station' },
      { from: 'Adimali', to: 'Thrissur', distance: 125, duration: 210, type: 'intercity' }
    ],
    'Munnar Depot': [
      { from: 'Munnar', to: 'Adimali', distance: 18, duration: 30, type: 'hill_station' },
      { from: 'Munnar', to: 'Ernakulam', distance: 130, duration: 240, type: 'intercity' },
      { from: 'Munnar', to: 'Kattappana', distance: 35, duration: 60, type: 'hill_station' },
      { from: 'Munnar', to: 'Kumily', distance: 95, duration: 180, type: 'hill_station' },
      { from: 'Munnar', to: 'Coimbatore', distance: 175, duration: 300, type: 'interstate' }
    ],
    'Kumily Depot': [
      { from: 'Kumily', to: 'Thekkady', distance: 5, duration: 10, type: 'tourist' },
      { from: 'Kumily', to: 'Kottayam', distance: 114, duration: 210, type: 'intercity' },
      { from: 'Kumily', to: 'Pathanamthitta', distance: 95, duration: 180, type: 'intercity' },
      { from: 'Kumily', to: 'Thodupuzha', distance: 85, duration: 150, type: 'intercity' },
      { from: 'Kumily', to: 'Madurai', distance: 140, duration: 240, type: 'interstate' },
      { from: 'Kumily', to: 'Coimbatore', distance: 185, duration: 300, type: 'interstate' },
      { from: 'Kumily', to: 'Chennai', distance: 485, duration: 780, type: 'interstate' },
      { from: 'Kumily', to: 'Bangalore', distance: 385, duration: 600, type: 'interstate' },
      { from: 'Kumily', to: 'Ernakulam', distance: 145, duration: 270, type: 'intercity' },
      { from: 'Kumily', to: 'Kattappana', distance: 45, duration: 75, type: 'hill_station' }
    ],
    'Thiruvananthapuram Depot': [
      { from: 'Thiruvananthapuram', to: 'Kollam', distance: 71, duration: 120, type: 'intercity' },
      { from: 'Thiruvananthapuram', to: 'Kottayam', distance: 165, duration: 270, type: 'intercity' },
      { from: 'Thiruvananthapuram', to: 'Ernakulam', distance: 225, duration: 360, type: 'intercity' },
      { from: 'Thiruvananthapuram', to: 'Kozhikode', distance: 425, duration: 660, type: 'intercity' },
      { from: 'Thiruvananthapuram', to: 'Kannur', distance: 485, duration: 780, type: 'intercity' },
      { from: 'Thiruvananthapuram', to: 'Chennai', distance: 715, duration: 1080, type: 'interstate' },
      { from: 'Thiruvananthapuram', to: 'Bengaluru', distance: 515, duration: 780, type: 'interstate' },
      { from: 'Thiruvananthapuram', to: 'Madurai', distance: 285, duration: 420, type: 'interstate' },
      { from: 'Thiruvananthapuram', to: 'Coimbatore', distance: 365, duration: 540, type: 'interstate' },
      { from: 'Thiruvananthapuram', to: 'Attingal', distance: 36, duration: 60, type: 'intercity' },
      { from: 'Thiruvananthapuram', to: 'Neyyattinkara', distance: 22, duration: 35, type: 'intercity' },
      { from: 'Thiruvananthapuram', to: 'Nedumangad', distance: 22, duration: 35, type: 'intercity' }
    ],
    'Malappuram Depot': [
      { from: 'Malappuram', to: 'Kozhikode', distance: 55, duration: 90, type: 'intercity' },
      { from: 'Malappuram', to: 'Thrissur', distance: 95, duration: 150, type: 'intercity' },
      { from: 'Malappuram', to: 'Ernakulam', distance: 165, duration: 270, type: 'intercity' },
      { from: 'Malappuram', to: 'Palakkad', distance: 45, duration: 75, type: 'intercity' },
      { from: 'Malappuram', to: 'Kochi', distance: 175, duration: 285, type: 'intercity' },
      { from: 'Malappuram', to: 'Bangalore', distance: 435, duration: 660, type: 'interstate' },
      { from: 'Malappuram', to: 'Chennai', distance: 735, duration: 1080, type: 'interstate' },
      { from: 'Malappuram', to: 'Mysuru', distance: 275, duration: 420, type: 'interstate' },
      { from: 'Malappuram', to: 'Coimbatore', distance: 155, duration: 240, type: 'interstate' },
      { from: 'Malappuram', to: 'Perinthalmanna', distance: 25, duration: 40, type: 'intercity' },
      { from: 'Malappuram', to: 'Manjeri', distance: 35, duration: 55, type: 'intercity' }
    ],
    'Thrissur Depot': [
      { from: 'Thrissur', to: 'Guruvayur', distance: 29, duration: 45, type: 'intercity' },
      { from: 'Thrissur', to: 'Kochi', distance: 74, duration: 120, type: 'intercity' },
      { from: 'Thrissur', to: 'Palakkad', distance: 79, duration: 135, type: 'intercity' },
      { from: 'Thrissur', to: 'Kozhikode', distance: 142, duration: 240, type: 'intercity' },
      { from: 'Thrissur', to: 'Ernakulam', distance: 74, duration: 120, type: 'intercity' },
      { from: 'Thrissur', to: 'Bangalore', distance: 385, duration: 600, type: 'interstate' },
      { from: 'Thrissur', to: 'Chennai', distance: 685, duration: 1020, type: 'interstate' },
      { from: 'Thrissur', to: 'Mysuru', distance: 225, duration: 360, type: 'interstate' },
      { from: 'Thrissur', to: 'Coimbatore', distance: 115, duration: 180, type: 'interstate' },
      { from: 'Thrissur', to: 'Kollam', distance: 195, duration: 330, type: 'intercity' },
      { from: 'Thrissur', to: 'Kottayam', distance: 135, duration: 225, type: 'intercity' },
      { from: 'Thrissur', to: 'Alappuzha', distance: 155, duration: 255, type: 'intercity' },
      { from: 'Thrissur', to: 'Thiruvananthapuram', distance: 285, duration: 450, type: 'intercity' }
    ]
  });

  // Search and filter states
  const [routeSearch, setRouteSearch] = useState('');
  const [depotSearch, setDepotSearch] = useState('');
  const [routeTypeFilter, setRouteTypeFilter] = useState('all');
  const [selectedDepotRoutes, setSelectedDepotRoutes] = useState([]);

  // Removed demo mode - now fetching real data from database
  
  // Function to map FarePolicy bus types to Route model enum values
  const mapFarePolicyToRouteBusType = (farePolicyBusType) => {
    switch (farePolicyBusType) {
      case 'City / Ordinary':
        return 'ordinary';
      case 'Luxury / Hi-tech & AC':
        return 'volvo';
      case 'Super Fast Passenger':
        return 'super_fast';
      case 'Fast Passenger / LSFP':
        return 'fast_passenger';
      case 'A/C Low Floor':
        return 'ac';
      case 'Non A/C Low Floor':
        return 'ordinary'; // Map non-AC low floor to ordinary
      case 'Garuda Maharaja / Garuda King / Multi-axle Premium':
      case 'Garuda Sanchari / Biaxle Premium':
        return 'garuda';
      case 'Super Deluxe':
        return 'fast_passenger'; // Map super deluxe to fast passenger
      case 'Super Express':
        return 'super_fast'; // Map super express to super fast
      case 'City Fast':
        return 'fast_passenger'; // Map city fast to fast passenger
      default:
        return 'ordinary';
    }
  };

  // Function to map Route model enum values to FarePolicy bus types
  const mapRouteBusTypeToFarePolicy = (routeBusType) => {
    switch (routeBusType) {
      case 'ordinary':
        return 'City / Ordinary'; // Default mapping for ordinary
      case 'volvo':
        return 'Luxury / Hi-tech & AC';
      case 'super_fast':
        return 'Super Fast Passenger';
      case 'fast_passenger':
        return 'Fast Passenger / LSFP';
      case 'ac':
        return 'A/C Low Floor';
      case 'garuda':
        return 'Garuda Maharaja / Garuda King / Multi-axle Premium';
      default:
        return 'City / Ordinary';
    }
  };

  // Function to map Kerala route types to KSRTC bus types (updated to match database)
  const mapRouteTypeToBusType = (routeType) => {
    switch (routeType) {
      case 'intercity':
        return 'City / Ordinary';
      case 'interstate':
        return 'Luxury / Hi-tech & AC';
      case 'hill_station':
        return 'Super Fast Passenger';
      case 'seasonal':
        return 'Fast Passenger / LSFP';
      case 'tourist':
        return 'A/C Low Floor';
      case 'airport':
        return 'Garuda Maharaja / Garuda King / Multi-axle Premium';
      default:
        return 'City / Ordinary';
    }
  };
  
  // Function to get fare from fare policy
  const getFareFromPolicy = (busType, distance) => {
    const policy = farePolicies.find(p => p.busType === busType && p.isActive);
    if (policy) {
      const baseFare = distance * policy.ratePerKm;
      const totalFare = Math.max(baseFare, policy.minimumFare);
      return {
        baseFare: Math.round(totalFare),
        farePerKm: policy.ratePerKm,
        minimumFare: policy.minimumFare
      };
    }
    // Fallback to default calculation
    return {
      baseFare: Math.max(8, Math.floor(distance * 2.5)),
      farePerKm: 2.5,
      minimumFare: 8
    };
  };
  
  // Function to get display name for bus type (handles both Route model and FarePolicy formats)
  const getBusTypeDisplayName = (busType) => {
    // Handle Route model enum values
    switch (busType) {
      case 'ordinary':
        return 'Ordinary';
      case 'volvo':
        return 'Volvo';
      case 'super_fast':
        return 'Super Fast';
      case 'fast_passenger':
        return 'Fast Passenger';
      case 'ac':
        return 'AC';
      case 'garuda':
        return 'Garuda';
      // Handle FarePolicy bus type names
      case 'City / Ordinary':
        return 'Ordinary';
      case 'Luxury / Hi-tech & AC':
        return 'Volvo';
      case 'Super Fast Passenger':
        return 'Super Fast';
      case 'Fast Passenger / LSFP':
        return 'Fast Passenger';
      case 'A/C Low Floor':
        return 'AC Low Floor';
      case 'Garuda Maharaja / Garuda King / Multi-axle Premium':
        return 'Garuda';
      case 'Garuda Sanchari / Biaxle Premium':
        return 'Garuda Sanchari';
      case 'Super Deluxe':
        return 'Super Deluxe';
      case 'Super Express':
        return 'Super Express';
      case 'City Fast':
        return 'City Fast';
      case 'Non A/C Low Floor':
        return 'Non AC Low Floor';
      default:
        return busType;
    }
  };
  
  // Convert Kerala routes data to route format for display
  const convertKeralaRoutesToDisplayFormat = () => {
    const displayRoutes = [];
    let routeIndex = 1;
    
    Object.entries(keralaRoutesData).forEach(([depotName, routes]) => {
      routes.forEach(route => {
        // Find matching depot from API data
        const matchingDepot = depots.find(d => 
          d.depotName === depotName || 
          d.name === depotName ||
          d.depotName?.toLowerCase().includes(depotName.toLowerCase()) ||
          d.name?.toLowerCase().includes(depotName.toLowerCase())
        );
        
        // Map route type to KSRTC bus type
        const busType = mapRouteTypeToBusType(route.type);
        
        // Get fare from fare policy
        const fareData = getFareFromPolicy(busType, route.distance);
        
        displayRoutes.push({
          _id: `kerala-route-${routeIndex++}`,
          routeNumber: `KL-${route.from.substr(0,3).toUpperCase()}-${route.to.substr(0,3).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`,
          routeName: `${route.from} to ${route.to}`,
          startingPoint: {
            city: route.from,
            location: `${route.from} Bus Station`,
            coordinates: { latitude: 0, longitude: 0 }
          },
          endingPoint: {
            city: route.to,
            location: `${route.to} Bus Station`,
            coordinates: { latitude: 0, longitude: 0 }
          },
          totalDistance: route.distance,
          estimatedDuration: route.duration,
          depot: matchingDepot ? {
            depotId: matchingDepot._id,
            depotName: matchingDepot.depotName || matchingDepot.name,
            depotLocation: matchingDepot.location?.city + ', ' + matchingDepot.location?.state || 'Kerala, India'
          } : {
            depotId: 'temp-depot-' + routeIndex,
            depotName: depotName,
            depotLocation: 'Kerala, India'
          },
          busType: busType,
          baseFare: fareData.baseFare,
          farePerKm: fareData.farePerKm,
          status: 'active',
          features: [route.type, 'Kerala Route'],
          notes: `Kerala ${route.type} route`,
          intermediateStops: [],
          createdAt: new Date(),
          isKeralaRoute: true
        });
      });
    });
    
    return displayRoutes;
  };
  
  // Route form data (duplicate removed - using the one declared earlier)

  // Bulk route form
  const [bulkForm, setBulkForm] = useState({
    depotId: '',
    routeType: 'intercity',
    count: 10,
    startNumber: 1,
    prefix: 'R',
    targetDate: new Date().toISOString().slice(0, 10), // Default to today
    distanceRange: { min: 50, max: 200 },
    farePerKm: 2.5,
    features: ['AC']
  });

  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    departureTime: '',
    arrivalTime: '',
    frequency: 'daily',
    daysOfWeek: [],
    validFrom: '',
    validTo: '',
    busType: 'ac_sleeper'
  });

  // Stop management
  const [newStop, setNewStop] = useState({
    name: '',
    city: '',
    coordinates: { lat: 0, lng: 0 },
    sequence: 0,
    estimatedArrival: '',
    estimatedDeparture: '',
    distanceFromStart: 0
  });

  // Map-based route creation state
  const [mapState, setMapState] = useState({
    startLocation: null,
    endLocation: null,
    routePolyline: null,
    routeCoordinates: [],
    intermediateStops: [],
    totalDistance: 0,
    estimatedDuration: 0,
    isSelectingStart: true,
    mapCenter: [10.8505, 76.2711], // Kerala center coordinates
    zoom: 8
  });

  // Map route form
  const [mapRouteForm, setMapRouteForm] = useState({
    routeNumber: '',
    routeName: '',
    depotId: '',
    busType: 'ordinary',
    baseFare: 0,
    farePerKm: 2.5,
    features: ['AC'],
    notes: '',
    scheduling: {
      frequency: 'daily',
      timeSlots: [],
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }
  });

  // Fare matrix state
  const [fareMatrix, setFareMatrix] = useState(new Map());
  const [busTypeFares, setBusTypeFares] = useState({
    ordinary: { baseFare: 1.0, farePerKm: 1.5 },
    fast_passenger: { baseFare: 2.0, farePerKm: 1.8 },
    super_fast: { baseFare: 3.0, farePerKm: 2.0 },
    ac: { baseFare: 5.0, farePerKm: 3.5 },
    volvo: { baseFare: 8.0, farePerKm: 5.0 },
    garuda: { baseFare: 10.0, farePerKm: 6.0 }
  });

  // Fetch fare policies from backend and apply for selected depot
  const fetchFarePoliciesForDepot = async (depotId) => {
    try {
      const params = new URLSearchParams();
      if (depotId) params.set('depotId', depotId);
      const response = await apiFetch(`/api/fare-policy?${params.toString()}`);
      const policies = response?.data || [];
      if (!Array.isArray(policies) || policies.length === 0) return;

      // Map backend busType labels to local keys
      const mapLabelToKey = (label) => {
        const l = String(label || '').toLowerCase();
        if (l.includes('garuda maharaja') || l.includes('multi-axle')) return 'garuda';
        if (l.includes('garuda') || l.includes('premium')) return 'garuda';
        if (l.includes('luxury') || l.includes('hi-tech') || l.includes('a/c low') || l.includes('ac')) return 'ac';
        if (l.includes('volvo')) return 'volvo';
        if (l.includes('super fast')) return 'super_fast';
        if (l.includes('fast passenger') || l.includes('lsfp') || l.includes('city fast')) return 'fast_passenger';
        return 'ordinary';
      };

      const updated = { ...busTypeFares };
      policies.forEach(p => {
        const key = mapLabelToKey(p.busType);
        const minimumFare = typeof p.minimumFare === 'number' ? p.minimumFare : updated[key]?.baseFare || 0;
        const ratePerKm = typeof p.ratePerKm === 'number' ? p.ratePerKm : updated[key]?.farePerKm || 0;
        updated[key] = { baseFare: minimumFare, farePerKm: ratePerKm };
      });
      setBusTypeFares(updated);

      // If current selection has a policy, apply it
      const active = updated[mapRouteForm.busType];
      if (active) {
        setMapRouteForm(prev => ({
          ...prev,
          baseFare: active.baseFare,
          farePerKm: active.farePerKm
        }));
        calculateFareMatrix(mapState.intermediateStops, mapState.totalDistance);
      }
    } catch (e) {
      console.warn('Failed to fetch fare policies; using defaults', e);
    }
  };

  // Load policies whenever depot changes or modal opens
  useEffect(() => {
    if (showMapRouteModal) {
      fetchFarePoliciesForDepot(mapRouteForm.depotId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMapRouteModal, mapRouteForm.depotId]);

  // Map refs
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  // Export functionality
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFilters, setExportFilters] = useState({
    status: 'all',
    depot: 'all',
    dateRange: { from: '', to: '' }
  });

  // Confirmation dialogs
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null);

  // Kerala destinations data
  const keralaDestinations = [
    { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, district: 'Thiruvananthapuram' },
    { name: 'Kochi', lat: 9.9312, lng: 76.2673, district: 'Ernakulam' },
    { name: 'Kozhikode', lat: 11.2588, lng: 75.7804, district: 'Kozhikode' },
    { name: 'Thrissur', lat: 10.5276, lng: 76.2144, district: 'Thrissur' },
    { name: 'Kollam', lat: 8.8932, lng: 76.6141, district: 'Kollam' },
    { name: 'Kannur', lat: 11.8745, lng: 75.3704, district: 'Kannur' },
    { name: 'Palakkad', lat: 10.7867, lng: 76.6548, district: 'Palakkad' },
    { name: 'Kottayam', lat: 9.5916, lng: 76.5222, district: 'Kottayam' },
    { name: 'Alappuzha', lat: 9.4981, lng: 76.3388, district: 'Alappuzha' },
    { name: 'Malappuram', lat: 11.0500, lng: 76.0700, district: 'Malappuram' },
    { name: 'Pathanamthitta', lat: 9.2647, lng: 76.7870, district: 'Pathanamthitta' },
    { name: 'Idukki', lat: 9.8497, lng: 76.9681, district: 'Idukki' },
    { name: 'Wayanad', lat: 11.6850, lng: 76.1319, district: 'Wayanad' },
    { name: 'Kasargod', lat: 12.5000, lng: 75.0000, district: 'Kasargod' }
  ];

  useEffect(() => {
    fetchData();
    testAPIConnections();
    // No longer automatically set demo mode - fetch real data from database
  }, []);

  // Test API connections to ensure all endpoints are working
  const testAPIConnections = async () => {
    console.log('🔍 Testing API connections...');
    
    const endpoints = [
      { name: 'Routes', url: '/api/admin/routes' },
      { name: 'Depots', url: '/api/admin/depots' },
      { name: 'Stops', url: '/api/stops' },
      // Use a GET endpoint for connectivity check to avoid 404 on POST-only routes
      { name: 'Auto Scheduler', url: '/api/auto-scheduler/status' }
    ];

    const results = await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        try {
          const response = await apiFetch(endpoint.url);
          console.log(`✅ ${endpoint.name} API: Connected`, response);
          return { name: endpoint.name, status: 'connected', response };
        } catch (error) {
          console.error(`❌ ${endpoint.name} API: Failed`, error);
          return { name: endpoint.name, status: 'failed', error: error.message };
        }
      })
    );

    const connectedAPIs = results.filter(r => r.status === 'fulfilled' && r.value.status === 'connected').length;
    const totalAPIs = endpoints.length;

    console.log(`📊 API Connection Test Results: ${connectedAPIs}/${totalAPIs} APIs connected`);

    if (connectedAPIs === totalAPIs) {
      console.log('✅ All API endpoints are connected and working');
    } else {
      console.warn(`⚠️ ${totalAPIs - connectedAPIs} API endpoints are not responding`);
      toast.warning(`API Status: ${connectedAPIs}/${totalAPIs} endpoints connected`);
    }
  };

  // Comprehensive error handling for all Quick Actions
  const handleAPIError = (error, action) => {
    console.error(`❌ ${action} Error:`, error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.message) {
      if (error.message.includes('Network Error') || error.message.includes('fetch')) {
        errorMessage = 'Network error: Please check your internet connection';
      } else if (error.message.includes('401')) {
        errorMessage = 'Authentication error: Please login again';
      } else if (error.message.includes('403')) {
        errorMessage = 'Access denied: You don\'t have permission to perform this action';
      } else if (error.message.includes('404')) {
        errorMessage = 'Resource not found: The requested data is not available';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error: Please try again later';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout: Please try again';
      } else {
        errorMessage = error.message;
      }
    }
    
    toast.error(`${action} failed: ${errorMessage}`);
    return errorMessage;
  };

  // Enhanced success handling
  const handleAPISuccess = (message, data = null) => {
    console.log(`✅ ${message}`, data);
    toast.success(message);
  };

  const fetchData = async () => {
    setLoading(true);
    let routesRes, depotsRes, stopsRes, farePoliciesRes;
    
    try {
      console.log('🔄 Fetching data from APIs...');
      
      [routesRes, depotsRes, stopsRes, farePoliciesRes] = await Promise.all([
        apiFetch('/api/admin/routes'),
        apiFetch('/api/admin/depots'),
        apiFetch('/api/admin/stops'),
        apiFetch('/api/fare-policy/public')
      ]);

      console.log('📡 API Responses received:', {
        routes: routesRes,
        depots: depotsRes,
        stops: stopsRes,
        farePolicies: farePoliciesRes
      });

      // Enhanced response handling with better error checking
      const routesData = extractDataFromResponse(routesRes, 'routes');
      const depotsData = extractDataFromResponse(depotsRes, 'depots');
      let stopsData = extractDataFromResponse(stopsRes, 'stops');
      // If admin stops not available, fall back to public /api/stops format
      if (!Array.isArray(stopsData) || stopsData.length === 0) {
        const publicStops = extractDataFromResponse(stopsRes, 'data');
        if (Array.isArray(publicStops)) stopsData = publicStops;
      }
      const farePoliciesData = extractDataFromResponse(farePoliciesRes, 'farePolicies');

      // Validate data integrity
      if (!Array.isArray(routesData)) {
        console.warn('⚠️ Routes data is not an array:', routesData);
      }
      if (!Array.isArray(depotsData)) {
        console.warn('⚠️ Depots data is not an array:', depotsData);
      }
      if (!Array.isArray(stopsData)) {
        console.warn('⚠️ Stops data is not an array:', stopsData);
      }

      // Deduplicate routes so each unique route appears only once in UI
      const dedupeByKey = (list, keyFn) => {
        const map = new Map();
        (list || []).forEach(item => {
          try {
            const key = keyFn(item);
            if (!map.has(key)) map.set(key, item);
          } catch {}
        });
        return Array.from(map.values());
      };

      const uniqueRoutes = dedupeByKey(routesData || [], (r) => {
        // Deduplicate by origin → destination, ignoring routeNumber differences
        const sc = (r?.startingPoint?.city || r?.startingPoint?.location || r?.startingPoint || '').toString().trim().toUpperCase();
        const ec = (r?.endingPoint?.city || r?.endingPoint?.location || r?.endingPoint || '').toString().trim().toUpperCase();
        return `${sc}|${ec}`;
      });

      setRoutes(uniqueRoutes);
      setDepots(depotsData || []);
      setStops(stopsData || []);
      setFarePolicies(farePoliciesData || []);
      
      console.log('✅ Data successfully loaded:', {
        routes: uniqueRoutes?.length || 0,
        depots: depotsData?.length || 0,
        stops: stopsData?.length || 0,
        farePolicies: farePoliciesData?.length || 0
      });

      // Show success message if data was loaded
      if (uniqueRoutes?.length > 0 || depotsData?.length > 0 || stopsData?.length > 0) {
        toast.success(`Data loaded: ${uniqueRoutes?.length || 0} routes, ${depotsData?.length || 0} depots, ${stopsData?.length || 0} stops`);
      } else {
        toast.info('No routes found. Click "Kerala Routes" to browse and add predefined Kerala depot routes.');
      }
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      console.error('📋 Routes Response:', routesRes);
      console.error('📋 Depots Response:', depotsRes);
      console.error('📋 Stops Response:', stopsRes);
      
      // More specific error messages
      if (error.message?.includes('Network')) {
        toast.error('Network error: Please check your internet connection');
      } else if (error.message?.includes('401')) {
        toast.error('Authentication error: Please login again');
      } else if (error.message?.includes('403')) {
        toast.error('Access denied: You don\'t have permission to access this data');
      } else if (error.message?.includes('500')) {
        toast.error('Server error: Please try again later');
      } else {
        toast.error(`Failed to fetch data: ${error.message}`);
      }
      
      // Set empty arrays on error to prevent UI issues
      setRoutes([]);
      setDepots([]);
      setStops([]);
      setFarePolicies([]);
    } finally {
      setLoading(false);
    }
  };

  // Create unique origin→destination pairs by updating duplicates in DB (no deletions)
  const diversifyDuplicateRoutes = async () => {
    try {
      if (!Array.isArray(routes) || routes.length === 0) {
        toast('No routes to process');
        return;
      }

      setLoading(true);

      // Helper: normalize city string
      const norm = (v) => (v || '').toString().trim().toUpperCase();

      // Build groups by start|end
      const groups = new Map();
      (routes || []).forEach(r => {
        const sc = norm(r?.startingPoint?.city || r?.startingPoint);
        const ec = norm(r?.endingPoint?.city || r?.endingPoint);
        const key = `${sc}|${ec}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(r);
      });

      // Pool of cities to choose replacements from (Kerala + a few metro)
      const cityPool = [
        'THIRUVANANTHAPURAM','KOLLAM','ALAPPUZHA','KOTTAYAM','IDUKKI','ERNAKULAM','THRISSUR','PALAKKAD','MALAPPURAM','KOZHIKODE','WAYANAD','KANNUR','KASARAGOD',
        'MYSURU','BENGALURU','MANGALURU','COIMBATORE','MADURAI'
      ];

      // Track used pairs to maintain uniqueness during assignment
      const usedPairs = new Set(Array.from(groups.keys()));

      const updates = [];

      groups.forEach((list) => {
        if (!Array.isArray(list) || list.length <= 1) return; // already unique

        // Keep the first route as-is; adjust the rest
        const anchor = list[0];
        const baseStart = norm(anchor?.startingPoint?.city || anchor?.startingPoint);
        const baseEnd = norm(anchor?.endingPoint?.city || anchor?.endingPoint);

        for (let i = 1; i < list.length; i++) {
          const route = list[i];
          let newStart = baseStart;
          let newEnd = baseEnd;

          // Try to find a new end city first
          for (const cand of cityPool) {
            if (cand === baseStart) continue;
            const key = `${baseStart}|${cand}`;
            if (!usedPairs.has(key)) {
              newEnd = cand;
              usedPairs.add(key);
              break;
            }
          }

          // If still colliding, try changing the start city
          if (norm(newEnd) === baseEnd) {
            for (const candStart of cityPool) {
              if (candStart === baseEnd) continue;
              const key = `${candStart}|${baseEnd}`;
              if (!usedPairs.has(key)) {
                newStart = candStart;
                usedPairs.add(key);
                break;
              }
            }
          }

          // Prepare payload only if we actually changed something
          if (norm(newStart) !== baseStart || norm(newEnd) !== baseEnd) {
            const startCity = newStart;
            const endCity = newEnd;
            const startCoords = getCityCoordinates(startCity);
            const endCoords = getCityCoordinates(endCity);
            const payload = {
              routeName: `${startCity} → ${endCity}`,
              startingPoint: {
                city: startCity,
                location: `${startCity} Central Bus Station`,
                coordinates: startCoords
              },
              endingPoint: {
                city: endCity,
                location: `${endCity} Central Bus Station`,
                coordinates: endCoords
              }
            };
            updates.push({ id: route._id, payload });
          }
        }
      });

      if (updates.length === 0) {
        toast('No duplicates found to diversify');
        setLoading(false);
        return;
      }

      toast.loading(`Updating ${updates.length} routes...`, { id: 'diversify-routes' });

      // Batch updates to avoid overwhelming the server
      const batchSize = 5;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        await Promise.all(batch.map(({ id, payload }) =>
          apiFetch(`/api/admin/routes/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
        ));
      }

      toast.success('Routes diversified successfully', { id: 'diversify-routes' });
      await fetchData();
    } catch (e) {
      console.error('Diversify routes failed', e);
      toast.error('Failed to diversify routes', { id: 'diversify-routes' });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to extract data from API responses
  const extractDataFromResponse = (response, dataType) => {
    if (!response) {
      console.warn(`No response received for ${dataType}`);
      return [];
    }

    // Handle different response structures
    if (Array.isArray(response)) {
      return response;
    }

    if (response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Handle nested data structures
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      if (response.data[dataType] && Array.isArray(response.data[dataType])) {
        return response.data[dataType];
      }
    }

    if (response[dataType] && Array.isArray(response[dataType])) {
      return response[dataType];
    }

    console.warn(`Could not extract ${dataType} from response:`, response);
    return [];
  };

  const handleSingleRouteAdd = async () => {
    // Enhanced validation
    if (!routeForm.routeNumber.trim()) {
      toast.error('Please enter a route number');
      return;
    }

    if (!routeForm.depot.depotId) {
      toast.error('Please select a depot');
      return;
    }

    if (!routeForm.startingPoint.city.trim()) {
      toast.error('Please enter starting city');
      return;
    }

    if (!routeForm.endingPoint.city.trim()) {
      toast.error('Please enter ending city');
      return;
    }

    if (routeForm.startingPoint.city === routeForm.endingPoint.city) {
      toast.error('Starting and ending cities cannot be the same');
      return;
    }

    // Check for duplicate route number
    const existingRoute = routes.find(r => r.routeNumber === routeForm.routeNumber);
    if (existingRoute) {
      toast.error('Route number already exists. Please choose a different number.');
      return;
    }

    try {
      setLoading(true);
      
      // Auto-calculate distance and duration if not provided
      let distance = routeForm.totalDistance;
      let duration = routeForm.estimatedDuration;
      
      if (!distance || distance === 0) {
        distance = calculateRealisticDistance(routeForm.startingPoint.city, routeForm.endingPoint.city);
      }
      
      if (!duration || duration === 0) {
        duration = Math.floor(distance / 35 * 60); // Assuming 35 km/h average
      }

      // Auto-calculate base fare if not provided
      let baseFare = routeForm.baseFare;
      if (!baseFare || baseFare === 0) {
        baseFare = Math.max(10, Math.floor(distance * 2.5)); // Default ₹2.5 per km
      }

      // Transform the form data to match backend API requirements
      const routeData = {
        routeNumber: routeForm.routeNumber.trim(),
        routeName: routeForm.routeName.trim() || `${routeForm.startingPoint.city} → ${routeForm.endingPoint.city}`,
        startingPoint: {
          ...routeForm.startingPoint,
          city: routeForm.startingPoint.city.trim(),
          location: routeForm.startingPoint.location.trim() || `${routeForm.startingPoint.city} Central Bus Station`,
          coordinates: routeForm.startingPoint.coordinates.lat !== 0 ? 
            routeForm.startingPoint.coordinates : 
            getCityCoordinates(routeForm.startingPoint.city)
        },
        endingPoint: {
          ...routeForm.endingPoint,
          city: routeForm.endingPoint.city.trim(),
          location: routeForm.endingPoint.location.trim() || `${routeForm.endingPoint.city} Central Bus Station`,
          coordinates: routeForm.endingPoint.coordinates.lat !== 0 ? 
            routeForm.endingPoint.coordinates : 
            getCityCoordinates(routeForm.endingPoint.city)
        },
        intermediateStops: routeForm.intermediateStops || [],
        totalDistance: distance,
        estimatedDuration: duration,
        baseFare: baseFare,
        farePerKm: routeForm.farePerKm || 2.5,
        depotId: routeForm.depot.depotId,
        status: routeForm.status || 'active',
        amenities: routeForm.features || [],
        schedules: routeForm.schedules || [],
        notes: routeForm.notes || '',
        busType: mapFarePolicyToRouteBusType(routeForm.busType) || 'ordinary'
      };

      console.log('📝 Sending enhanced route data:', routeData);
      
      const response = await apiFetch('/api/admin/routes', {
        method: 'POST',
        body: JSON.stringify(routeData)
      });

      console.log('📡 Single Route Add API Response:', response);

      // Enhanced response handling
      if (response && ((response.data && response.data.success) || response.ok || response.status === 201)) {
        const createdRoute = response.data || response.route || response;
        toast.success(`✅ Route ${routeForm.routeNumber} added successfully!`);
        
        // Add the new route to the local state immediately for better UX
        if (createdRoute && createdRoute._id) {
          setRoutes(prev => [createdRoute, ...prev]);
        }
        
        setShowSingleAddModal(false);
        resetForm();
        
        // Refresh data to ensure consistency
        setTimeout(() => fetchData(), 1000);
      } else {
        const errorMessage = response?.message || response?.error || 'Failed to add route';
        console.error('❌ Single Route Add failed:', response);
        toast.error(`Failed to add route: ${errorMessage}`);
      }
    } catch (error) {
      console.error('❌ Error adding route:', error);
      toast.error(`Failed to add route: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRouteAdd = async () => {
    if (!bulkForm.depotId) {
      toast.error('Please select a depot for bulk route creation');
      return;
    }

    if (bulkForm.count <= 0 || bulkForm.count > 100) {
      toast.error('Please enter a valid number of routes (1-100)');
      return;
    }

    try {
      setLoading(true);
      const routesToAdd = [];
      
      // Enhanced city pairs with more realistic Kerala routes
      const cityPairs = [
        ['Thiruvananthapuram', 'Kochi'],
        ['Kochi', 'Kozhikode'],
        ['Thiruvananthapuram', 'Kozhikode'],
        ['Kochi', 'Thrissur'],
        ['Thrissur', 'Kozhikode'],
        ['Kollam', 'Kochi'],
        ['Kannur', 'Kozhikode'],
        ['Palakkad', 'Kochi'],
        ['Kottayam', 'Kochi'],
        ['Alappuzha', 'Kochi'],
        ['Thiruvananthapuram', 'Kollam'],
        ['Kochi', 'Kottayam'],
        ['Kozhikode', 'Kannur'],
        ['Thrissur', 'Palakkad'],
        ['Kochi', 'Alappuzha'],
        ['Kollam', 'Kottayam'],
        ['Kozhikode', 'Wayanad'],
        ['Thiruvananthapuram', 'Kottayam'],
        ['Kochi', 'Idukki'],
        ['Kannur', 'Kasargod']
      ];

      // Get depot information for better route naming
      const selectedDepot = depots.find(d => d._id === bulkForm.depotId);
      
      for (let i = 0; i < bulkForm.count; i++) {
        const routeNumber = `${bulkForm.prefix}${String(bulkForm.startNumber + i).padStart(3, '0')}`;
        const cityPair = cityPairs[i % cityPairs.length];
        
        // Calculate realistic distance based on actual Kerala geography
        const distance = calculateRealisticDistance(cityPair[0], cityPair[1]);
        const duration = Math.floor(distance / 35 * 60); // Assuming 35 km/h average for Kerala roads
        
        routesToAdd.push({
          routeNumber,
          routeName: `${cityPair[0]} → ${cityPair[1]}`,
          startingPoint: {
            city: cityPair[0],
            location: `${cityPair[0]} Central Bus Station`,
            coordinates: getCityCoordinates(cityPair[0])
          },
          endingPoint: {
            city: cityPair[1],
            location: `${cityPair[1]} Central Bus Station`,
            coordinates: getCityCoordinates(cityPair[1])
          },
          totalDistance: distance,
          estimatedDuration: duration,
          depotId: bulkForm.depotId,
          baseFare: Math.max(10, Math.floor(distance * bulkForm.farePerKm)),
          farePerKm: bulkForm.farePerKm,
          amenities: bulkForm.features,
          status: 'active',
          busType: bulkForm.routeType === 'express' ? 'fast_passenger' : 'ordinary',
          notes: `Bulk generated route from ${selectedDepot?.depotName || 'selected depot'}`
        });
      }

      console.log(`🚌 Creating ${routesToAdd.length} bulk routes for depot: ${selectedDepot?.depotName}`);
      
      // Enhanced batch processing with better error handling
      const batchSize = 5;
      let successCount = 0;
      let errorCount = 0;
      const createdRoutes = [];
      
      for (let i = 0; i < routesToAdd.length; i += batchSize) {
        const batch = routesToAdd.slice(i, i + batchSize);
        
        try {
          const batchResults = await Promise.allSettled(batch.map(async (route) => {
            try {
              console.log(`📝 Creating route: ${route.routeNumber}`);
              const response = await apiFetch('/api/admin/routes', {
                method: 'POST',
                body: JSON.stringify(route)
              });
              
              console.log(`📡 Response for ${route.routeNumber}:`, response);
              
              if (response && ((response.data && response.data.success) || response.ok || response.status === 201)) {
                const createdRoute = response.data || response.route || response;
                createdRoutes.push(createdRoute);
                return { success: true, route: createdRoute };
              } else {
                const errorMessage = response?.message || response?.error || 'Unknown error';
                console.error(`❌ Failed to create route ${route.routeNumber}:`, errorMessage);
                return { success: false, error: errorMessage, routeNumber: route.routeNumber };
              }
            } catch (error) {
              console.error(`❌ Error creating route ${route.routeNumber}:`, error);
              return { success: false, error: error.message, routeNumber: route.routeNumber };
            }
          }));
          
          // Process batch results
          batchResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value.success) {
              successCount++;
            } else {
              errorCount++;
              const errorMsg = result.status === 'rejected' ? result.reason : result.value.error;
              console.error(`❌ Route creation failed:`, errorMsg);
            }
          });
          
          // Show progress with more detailed information
          const progress = Math.round(((i + batchSize) / routesToAdd.length) * 100);
          toast.loading(`Creating bulk routes... ${progress}% complete (${successCount} success, ${errorCount} failed)`, { 
            id: 'bulk-progress',
            duration: 2000
          });
          
        } catch (error) {
          errorCount += batch.length;
          console.error('❌ Batch creation error:', error);
        }
      }
      
      toast.dismiss('bulk-progress');
      
      // Enhanced success/error reporting
      if (successCount > 0) {
        // Add created routes to local state for immediate UI update
        if (createdRoutes.length > 0) {
          setRoutes(prev => [...createdRoutes, ...prev]);
        }
        
        toast.success(`✅ Bulk route creation completed! ${successCount} routes created successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        
        // If target date is set, schedule trips for the new routes
        if (bulkForm.targetDate) {
          toast.info('🎯 Scheduling trips for new routes...');
          await handleBulkScheduleTrips();
        }
        
        setShowBulkAddModal(false);
        resetBulkForm();
        
        // Refresh data to ensure consistency
        setTimeout(() => fetchData(), 1000);
      } else {
        toast.error('❌ Failed to create any routes. Please check your configuration and try again.');
      }
      
    } catch (error) {
      console.error('Error adding bulk routes:', error);
      toast.error('Failed to add routes');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate realistic distances between Kerala cities
  const calculateRealisticDistance = (city1, city2) => {
    const distances = {
      'Thiruvananthapuram-Kochi': 200,
      'Kochi-Kozhikode': 180,
      'Thiruvananthapuram-Kozhikode': 350,
      'Kochi-Thrissur': 80,
      'Thrissur-Kozhikode': 100,
      'Kollam-Kochi': 150,
      'Kannur-Kozhikode': 90,
      'Palakkad-Kochi': 120,
      'Kottayam-Kochi': 60,
      'Alappuzha-Kochi': 50,
      'Thiruvananthapuram-Kollam': 70,
      'Kochi-Kottayam': 60,
      'Kozhikode-Kannur': 90,
      'Thrissur-Palakkad': 40,
      'Kochi-Alappuzha': 50,
      'Kollam-Kottayam': 80,
      'Kozhikode-Wayanad': 100,
      'Thiruvananthapuram-Kottayam': 160,
      'Kochi-Idukki': 120,
      'Kannur-Kasargod': 50
    };
    
    const key1 = `${city1}-${city2}`;
    const key2 = `${city2}-${city1}`;
    return distances[key1] || distances[key2] || Math.floor(Math.random() * 200) + 50;
  };

  // Helper function to get city coordinates
  const getCityCoordinates = (cityName) => {
    const cityCoords = {
      'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
      'Kochi': { lat: 9.9312, lng: 76.2673 },
      'Kozhikode': { lat: 11.2588, lng: 75.7804 },
      'Thrissur': { lat: 10.5276, lng: 76.2144 },
      'Kollam': { lat: 8.8932, lng: 76.6141 },
      'Kannur': { lat: 11.8745, lng: 75.3704 },
      'Palakkad': { lat: 10.7867, lng: 76.6548 },
      'Kottayam': { lat: 9.5916, lng: 76.5222 },
      'Alappuzha': { lat: 9.4981, lng: 76.3388 },
      'Wayanad': { lat: 11.6850, lng: 76.1319 },
      'Idukki': { lat: 9.8497, lng: 76.9681 },
      'Kasargod': { lat: 12.5000, lng: 75.0000 }
    };
    
    return cityCoords[cityName] || { lat: 10.8505, lng: 76.2711 };
  };

  const handleRouteEdit = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/admin/routes/${selectedRoute._id}`, {
        method: 'PUT',
        body: JSON.stringify(routeForm)
      });

      if ((response.data && response.data.success)) {
        toast.success('Route updated successfully');
        setShowEditModal(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating route:', error);
      toast.error('Failed to update route');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAdd = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`/api/admin/routes/${selectedRoute._id}/schedules`, {
        method: 'POST',
        body: JSON.stringify(scheduleForm)
      });

      if ((response.data && response.data.success)) {
        toast.success('Schedule added successfully');
        setShowScheduleModal(false);
        resetScheduleForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      toast.error('Failed to add schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkOperation = async () => {
    if (selectedRoutes.length === 0) {
      toast.error('Please select routes for bulk operation');
      return;
    }

    try {
      setLoading(true);
      
      switch (bulkOperation) {
        case 'activate':
          await Promise.all(selectedRoutes.map(routeId => 
            apiFetch(`/api/admin/routes/${routeId}`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'active' })
            })
          ));
          toast.success(`Activated ${selectedRoutes.length} routes`);
          break;
          
        case 'deactivate':
          await Promise.all(selectedRoutes.map(routeId => 
            apiFetch(`/api/admin/routes/${routeId}`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'inactive' })
            })
          ));
          toast.success(`Deactivated ${selectedRoutes.length} routes`);
          break;
          
        case 'update_fare':
          await Promise.all(selectedRoutes.map(routeId => 
            apiFetch(`/api/admin/routes/${routeId}`, {
              method: 'PUT',
              body: JSON.stringify({ 
                baseFare: bulkForm.baseFare,
                farePerKm: bulkForm.farePerKm 
              })
            })
          ));
          toast.success(`Updated fares for ${selectedRoutes.length} routes`);
          break;
          
        case 'schedule_trips':
          await handleBulkScheduleTrips(); break;
      }
      
      setSelectedRoutes([]);
      setBulkOperation('');
      fetchData();
    } catch (error) {
      console.error('Error in bulk operation:', error);
      toast.error('Bulk operation failed');
    } finally {
      setLoading(false);
    }
  };

  // Delete a single route (hard delete in DB via backend) - moved to later in file

  const handleBulkScheduleTrips = async () => {
    if (!bulkForm.targetDate) {
      toast.error('Please select a target date for scheduling');
      return;
    }

    try {
      const response = await apiFetch('/api/auto-scheduler/mass-schedule', {
        method: 'POST',
        body: JSON.stringify({
          date: bulkForm.targetDate,
          depotIds: bulkForm.depotId ? [bulkForm.depotId] : [],
          maxTripsPerRoute: 5,
          timeGap: 30,
          autoAssignCrew: true,
          autoAssignBuses: true,
          generateReports: true,
          routeIds: selectedRoutes // Schedule trips specifically for selected routes
        })
      });

      if (response?.success || response?.ok) {
        const tripsCreated = response.data?.tripsCreated || response.tripsCreated || 0;
        const successRate = response.data?.successRate || response.successRate || '0%';
        toast.success(`Bulk scheduling completed! ${tripsCreated} trips created for selected routes (${successRate} success rate)`);
      } else {
        const errorMessage = response?.message || response?.error || 'Bulk scheduling failed';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error in bulk scheduling:', error);
      toast.error('Bulk scheduling failed');
    }
  };

  // Kerala Auto Route Generation Function
  const handleKeralaAutoRouteGeneration = async () => {
    if (keralaAutoForm.selectedDepots.length === 0) {
      toast.error('Please select at least one depot for route generation');
      return;
    }

    try {
      setLoading(true);
      
      // Generate all possible route combinations between Kerala destinations
      const routesToCreate = [];
      let routeNumber = 1;
      
      // Process each selected depot separately
      for (const depotId of keralaAutoForm.selectedDepots) {
        const depotConfig = keralaAutoForm.depotConfigs[depotId];
        if (!depotConfig || depotConfig.busTypes.length === 0) {
          console.warn(`Skipping depot ${depotId} - no configuration or bus types`);
          continue;
        }

        const depot = depots.find(d => d._id === depotId);
        console.log(`🚌 Processing depot: ${depot?.depotName} with ${depotConfig.busTypes.length} bus types`);
        
        for (let i = 0; i < keralaDestinations.length; i++) {
          for (let j = i + 1; j < keralaDestinations.length; j++) {
            const start = keralaDestinations[i];
            const end = keralaDestinations[j];
            
            // Calculate distance (simplified calculation)
            const distance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
            
            // Create routes for each bus type configured for this depot
            depotConfig.busTypes.forEach(busType => {
              const routeData = {
                routeNumber: `KR${String(routeNumber).padStart(3, '0')}`,
                routeName: `${start.name} → ${end.name}`,
                startingPoint: {
                  city: start.name,
                  location: `${start.name} Central`,
                  coordinates: { lat: start.lat, lng: start.lng }
                },
                endingPoint: {
                  city: end.name,
                  location: `${end.name} Central`,
                  coordinates: { lat: end.lat, lng: end.lng }
                },
                totalDistance: Math.round(distance),
                estimatedDuration: Math.round(distance / 40 * 60), // Assuming 40 km/h average
                depotId: depotId,
                baseFare: depotConfig.baseFare,
                farePerKm: depotConfig.farePerKm,
                busType: busType,
                amenities: busType === 'ac' ? ['AC', 'WiFi'] : busType === 'fast_passenger' ? ['WiFi'] : [],
                status: 'active',
                schedules: keralaAutoForm.generateTrips ? generateKeralaSchedules(depotConfig) : [],
                notes: `Auto-generated Kerala route connecting ${start.district} and ${end.district} districts (${depot?.depotName})`
              };
              
              routesToCreate.push(routeData);
              routeNumber++;
            });
          }
        }
      }

      console.log(`🚌 Creating ${routesToCreate.length} Kerala routes across ${keralaAutoForm.selectedDepots.length} depots...`);
      
      // Enhanced batch processing for Kerala routes
      const batchSize = 10;
      let successCount = 0;
      let errorCount = 0;
      const createdRoutes = [];
      
      for (let i = 0; i < routesToCreate.length; i += batchSize) {
        const batch = routesToCreate.slice(i, i + batchSize);
        
        try {
          const batchResults = await Promise.allSettled(batch.map(async (route) => {
            try {
              console.log(`📝 Creating Kerala route: ${route.routeNumber} for depot ${route.depotId}`);
              const response = await apiFetch('/api/admin/routes', {
                method: 'POST',
                body: JSON.stringify(route)
              });
              
              console.log(`📡 Kerala Route Response for ${route.routeNumber}:`, response);
              
              if (response && ((response.data && response.data.success) || response.ok || response.status === 201)) {
                const createdRoute = response.data || response.route || response;
                createdRoutes.push(createdRoute);
                return { success: true, route: createdRoute };
              } else {
                const errorMessage = response?.message || response?.error || 'Unknown error';
                console.error(`❌ Failed to create Kerala route ${route.routeNumber}:`, errorMessage);
                return { success: false, error: errorMessage, routeNumber: route.routeNumber };
              }
            } catch (error) {
              console.error(`❌ Error creating Kerala route ${route.routeNumber}:`, error);
              return { success: false, error: error.message, routeNumber: route.routeNumber };
            }
          }));
          
          // Process batch results
          batchResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value.success) {
              successCount++;
            } else {
              errorCount++;
              const errorMsg = result.status === 'rejected' ? result.reason : result.value.error;
              console.error(`❌ Kerala route creation failed:`, errorMsg);
            }
          });
          
          // Show detailed progress
          const progress = Math.round(((i + batchSize) / routesToCreate.length) * 100);
          toast.loading(`Creating Kerala routes... ${progress}% complete (${successCount} success, ${errorCount} failed)`, { 
            id: 'kerala-progress',
            duration: 2000
          });
          
        } catch (error) {
          errorCount += batch.length;
          console.error('❌ Kerala batch creation error:', error);
        }
      }
      
      toast.dismiss('kerala-progress');
      
      if (successCount > 0) {
        // Add created routes to local state for immediate UI update
        if (createdRoutes.length > 0) {
          setRoutes(prev => [...createdRoutes, ...prev]);
        }
        
        toast.success(`✅ Kerala route generation completed! ${successCount} routes created successfully across ${keralaAutoForm.selectedDepots.length} depots${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        
        // If trips should be generated, trigger bulk scheduling for each depot
        if (keralaAutoForm.generateTrips) {
          toast.info('🎯 Generating trips for Kerala routes...');
          await handleKeralaTripGeneration();
        }
        
        setShowKeralaAutoModal(false);
        
        // Refresh data to ensure consistency
        setTimeout(() => fetchData(), 1000);
      } else {
        toast.error('❌ Failed to create any Kerala routes. Please check your configuration and try again.');
      }
      
    } catch (error) {
      console.error('Error in Kerala auto route generation:', error);
      toast.error('Failed to generate Kerala routes');
    } finally {
      setLoading(false);
    }
  };

  // Generate schedules for Kerala routes
  const generateKeralaSchedules = (depotConfig) => {
    return keralaAutoForm.timeSlots.map(timeSlot => ({
      departureTime: timeSlot,
      arrivalTime: calculateArrivalTime(timeSlot, 180), // Assuming 3 hours average
      frequency: 'daily',
      daysOfWeek: keralaAutoForm.daysOfWeek,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 1 year from now
      busType: depotConfig.busTypes[0], // Use first bus type for schedule
      autoGenerated: true
    }));
  };

  // Generate trips for all Kerala routes
  const handleKeralaTripGeneration = async () => {
    try {
      // Generate trips for each depot separately
      let totalTripsCreated = 0;
      
      for (const depotId of keralaAutoForm.selectedDepots) {
        const depotConfig = keralaAutoForm.depotConfigs[depotId];
        if (!depotConfig) continue;
        
        const depot = depots.find(d => d._id === depotId);
        console.log(`🎯 Generating trips for depot: ${depot?.depotName}`);
        
        const response = await apiFetch('/api/auto-scheduler/kerala-mass-schedule', {
          method: 'POST',
          body: JSON.stringify({
            depotId: depotId,
            timeSlots: keralaAutoForm.timeSlots,
            daysOfWeek: keralaAutoForm.daysOfWeek,
            busTypes: depotConfig.busTypes,
            autoAssignBuses: keralaAutoForm.autoAssignBuses,
            autoAssignCrew: keralaAutoForm.autoAssignCrew,
            generateReports: true,
            targetDate: new Date().toISOString().slice(0, 10)
          })
        });

        if (response?.success || response?.ok) {
          const tripsCreated = response.data?.tripsCreated || response.tripsCreated || 0;
          totalTripsCreated += tripsCreated;
          console.log(`✅ Generated ${tripsCreated} trips for ${depot?.depotName}`);
        } else {
          console.error(`Failed to generate trips for ${depot?.depotName}:`, response?.message || response?.error);
        }
      }

      if (totalTripsCreated > 0) {
        toast.success(`🎯 Kerala trip generation completed! ${totalTripsCreated} trips scheduled across ${keralaAutoForm.selectedDepots.length} depots`);
      } else {
        toast.error('Failed to generate Kerala trips');
      }
    } catch (error) {
      console.error('Error in Kerala trip generation:', error);
      toast.error('Failed to generate Kerala trips');
    }
  };

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Helper function to calculate arrival time
  const calculateArrivalTime = (departureTime, durationMinutes) => {
    const [hours, minutes] = departureTime.split(':').map(Number);
    const departureMinutes = hours * 60 + minutes;
    const arrivalMinutes = departureMinutes + durationMinutes;
    const arrivalHours = Math.floor(arrivalMinutes / 60) % 24;
    const arrivalMins = arrivalMinutes % 60;
    return `${String(arrivalHours).padStart(2, '0')}:${String(arrivalMins).padStart(2, '0')}`;
  };

  const addStopToRoute = () => {
    if (!newStop.name || !newStop.city) {
      toast.error('Please fill in stop name and city');
      return;
    }

    setRouteForm(prev => ({
      ...prev,
      intermediateStops: [...prev.intermediateStops, {
        ...newStop,
        id: Date.now() // Temporary ID
      }]
    }));

    setNewStop({
      name: '',
      city: '',
      coordinates: { lat: 0, lng: 0 },
      sequence: routeForm.intermediateStops.length + 1,
      estimatedArrival: '',
      estimatedDeparture: '',
      distanceFromStart: 0
    });
  };

  const removeStopFromRoute = (stopId) => {
    setRouteForm(prev => ({
      ...prev,
      intermediateStops: prev.intermediateStops.filter(stop => stop.id !== stopId)
    }));
  };

  const resetForm = () => {
    setRouteForm({
      routeNumber: '',
      routeName: '',
      startingPoint: {
        city: '',
        location: '',
        coordinates: { lat: 0, lng: 0 }
      },
      endingPoint: {
        city: '',
        location: '',
        coordinates: { lat: 0, lng: 0 }
      },
      totalDistance: 0,
      estimatedDuration: 0,
      intermediateStops: [],
      depot: {
        depotId: '',
        name: ''
      },
      schedules: [],
      status: 'active',
      baseFare: 0,
      farePerKm: 0,
      features: [],
      notes: ''
    });
  };

  const resetBulkForm = () => {
    setBulkForm({
      depotId: '',
      routeType: 'intercity',
      count: 10,
      startNumber: 1,
      prefix: 'R',
      distanceRange: { min: 50, max: 200 },
      farePerKm: 2.5,
      features: ['AC']
    });
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      departureTime: '',
      arrivalTime: '',
      frequency: 'daily',
      daysOfWeek: [],
      validFrom: '',
      validTo: '',
      busType: 'ac_sleeper'
    });
  };

  // Map-based route creation functions
  const initializeMap = () => {
    // Google Maps integration handled by RouteMapEditor component
    console.log('Google Maps integration ready via RouteMapEditor...');
  };

  const handleMapClick = async (lat, lng) => {
    if (mapState.isSelectingStart) {
      // Set start location
      const locationName = await getLocationName(lat, lng);
      setMapState(prev => ({
        ...prev,
        startLocation: { lat, lng, name: locationName },
        isSelectingStart: false
      }));
      toast.success('Start location selected! Click on end location.');
    } else {
      // Set end location and generate route
      const locationName = await getLocationName(lat, lng);
      const endLocation = { lat, lng, name: locationName };
      setMapState(prev => ({
        ...prev,
        endLocation,
        isSelectingStart: true
      }));
      
      // Generate route between start and end points
      await generateRoute(mapState.startLocation, endLocation);
      toast.success('End location selected! Route generated.');
    }
  };

  const getLocationName = async (lat, lng) => {
    try {
      // Use Google Maps Geocoding API
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        const latlng = new window.google.maps.LatLng(lat, lng);
        
        return new Promise((resolve) => {
          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === 'OK' && results[0]) {
              resolve(results[0].formatted_address);
            } else {
              resolve(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          });
        });
      } else {
        // Fallback if Google Maps not loaded
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch (error) {
      console.error('Error getting location name:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const generateRoute = async (start, end) => {
    try {
      setLoading(true);
      
      // Use OSRM routing service with multiple waypoints for better route planning
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=polyline&steps=true&alternatives=false`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distance = route.distance / 1000; // Convert to km
        const duration = route.duration / 60; // Convert to minutes
        
        // Extract waypoints/stops from route steps (every 3rd step for optimal stop distribution)
        const stepInterval = Math.max(1, Math.floor(route.legs[0].steps.length / 8)); // Max 8 stops
        const intermediateStops = [];
        
        for (let i = stepInterval; i < route.legs[0].steps.length - 1; i += stepInterval) {
          const step = route.legs[0].steps[i];
          if (step.maneuver && step.maneuver.location) {
            const locationName = await getLocationName(step.maneuver.location[1], step.maneuver.location[0]);
            intermediateStops.push({
              stopId: `STOP_${Date.now()}_${intermediateStops.length}`,
              name: locationName,
              lat: step.maneuver.location[1],
              lng: step.maneuver.location[0],
              sequence: intermediateStops.length + 1,
              distanceFromStart: (route.distance * (i / route.legs[0].steps.length)) / 1000,
              isAutoGenerated: true
            });
          }
        }
        
        // Decode polyline coordinates for display
        const routeCoordinates = decodePolyline(route.geometry);
        
        setMapState(prev => ({
          ...prev,
          routePolyline: route.geometry,
          routeCoordinates,
          intermediateStops,
          totalDistance: distance,
          estimatedDuration: duration
        }));
        
        // Auto-generate route name and number
        const startCity = start.name.split(',')[0] || 'Unknown';
        const endCity = end.name.split(',')[0] || 'Unknown';
        setMapRouteForm(prev => ({
          ...prev,
          routeName: `${startCity} → ${endCity}`,
          routeNumber: `R${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          baseFare: Math.round(distance * 0.5), // Auto-calculate base fare
          farePerKm: 2.5 // Default fare per km
        }));
        
        // Calculate fare matrix
        calculateFareMatrix(intermediateStops, distance, start, end);
        
        toast.success(`Route generated! Distance: ${distance.toFixed(1)}km, Duration: ${duration.toFixed(0)}min, ${intermediateStops.length} stops`);
      } else {
        toast.error('No route found between the selected points');
      }
    } catch (error) {
      console.error('Error generating route:', error);
      toast.error('Failed to generate route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Polyline decoder function
  const decodePolyline = (polylineString) => {
    if (!polylineString) return [];
    
    try {
      // Simple polyline decoder (for production, use a proper library)
      const coordinates = [];
      let index = 0;
      let lat = 0;
      let lng = 0;
      
      while (index < polylineString.length) {
        let shift = 0;
        let result = 0;
        let byte;
        
        do {
          byte = polylineString.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        
        const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += deltaLat;
        
        shift = 0;
        result = 0;
        
        do {
          byte = polylineString.charCodeAt(index++) - 63;
          result |= (byte & 0x1f) << shift;
          shift += 5;
        } while (byte >= 0x20);
        
        const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += deltaLng;
        
        coordinates.push([lat / 1e5, lng / 1e5]);
      }
      
      return coordinates;
    } catch (error) {
      console.error('Error decoding polyline:', error);
      return [];
    }
  };

  const calculateFareMatrix = (stops, totalDistance, start, end) => {
    const matrix = new Map();
    const startObj = start || mapState.startLocation || { name: 'Start' };
    const endObj = end || mapState.endLocation || { name: 'End' };
    const totalDist = typeof totalDistance === 'number' && !isNaN(totalDistance)
      ? totalDistance
      : (mapState.totalDistance || 0);

    const safeStops = Array.isArray(stops) ? stops : [];

    const allStops = [
      { name: startObj?.name || 'Start', distanceFromStart: 0 },
      ...safeStops.map((s, idx) => ({
        name: s?.name || `Stop ${idx + 1}`,
        distanceFromStart: (typeof s?.distanceFromStart === 'number' && !isNaN(s.distanceFromStart)) ? s.distanceFromStart : 0
      })),
      { name: endObj?.name || 'End', distanceFromStart: totalDist }
    ];
    if (!allStops[0]?.name || !allStops[allStops.length - 1]?.name || allStops.length < 2) {
      setFareMatrix(new Map());
      return;
    }
    
    for (let i = 0; i < allStops.length; i++) {
      const fromStop = allStops[i] || { name: `S${i}`, distanceFromStart: 0 };
      const stopMap = new Map();
      
      for (let j = i + 1; j < allStops.length; j++) {
        const toStop = allStops[j] || { name: `S${j}`, distanceFromStart: fromStop.distanceFromStart };
        const d1 = typeof toStop.distanceFromStart === 'number' ? toStop.distanceFromStart : 0;
        const d0 = typeof fromStop.distanceFromStart === 'number' ? fromStop.distanceFromStart : 0;
        const distance = Math.max(0, d1 - d0);
        
        // Calculate fare for different bus types
        const fares = {};
        Object.keys(busTypeFares).forEach(busType => {
          const policy = busTypeFares[busType];
          fares[busType] = Math.round((policy.baseFare + (distance * policy.farePerKm)) * 100) / 100;
        });
        
        stopMap.set(toStop?.name || `S${j}`, {
          distance,
          fares,
          fromIndex: i,
          toIndex: j
        });
      }
      
      if (stopMap.size > 0) {
        matrix.set(fromStop?.name || `S${i}`, stopMap);
      }
    }
    
    setFareMatrix(matrix);
  };

  const reorderStops = (fromIndex, toIndex) => {
    const newStops = [...mapState.intermediateStops];
    const [removed] = newStops.splice(fromIndex, 1);
    newStops.splice(toIndex, 0, removed);
    
    // Update sequences and distances
    const updatedStops = newStops.map((stop, index) => ({
      ...stop,
      sequence: index + 1,
      distanceFromStart: (mapState.totalDistance * (index / (newStops.length + 1)))
    }));
    
    setMapState(prev => ({
      ...prev,
      intermediateStops: updatedStops
    }));
    
    // Recalculate fare matrix
    calculateFareMatrix(updatedStops, mapState.totalDistance);
  };

  const addManualStop = async () => {
    if (!mapState.startLocation || !mapState.endLocation) {
      toast.error('Please select start and end locations first');
      return;
    }

    // For now, we'll add a stop at the midpoint
    // In a real implementation, you'd allow the user to click on the map
    const midLat = (mapState.startLocation.lat + mapState.endLocation.lat) / 2;
    const midLng = (mapState.startLocation.lng + mapState.endLocation.lng) / 2;
    
    const stopName = await getLocationName(midLat, midLng);
    const newStop = {
      stopId: `MANUAL_${Date.now()}`,
      name: stopName,
      lat: midLat,
      lng: midLng,
      sequence: mapState.intermediateStops.length + 1,
      distanceFromStart: mapState.totalDistance / 2,
      isManual: true
    };
    
    setMapState(prev => ({
      ...prev,
      intermediateStops: [...prev.intermediateStops, newStop]
    }));
    
    // Recalculate fare matrix
    calculateFareMatrix([...mapState.intermediateStops, newStop], mapState.totalDistance);
    toast.success('Manual stop added successfully');
  };

  const addCustomStop = (stop) => {
    const newStop = {
      stopId: `CUSTOM_${Date.now()}`,
      name: stop.name,
      lat: stop.lat,
      lng: stop.lng,
      sequence: mapState.intermediateStops.length + 1,
      distanceFromStart: stop.distanceFromStart,
      isCustom: true
    };
    
    setMapState(prev => ({
      ...prev,
      intermediateStops: [...prev.intermediateStops, newStop]
    }));
    
    // Recalculate fare matrix
    calculateFareMatrix([...mapState.intermediateStops, newStop], mapState.totalDistance);
  };

  const removeStop = (stopId) => {
    const updatedStops = mapState.intermediateStops.filter(stop => stop.stopId !== stopId);
    setMapState(prev => ({
      ...prev,
      intermediateStops: updatedStops
    }));
    
    // Recalculate fare matrix
    calculateFareMatrix(updatedStops, mapState.totalDistance);
  };

  const saveMapRoute = async () => {
    try {
      setLoading(true);
      
      // Transform intermediate stops to match backend Route schema requirements
      const totalDistanceKm = mapState.totalDistance || 0;
      const totalDurationMin = mapState.estimatedDuration || 0;
      const rawStops = Array.isArray(mapState.intermediateStops) ? mapState.intermediateStops : [];
      const transformedStops = rawStops.map((stop, index) => {
        const location = stop.name || `Stop ${index + 1}`;
        const city = (location && String(location).split(',')[0]) || `Stop ${index + 1}`;
        const distanceFromStart = typeof stop.distanceFromStart === 'number' && !isNaN(stop.distanceFromStart)
          ? stop.distanceFromStart
          : (totalDistanceKm * ((index + 1) / (rawStops.length + 1)));
        const estimatedArrival = totalDistanceKm > 0
          ? Math.round((distanceFromStart / totalDistanceKm) * totalDurationMin)
          : Math.round(totalDurationMin * ((index + 1) / (rawStops.length + 1)));
        return {
          city,
          location,
          stopNumber: index + 1,
          distanceFromStart,
          estimatedArrival,
          coordinates: {
            latitude: stop.lat,
            longitude: stop.lng
          }
        };
      });

      // Auto-generate a name if not provided
      const autoName = `${(mapState.startLocation?.name || 'Start').split(',')[0]} → ${(mapState.endLocation?.name || 'End').split(',')[0]}`;

      const routeData = {
        routeNumber: mapRouteForm.routeNumber,
        routeName: mapRouteForm.routeName || autoName,
        depotId: mapRouteForm.depotId,
        startingPoint: {
          city: mapState.startLocation.name.split(',')[0] || 'Unknown',
          location: mapState.startLocation.name,
          coordinates: { lat: mapState.startLocation.lat, lng: mapState.startLocation.lng }
        },
        endingPoint: {
          city: mapState.endLocation.name.split(',')[0] || 'Unknown',
          location: mapState.endLocation.name,
          coordinates: { lat: mapState.endLocation.lat, lng: mapState.endLocation.lng }
        },
        totalDistance: mapState.totalDistance,
        estimatedDuration: mapState.estimatedDuration,
        intermediateStops: transformedStops,
        baseFare: mapRouteForm.baseFare,
        farePerKm: mapRouteForm.farePerKm,
        busType: mapRouteForm.busType,
        features: mapRouteForm.features,
        fareMatrix: Array.from(fareMatrix.entries()),
        // Persist fare policy picked for this route for backend visibility
        farePolicy: busTypeFares[mapRouteForm.busType] ? {
          busType: mapRouteForm.busType,
          ...busTypeFares[mapRouteForm.busType]
        } : undefined,
        status: 'active',
        notes: mapRouteForm.notes,
        routePolyline: mapState.routePolyline
      };
      
      console.log('📝 Sending map-based route data:', routeData);
      
      const response = await apiFetch('/api/admin/routes', {
        method: 'POST',
        body: JSON.stringify(routeData)
      });
      
      console.log('📡 Map Route API Response:', response);
      
      // Enhanced response handling
      if (response && ((response.data && response.data.success) || response.ok || response.status === 201)) {
        const createdRoute = response.data || response.route || response;
        toast.success('✅ Map-based route saved successfully!');
        
        // Add the new route to the local state immediately for better UX
        if (createdRoute && createdRoute._id) {
          setRoutes(prev => [createdRoute, ...prev]);
        }
        
        setShowMapRouteModal(false);
        resetMapState();
        
        // Refresh data to ensure consistency
        setTimeout(() => fetchData(), 1000);
      } else {
        const errorMessage = response?.message || response?.error || 'Failed to save route';
        console.error('❌ Map Route creation failed:', response);
        toast.error(`Failed to save route: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error saving map route:', error);
      toast.error('Failed to save route');
    } finally {
      setLoading(false);
    }
  };

  const resetMapState = () => {
    setMapState({
      startLocation: null,
      endLocation: null,
      routePolyline: null,
      routeCoordinates: [],
      intermediateStops: [],
      totalDistance: 0,
      estimatedDuration: 0,
      isSelectingStart: true,
      mapCenter: [10.8505, 76.2711],
      zoom: 8
    });
    setMapRouteForm({
      routeNumber: '',
      routeName: '',
      depotId: '',
      busType: 'ordinary',
      baseFare: 0,
      farePerKm: 2.5,
      features: ['AC'],
      notes: '',
      scheduling: {
        frequency: 'daily',
        timeSlots: [],
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }
    });
    setFareMatrix(new Map());
  };

  // Export Routes Functionality
  const handleExportRoutes = async () => {
    try {
      setLoading(true);
      
      console.log('📊 Starting export process...');
      console.log('📋 Export filters:', exportFilters);
      console.log('📋 Export format:', exportFormat);
      
      // Filter routes based on export criteria
      let routesToExport = [...routes]; // Create a copy to avoid mutating original data
      
      console.log(`📊 Total routes before filtering: ${routesToExport.length}`);
      
      if (exportFilters.status !== 'all') {
        routesToExport = routesToExport.filter(route => route.status === exportFilters.status);
        console.log(`📊 Routes after status filter (${exportFilters.status}): ${routesToExport.length}`);
      }
      
      if (exportFilters.depot !== 'all') {
        routesToExport = routesToExport.filter(route => route.depot?.depotId === exportFilters.depot);
        console.log(`📊 Routes after depot filter: ${routesToExport.length}`);
      }
      
      if (exportFilters.dateRange.from && exportFilters.dateRange.to) {
        routesToExport = routesToExport.filter(route => {
          const routeDate = new Date(route.createdAt || route.updatedAt);
          const fromDate = new Date(exportFilters.dateRange.from);
          const toDate = new Date(exportFilters.dateRange.to);
          return routeDate >= fromDate && routeDate <= toDate;
        });
        console.log(`📊 Routes after date filter: ${routesToExport.length}`);
      }

      console.log(`📊 Final routes to export: ${routesToExport.length}`);

      if (routesToExport.length === 0) {
        toast.error('No routes found matching the export criteria');
        return;
      }

      // Export based on selected format
      if (exportFormat === 'csv') {
        await exportToCSV(routesToExport);
      } else if (exportFormat === 'excel') {
        await exportToExcel(routesToExport);
      } else if (exportFormat === 'json') {
        await exportToJSON(routesToExport);
      }

      toast.success(`✅ Successfully exported ${routesToExport.length} routes in ${exportFormat.toUpperCase()} format`);
      setShowExportModal(false);
      
    } catch (error) {
      console.error('❌ Error exporting routes:', error);
      toast.error(`Failed to export routes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (routesData) => {
    const headers = [
      'Route Number', 'Route Name', 'Starting Point', 'Ending Point', 
      'Distance (km)', 'Duration (min)', 'Base Fare (₹)', 'Fare per KM (₹)',
      'Status', 'Depot', 'Bus Type', 'Schedules Count', 'Stops Count', 'Created Date'
    ];
    
    const csvContent = [
      headers.join(','),
      ...routesData.map(route => [
        route.routeNumber,
        `"${route.routeName}"`,
        `"${route.startingPoint?.city || ''}"`,
        `"${route.endingPoint?.city || ''}"`,
        route.totalDistance || 0,
        route.estimatedDuration || 0,
        route.baseFare || 0,
        route.farePerKm || 0,
        route.status || 'active',
        `"${route.depot?.name || ''}"`,
        route.busType || 'ordinary',
        route.schedules?.length || 0,
        route.intermediateStops?.length || 0,
        new Date(route.createdAt || route.updatedAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    downloadFile(csvContent, 'routes-export.csv', 'text/csv');
  };

  const exportToExcel = async (routesData) => {
    // For Excel export, we'll create a CSV that can be opened in Excel
    // In a real implementation, you'd use a library like xlsx
    const headers = [
      'Route Number', 'Route Name', 'Starting Point', 'Ending Point', 
      'Distance (km)', 'Duration (min)', 'Base Fare (₹)', 'Fare per KM (₹)',
      'Status', 'Depot', 'Bus Type', 'Schedules Count', 'Stops Count', 'Created Date'
    ];
    
    const csvContent = [
      headers.join('\t'),
      ...routesData.map(route => [
        route.routeNumber,
        route.routeName,
        route.startingPoint?.city || '',
        route.endingPoint?.city || '',
        route.totalDistance || 0,
        route.estimatedDuration || 0,
        route.baseFare || 0,
        route.farePerKm || 0,
        route.status || 'active',
        route.depot?.name || '',
        route.busType || 'ordinary',
        route.schedules?.length || 0,
        route.intermediateStops?.length || 0,
        new Date(route.createdAt || route.updatedAt).toLocaleDateString()
      ].join('\t'))
    ].join('\n');

    downloadFile(csvContent, 'routes-export.xls', 'application/vnd.ms-excel');
  };

  const exportToJSON = (routesData) => {
    const jsonContent = JSON.stringify(routesData, null, 2);
    downloadFile(jsonContent, 'routes-export.json', 'application/json');
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Confirmation dialog functions
  const showConfirmation = (action, data, message) => {
    setConfirmAction(action);
    setConfirmData(data);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      setLoading(true);
      
      switch (confirmAction.type) {
        case 'kerala-auto-routes':
          await handleKeralaAutoRouteGeneration();
          break;
        case 'bulk-add-routes':
          await handleBulkRouteAdd();
          break;
        case 'bulk-operation':
          await handleBulkOperation();
          break;
        case 'export-routes':
          await handleExportRoutes();
          break;
        default:
          console.error('Unknown confirmation action:', confirmAction);
      }
    } catch (error) {
      console.error('Error executing confirmed action:', error);
      toast.error('Action failed');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmData(null);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmData(null);
  };

  const openEditModal = (route) => {
    setSelectedRoute(route);
    setRouteForm({
      ...route,
      depot: route.depot || { depotId: '', name: '' },
      busType: mapRouteBusTypeToFarePolicy(route.busType) // Convert to FarePolicy format for display
    });
    setShowEditModal(true);
  };

  // View Route Details Function
  const openRouteDetailsModal = (route) => {
    setSelectedRoute(route);
    setShowRouteDetailsModal(true);
  };

  // Complete Edit Route Function
  const handleEditRoute = async () => {
    try {
      setLoading(true);
      
      const updateData = {
        routeNumber: routeForm.routeNumber,
        routeName: routeForm.routeName,
        startingPoint: routeForm.startingPoint,
        endingPoint: routeForm.endingPoint,
        totalDistance: routeForm.totalDistance,
        estimatedDuration: routeForm.estimatedDuration,
        depotId: routeForm.depot.depotId,
        busType: mapFarePolicyToRouteBusType(routeForm.busType), // Convert back to Route model format
        baseFare: routeForm.baseFare,
        farePerKm: routeForm.farePerKm,
        status: routeForm.status,
        features: routeForm.features,
        notes: routeForm.notes,
        intermediateStops: routeForm.intermediateStops
      };
      
      console.log('🔍 Frontend sending update data:', updateData);
      console.log('🔍 Original bus type from form:', routeForm.busType);
      console.log('🔍 Mapped bus type for API:', mapFarePolicyToRouteBusType(routeForm.busType));
      
      const response = await apiFetch(`/api/admin/routes/${selectedRoute._id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      console.log('🔍 API Response:', response);
      
      if (response.data && response.data.success) {
        toast.success('Route updated successfully');
        setShowEditModal(false);
        fetchData(); // Refresh the routes list
      } else {
        console.error('❌ API Error Response:', response);
        toast.error(response.data?.error || response.error || 'Failed to update route');
      }
    } catch (error) {
      console.error('❌ Error updating route:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      toast.error(`Failed to update route: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Complete Delete Route Function
  const handleDeleteRoute = async (routeId) => {
    try {
      const route = routes.find(r => r._id === routeId);
      const routeName = route?.routeName || route?.routeNumber || 'this route';
      
      if (!window.confirm(`Are you sure you want to delete "${routeName}"? This action cannot be undone.`)) {
        return;
      }

      setLoading(true);
      
      const response = await apiFetch(`/api/admin/routes/${routeId}`, {
        method: 'DELETE'
      });

      if ((response.data && response.data.success)) {
        toast.success('Route deleted successfully');
        setRoutes(prev => prev.filter(r => r._id !== routeId));
        fetchData(); // Refresh the routes list
      } else {
        toast.error(response.data?.error || response.error || 'Failed to delete route');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      toast.error('Failed to delete route');
    } finally {
      setLoading(false);
    }
  };

  // Handle Route Map Editor
  const handleOpenRouteMapEditor = async (route) => {
    const hasCoords = !!(
      route?.startingPoint && (route.startingPoint.coordinates || (route.startingPoint.lat && route.startingPoint.lng)) &&
      route?.endingPoint && (route.endingPoint.coordinates || (route.endingPoint.lat && route.endingPoint.lng))
    );

    if (hasCoords) {
      setSelectedRoute(route);
      setShowRouteMapEditor(true);
      return;
    }

    try {
      setLoading(true);
      // Only fetch if coordinates missing
      const response = await apiFetch(`/api/admin/routes/${route._id}`);
      const full = response?.data?.route || response?.data || route;

      const normalized = {
        ...route,
        ...full,
        startingPoint: full?.startingPoint || route?.startingPoint || {},
        endingPoint: full?.endingPoint || route?.endingPoint || {},
        intermediateStops: full?.intermediateStops || route?.intermediateStops || [],
      };

      setSelectedRoute(normalized);
      setShowRouteMapEditor(true);
    } catch (err) {
      // Graceful fallback without surfacing API error
      setSelectedRoute(route);
      setShowRouteMapEditor(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle Conductor Pricing Dashboard
  const handleOpenConductorPricing = (route) => {
    setSelectedRoute(route);
    setShowConductorPricing(true);
  };

  // Save route with map updates
  const handleSaveRouteWithMap = async (updatedRoute) => {
    try {
      setLoading(true);
      
      const response = await apiFetch(`/api/admin/routes/${updatedRoute._id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedRoute)
      });

      if (response.data && response.data.success) {
        toast.success('Route updated successfully');
        setShowRouteMapEditor(false);
        fetchData(); // Refresh the routes list
      } else {
        toast.error(response.data?.error || 'Failed to update route');
      }
    } catch (error) {
      console.error('Error updating route:', error);
      toast.error('Failed to update route');
    } finally {
      setLoading(false);
    }
  };

  // Update conductor prices
  const handleUpdateConductorPrices = async (updatedRoute) => {
    try {
      setLoading(true);
      
      const response = await apiFetch(`/api/admin/routes/${updatedRoute._id}/prices`, {
        method: 'PUT',
        body: JSON.stringify({
          intermediateStops: updatedRoute.intermediateStops
        })
      });

      if (response.data && response.data.success) {
        toast.success('Conductor prices updated successfully');
        setShowConductorPricing(false);
        fetchData(); // Refresh the routes list
      } else {
        toast.error(response.data?.error || 'Failed to update prices');
      }
    } catch (error) {
      console.error('Error updating conductor prices:', error);
      toast.error('Failed to update conductor prices');
    } finally {
      setLoading(false);
    }
  };

  // Schedule Management Function
  const handleScheduleManagement = (route) => {
    setSelectedRoute(route);
    setShowScheduleModal(true);
  };

  // Removed demo routes - now using real data from database

  // Filter routes based on search and status
  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.routeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.startingPoint?.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.endingPoint?.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
    const matchesDepot = depotFilter === 'all' || route.depot?.depotId === depotFilter;
    
    return matchesSearch && matchesStatus && matchesDepot;
  });

  const RouteCard = ({ route }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={selectedRoutes.includes(route._id)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedRoutes([...selectedRoutes, route._id]);
              } else {
                setSelectedRoutes(selectedRoutes.filter(id => id !== route._id));
              }
            }}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <div className="p-2 bg-green-100 rounded-lg">
            <span className="w-5 h-5 text-green-600">🚌</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{route.routeNumber}</h3>
            <p className="text-sm text-gray-500">{route.routeName}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          route.status === 'active' ? 'bg-green-100 text-green-800' :
          route.status === 'inactive' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {route.status}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="w-4 h-4">📍</span>
          <span>{route.startingPoint?.city} → {route.endingPoint?.city}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="w-4 h-4">🧭</span>
          <span>{route.totalDistance} km • {Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="w-4 h-4">💰</span>
          <span>Base: ₹{route.baseFare} • Per km: ₹{route.farePerKm}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span className="w-4 h-4">🚌</span>
          <span>{route.schedules?.length || 0} schedules • {route.intermediateStops?.length || 0} stops</span>
        </div>
        
        {route.busType && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="w-4 h-4">🚐</span>
            <span className="capitalize">{getBusTypeDisplayName(route.busType)}</span>
          </div>
        )}
      </div>

      {route.features && route.features.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {route.features.map((feature, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex space-x-2">
          <button
            onClick={() => handleOpenRouteMapEditor(route)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit Route on Map"
          >
            <MapIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenConductorPricing(route)}
            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            title="Conductor Pricing"
          >
            <DollarSign className="w-4 h-4" />
          </button>
          <button
            onClick={() => openEditModal(route)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Route"
          >
            <span className="w-4 h-4">✏️</span>
          </button>
          <button
            onClick={() => handleScheduleManagement(route)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Manage Schedules"
          >
            <span className="w-4 h-4">📅</span>
          </button>
          <button
            onClick={() => handleDeleteRoute(route._id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Route"
          >
            <span className="w-4 h-4">🗑️</span>
          </button>
          <button
            onClick={() => openRouteDetailsModal(route)}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="View Details"
          >
            <span className="w-4 h-4">👁️</span>
          </button>
        </div>
        <div className="text-xs text-gray-500">
          {route.depot?.depotName || route.depot?.name || 'No Depot'}
        </div>
      </div>
    </motion.div>
  );

  // Kerala Routes Modal Component
  const KeralaRoutesModal = () => {
    const [filteredDepots, setFilteredDepots] = useState(Object.keys(keralaRoutesData));
    const [filteredRoutes, setFilteredRoutes] = useState([]);

    // Filter depots based on search
    useEffect(() => {
      const filtered = Object.keys(keralaRoutesData).filter(depotName =>
        depotSearch === '' || depotName.toLowerCase().includes(depotSearch.toLowerCase())
      );
      setFilteredDepots(filtered);
    }, [depotSearch, keralaRoutesData]);

    // Filter routes when search changes
    useEffect(() => {
      let allRoutes = [];
      
      filteredDepots.forEach(depotName => {
        const routes = keralaRoutesData[depotName] || [];
        routes.forEach(route => {
          if (
            (routeSearch === '' || 
             route.from.toLowerCase().includes(routeSearch.toLowerCase()) ||
             route.to.toLowerCase().includes(routeSearch.toLowerCase()) ||
             depotName.toLowerCase().includes(routeSearch.toLowerCase())) &&
            (routeTypeFilter === 'all' || route.type === routeTypeFilter)
          ) {
            allRoutes.push({
              ...route,
              depot: depotName,
              routeId: `${depotName}-${route.from}-${route.to}`
            });
          }
        });
      });
      
      setFilteredRoutes(allRoutes);
    }, [filteredDepots, routeSearch, routeTypeFilter]);

    // Handle adding selected routes
    const handleAddSelectedRoutes = async () => {
      if (selectedDepotRoutes.length === 0) {
        toast.error('Please select routes to add');
        return;
      }

      try {
        setLoading(true);
        
        // Debug: Check what depots are available
        console.log('🔍 Available depots:', depots);
        console.log('🔍 Selected routes:', selectedDepotRoutes);
        console.log('🔍 Filtered routes:', filteredRoutes);
        
        // Get the first available depot as default if no depot matches
        const defaultDepot = depots.length > 0 ? depots[0] : null;
        
        if (!defaultDepot) {
          console.log('❌ No depots found in system - attempting to create depot');
          
          try {
            // Try to create a depot first
            const depotData = {
              depotName: 'Kerala Main Depot',
              depotCode: 'KERALA_MAIN',
              location: {
                city: 'Thiruvananthapuram',
                state: 'Kerala',
                coordinates: { latitude: 8.5241, longitude: 76.9366 }
              },
              contactInfo: {
                phone: '+91-471-2321132',
                email: 'keralamain@yatrik.com'
              },
              capacity: {
                buses: 100,
                staff: 50
              },
              status: 'active'
            };
            
            console.log('🔧 Creating depot:', depotData);
            const depotResponse = await apiFetch('/api/admin/depots', {
              method: 'POST',
              body: JSON.stringify(depotData)
            });
            
            if (depotResponse.success && depotResponse.data) {
              console.log('✅ Depot created successfully:', depotResponse.data);
              const newDepot = depotResponse.data;
              
              // Use the newly created depot
              const routesToCreate = selectedDepotRoutes.map(routeId => {
                const route = filteredRoutes.find(r => r.routeId === routeId);
                console.log('🔍 Processing route with new depot:', route);
                
                // Map route type to KSRTC bus type
                const busType = mapRouteTypeToBusType(route.type);
                
                // Get fare from fare policy
                const fareData = getFareFromPolicy(busType, route.distance);
                
                const routeData = {
                  routeNumber: `KL-${route.from.substr(0,3).toUpperCase()}-${route.to.substr(0,3).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`,
                  routeName: `${route.from} to ${route.to}`,
                  startingPoint: {
                    city: route.from,
                    location: `${route.from} Bus Station`,
                    coordinates: { latitude: 0, longitude: 0 }
                  },
                  endingPoint: {
                    city: route.to,
                    location: `${route.to} Bus Station`,
                    coordinates: { latitude: 0, longitude: 0 }
                  },
                  totalDistance: route.distance,
                  estimatedDuration: route.duration,
                  depot: {
                    depotId: newDepot._id,
                    depotName: newDepot.depotName,
                    depotLocation: newDepot.location.city + ', ' + newDepot.location.state
                  },
                  busType: busType,
                  baseFare: fareData.baseFare,
                  farePerKm: fareData.farePerKm,
                  status: 'active',
                  features: [route.type, 'Kerala Route'],
                  notes: `Auto-generated Kerala route: ${route.type}`,
                  intermediateStops: []
                };
                
                console.log('🔍 Route data to create with new depot:', routeData);
                return routeData;
              });
              
              // Create routes with the new depot
              let successCount = 0;
              let errorCount = 0;
              
              for (const routeData of routesToCreate) {
                try {
                  const response = await apiFetch('/api/admin/routes', {
                    method: 'POST',
                    body: JSON.stringify(routeData)
                  });
                  
                  if ((response.data && response.data.success)) {
                    successCount++;
                    console.log(`✅ Created route: ${routeData.routeName}`);
                  } else {
                    errorCount++;
                    console.error(`❌ Failed to create route: ${routeData.routeName}`, response.message);
                  }
                } catch (error) {
                  errorCount++;
                  console.error(`❌ Error creating route ${routeData.routeName}:`, error);
                }
              }

              if (successCount > 0) {
                toast.success(`Successfully created ${successCount} routes with new Kerala Main Depot.`);
                setSelectedDepotRoutes([]);
                setShowKeralaRoutesModal(false);
                await fetchData();
              } else {
                toast.error(`Failed to create any routes. ${errorCount} errors occurred.`);
              }
              
              setLoading(false);
              return;
              
            } else {
              console.log('❌ Failed to create depot, falling back to temporary approach');
              throw new Error('Failed to create depot');
            }
            
          } catch (depotError) {
            console.log('❌ Depot creation failed:', depotError.message);
            console.log('🔄 Falling back to temporary depot approach');
          }
          
          // Fallback: Create a temporary depot for route creation
          // Generate a valid MongoDB ObjectId format
          const generateObjectId = () => {
            const timestamp = Math.floor(Date.now() / 1000).toString(16);
            const random = Math.random().toString(16).substring(2, 14);
            const counter = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
            return timestamp + random + counter;
          };
          
          const tempDepot = {
            _id: generateObjectId(),
            depotName: 'Kerala Main Depot',
            name: 'Kerala Main Depot',
            location: { city: 'Thiruvananthapuram', state: 'Kerala' }
          };
          
          console.log('✅ Created temporary depot:', tempDepot);
          
          // Use the temporary depot
          const routesToCreate = selectedDepotRoutes.map(routeId => {
            const route = filteredRoutes.find(r => r.routeId === routeId);
            console.log('🔍 Processing route with temp depot:', route);
            
            // Map route type to KSRTC bus type
            const busType = mapRouteTypeToBusType(route.type);
            
            // Get fare from fare policy
            const fareData = getFareFromPolicy(busType, route.distance);
            
            const routeData = {
              routeNumber: `KL-${route.from.substr(0,3).toUpperCase()}-${route.to.substr(0,3).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`,
              routeName: `${route.from} to ${route.to}`,
              startingPoint: {
                city: route.from,
                location: `${route.from} Bus Station`,
                coordinates: { latitude: 0, longitude: 0 }
              },
              endingPoint: {
                city: route.to,
                location: `${route.to} Bus Station`,
                coordinates: { latitude: 0, longitude: 0 }
              },
              totalDistance: route.distance,
              estimatedDuration: route.duration,
              depot: {
                depotId: tempDepot._id,
                depotName: tempDepot.depotName,
                depotLocation: tempDepot.location.city + ', ' + tempDepot.location.state
              },
              busType: busType,
              baseFare: fareData.baseFare,
              farePerKm: fareData.farePerKm,
              status: 'active',
              features: [route.type, 'Kerala Route'],
              notes: `Auto-generated Kerala route: ${route.type}`,
              intermediateStops: []
            };
            
            console.log('🔍 Route data to create with temp depot:', routeData);
            return routeData;
          });
          
          // Create routes with temporary depot
          let successCount = 0;
          let errorCount = 0;
          
          for (const routeData of routesToCreate) {
            try {
              const response = await apiFetch('/api/admin/routes', {
                method: 'POST',
                body: JSON.stringify(routeData)
              });
              
              if ((response.data && response.data.success)) {
                successCount++;
                console.log(`✅ Created route: ${routeData.routeName}`);
              } else {
                errorCount++;
                console.error(`❌ Failed to create route: ${routeData.routeName}`, response.message);
              }
            } catch (error) {
              errorCount++;
              console.error(`❌ Error creating route ${routeData.routeName}:`, error);
            }
          }

          if (successCount > 0) {
            toast.success(`Successfully created ${successCount} routes with temporary depot. Please create proper depots for better organization.`);
            setSelectedDepotRoutes([]);
            setShowKeralaRoutesModal(false);
            await fetchData();
          } else {
            toast.error(`Failed to create any routes. ${errorCount} errors occurred.`);
          }
          
          setLoading(false);
          return;
        }
        
        console.log('✅ Using default depot:', defaultDepot);
        
        const routesToCreate = selectedDepotRoutes.map(routeId => {
          const route = filteredRoutes.find(r => r.routeId === routeId);
          console.log('🔍 Processing route:', route);
          
          // Try to find matching depot, fallback to default
          const depot = depots.find(d => 
            d.depotName === route.depot || 
            d.name === route.depot ||
            d.depotName?.toLowerCase().includes(route.depot.toLowerCase()) ||
            d.name?.toLowerCase().includes(route.depot.toLowerCase())
          ) || defaultDepot;
          
          console.log('🔍 Found depot for route:', depot);
          
          // Map route type to KSRTC bus type
          const busType = mapRouteTypeToBusType(route.type);
          
          // Get fare from fare policy
          const fareData = getFareFromPolicy(busType, route.distance);
          
          const routeData = {
            routeNumber: `KL-${route.from.substr(0,3).toUpperCase()}-${route.to.substr(0,3).toUpperCase()}-${Math.floor(Math.random() * 900) + 100}`,
            routeName: `${route.from} to ${route.to}`,
            startingPoint: {
              city: route.from,
              location: `${route.from} Bus Station`,
              coordinates: { latitude: 0, longitude: 0 }
            },
            endingPoint: {
              city: route.to,
              location: `${route.to} Bus Station`,
              coordinates: { latitude: 0, longitude: 0 }
            },
            totalDistance: route.distance,
            estimatedDuration: route.duration,
            depot: {
              depotId: depot._id,
              depotName: depot.depotName || depot.name || route.depot,
              depotLocation: depot.location?.city + ', ' + depot.location?.state || 'Kerala, India'
            },
            busType: busType,
            baseFare: fareData.baseFare,
            farePerKm: fareData.farePerKm,
            status: 'active',
            features: [route.type, 'Kerala Route'],
            notes: `Auto-generated Kerala route: ${route.type}`,
            intermediateStops: []
          };
          
          console.log('🔍 Route data to create:', routeData);
          return routeData;
        });

        // Create routes in batches
        let successCount = 0;
        let errorCount = 0;
        
        for (const routeData of routesToCreate) {
          try {
            const response = await apiFetch('/api/admin/routes', {
              method: 'POST',
              body: JSON.stringify(routeData)
            });
            
            if ((response.data && response.data.success)) {
              successCount++;
              console.log(`✅ Created route: ${routeData.routeName}`);
            } else {
              errorCount++;
              console.error(`❌ Failed to create route: ${routeData.routeName}`, response.message);
            }
          } catch (error) {
            errorCount++;
            console.error(`❌ Error creating route ${routeData.routeName}:`, error);
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} routes`);
          setSelectedDepotRoutes([]);
          setShowKeralaRoutesModal(false);
          await fetchData();
        } else {
          toast.error(`Failed to create any routes. ${errorCount} errors occurred.`);
        }
        
      } catch (error) {
        console.error('Error creating Kerala routes:', error);
        toast.error('Failed to create routes: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    const getRouteTypeColor = (type) => {
      switch (type) {
        case 'intercity': return 'bg-blue-100 text-blue-800';
        case 'interstate': return 'bg-purple-100 text-purple-800';
        case 'hill_station': return 'bg-green-100 text-green-800';
        case 'seasonal': return 'bg-orange-100 text-orange-800';
        case 'tourist': return 'bg-pink-100 text-pink-800';
        case 'airport': return 'bg-indigo-100 text-indigo-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <AnimatePresence>
        {showKeralaRoutesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowKeralaRoutesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <span className="w-6 h-6 text-indigo-600">🗺️</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">Kerala Routes Database</h3>
                      <p className="text-gray-600">Browse and add predefined Kerala depot routes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowKeralaRoutesModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-auto max-h-[calc(90vh-180px)]">
                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Routes</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by route or location..."
                        value={routeSearch}
                        onChange={(e) => setRouteSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Depots</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search depots..."
                        value={depotSearch}
                        onChange={(e) => setDepotSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Route Type</label>
                    <select
                      value={routeTypeFilter}
                      onChange={(e) => setRouteTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="intercity">Intercity</option>
                      <option value="interstate">Interstate</option>
                      <option value="hill_station">Hill Station</option>
                      <option value="seasonal">Seasonal</option>
                      <option value="tourist">Tourist</option>
                      <option value="airport">Airport</option>
                    </select>
                  </div>
                </div>

                {/* Selected Routes Counter */}
                {selectedDepotRoutes.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-800 font-medium">{selectedDepotRoutes.length} routes selected</span>
                        <button
                          onClick={() => setSelectedDepotRoutes([])}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Clear selection
                        </button>
                      </div>
                      <button
                        onClick={handleAddSelectedRoutes}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span>Add Selected Routes</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Routes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRoutes.map((route) => (
                    <div
                      key={route.routeId}
                      className={`border rounded-lg p-4 transition-all cursor-pointer ${
                        selectedDepotRoutes.includes(route.routeId)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedDepotRoutes(prev =>
                          prev.includes(route.routeId)
                            ? prev.filter(id => id !== route.routeId)
                            : [...prev, route.routeId]
                        );
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{route.from} → {route.to}</h4>
                          <p className="text-sm text-gray-600">{route.depot}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedDepotRoutes.includes(route.routeId)}
                          onChange={() => {}}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Distance:</span>
                          <span className="font-medium">{route.distance} km</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium">{Math.floor(route.duration / 60)}h {route.duration % 60}m</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Type:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRouteTypeColor(route.type)}`}>
                            {route.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredRoutes.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">🔍</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No routes found</h3>
                    <p className="text-gray-600">Try adjusting your search criteria</p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {filteredRoutes.length} routes available • {Object.keys(keralaRoutesData).length} depots
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowKeralaRoutesModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                    {selectedDepotRoutes.length > 0 && (
                      <button
                        onClick={handleAddSelectedRoutes}
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        <span>Add {selectedDepotRoutes.length} Routes</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const SingleAddModal = () => (
    <AnimatePresence>
      {showSingleAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowSingleAddModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Add Single Route</h3>
                <button
                  onClick={() => setShowSingleAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="w-6 h-6 text-gray-400 hover:text-gray-600">✕</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Number *
                  </label>
                  <input
                    type="text"
                    value={routeForm.routeNumber}
                    onChange={(e) => setRouteForm(prev => ({ ...prev, routeNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="R001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Depot *
                  </label>
                  <select
                    value={routeForm.depot.depotId}
                    onChange={(e) => {
                      const selectedDepot = depots.find(d => d._id === e.target.value);
                      setRouteForm(prev => ({ 
                        ...prev, 
                        depot: { 
                          depotId: e.target.value, 
                          name: selectedDepot?.depotName || '' 
                        } 
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Depot</option>
                    {depots.map(depot => (
                      <option key={depot._id} value={depot._id}>{depot.depotName}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting City *
                  </label>
                  <input
                    type="text"
                    value={routeForm.startingPoint.city}
                    onChange={(e) => setRouteForm(prev => ({ 
                      ...prev, 
                      startingPoint: { ...prev.startingPoint, city: e.target.value } 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Thiruvananthapuram"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ending City *
                  </label>
                  <input
                    type="text"
                    value={routeForm.endingPoint.city}
                    onChange={(e) => setRouteForm(prev => ({ 
                      ...prev, 
                      endingPoint: { ...prev.endingPoint, city: e.target.value } 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Kochi"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bus Type
                  </label>
                  <select
                    value={routeForm.busType}
                    onChange={(e) => {
                      const newBusType = e.target.value;
                      // Find the fare policy for the selected bus type
                      const policy = farePolicies.find(p => p.busType === newBusType && p.isActive);
                      let newBaseFare = routeForm.baseFare;
                      let newFarePerKm = routeForm.farePerKm;
                      
                      if (policy && routeForm.totalDistance > 0) {
                        // Calculate new base fare based on distance and new policy
                        const calculatedBaseFare = Math.max(
                          routeForm.totalDistance * policy.ratePerKm,
                          policy.minimumFare
                        );
                        newBaseFare = Math.round(calculatedBaseFare);
                        newFarePerKm = policy.ratePerKm;
                      }
                      
                      setRouteForm(prev => ({ 
                        ...prev, 
                        busType: newBusType,
                        baseFare: newBaseFare,
                        farePerKm: newFarePerKm
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="City / Ordinary">Ordinary</option>
                    <option value="Fast Passenger / LSFP">Fast Passenger</option>
                    <option value="Super Fast Passenger">Super Fast</option>
                    <option value="A/C Low Floor">AC Low Floor</option>
                    <option value="Luxury / Hi-tech & AC">Volvo</option>
                    <option value="Garuda Maharaja / Garuda King / Multi-axle Premium">Garuda</option>
                    <option value="Garuda Sanchari / Biaxle Premium">Garuda Sanchari</option>
                    <option value="Super Deluxe">Super Deluxe</option>
                    <option value="Super Express">Super Express</option>
                    <option value="City Fast">City Fast</option>
                    <option value="Non A/C Low Floor">Non AC Low Floor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    value={routeForm.totalDistance}
                    onChange={(e) => {
                      const newDistance = parseInt(e.target.value) || 0;
                      // Recalculate fare when distance changes
                      const policy = farePolicies.find(p => p.busType === routeForm.busType && p.isActive);
                      let newBaseFare = routeForm.baseFare;
                      let newFarePerKm = routeForm.farePerKm;
                      
                      if (policy && newDistance > 0) {
                        const calculatedBaseFare = Math.max(
                          newDistance * policy.ratePerKm,
                          policy.minimumFare
                        );
                        newBaseFare = Math.round(calculatedBaseFare);
                        newFarePerKm = policy.ratePerKm;
                      }
                      
                      setRouteForm(prev => ({ 
                        ...prev, 
                        totalDistance: newDistance,
                        baseFare: newBaseFare,
                        farePerKm: newFarePerKm
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fare Per KM (₹)
                  </label>
                  <input
                    type="number"
                    value={routeForm.farePerKm}
                    onChange={(e) => setRouteForm(prev => ({ ...prev, farePerKm: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2.5"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-calculated based on bus type</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Fare (₹)
                  </label>
                  <input
                    type="number"
                    value={routeForm.baseFare}
                    onChange={(e) => setRouteForm(prev => ({ ...prev, baseFare: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="300"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowSingleAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSingleRouteAdd}
                  disabled={loading || !routeForm.routeNumber || !routeForm.depot.depotId || !routeForm.startingPoint.city || !routeForm.endingPoint.city}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Add Route</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const BulkAddModal = () => (
    <AnimatePresence>
      {showBulkAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowBulkAddModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Bulk Add Routes</h3>
                <button
                  onClick={() => setShowBulkAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="w-6 h-6 text-gray-400 hover:text-gray-600">✕</span>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Depot *
                  </label>
                  <select
                    value={bulkForm.depotId}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, depotId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Depot</option>
                    {depots.map(depot => (
                      <option key={depot._id} value={depot._id}>{depot.depotName}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Type
                  </label>
                  <select
                    value={bulkForm.routeType}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, routeType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="intercity">Intercity</option>
                    <option value="intracity">Intracity</option>
                    <option value="express">Express</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Routes *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={bulkForm.count}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={bulkForm.startNumber}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, startNumber: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Prefix
                  </label>
                  <input
                    type="text"
                    value={bulkForm.prefix}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, prefix: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="R"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fare per KM (₹)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={bulkForm.farePerKm}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, farePerKm: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Date for Scheduling
                  </label>
                  <input 
                    type="date" 
                    value={bulkForm.targetDate} 
                    onChange={(e) => setBulkForm(prev => ({ ...prev, targetDate: e.target.value }))} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Preview:</h4>
                <p className="text-blue-700 text-sm">
                  Will create routes: {bulkForm.prefix}{String(bulkForm.startNumber).padStart(3, '0')} to {bulkForm.prefix}{String(bulkForm.startNumber + bulkForm.count - 1).padStart(3, '0')}
                </p>
                <p className="text-blue-700 text-sm">
                  Type: {bulkForm.routeType}, Distance: {bulkForm.distanceRange.min}-{bulkForm.distanceRange.max}km, Fare: ₹{bulkForm.farePerKm}/km
                </p>
              </div>
              
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowBulkAddModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkRouteAdd}
                  disabled={loading || !bulkForm.depotId}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Add {bulkForm.count} Routes</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const MapRouteModal = () => (
    <AnimatePresence>
      {showMapRouteModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100000]"
          onClick={() => setShowMapRouteModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden z-[100001]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Create Route with Map</h3>
                <button
                  onClick={() => setShowMapRouteModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="w-6 h-6 text-gray-400 hover:text-gray-600">✕</span>
                </button>
              </div>
            </div>
            
            <div className="flex h-[calc(95vh-120px)]">
              {/* Map Panel - Left Side */}
              <div className="flex-1 bg-gray-100 relative">
                <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-5 h-5 text-blue-600">🗺️</span>
                    <span className="font-semibold text-gray-900">Route Creation</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {mapState.isSelectingStart ? (
                      <span className="text-green-600">📍 Click on map to select START location</span>
                    ) : (
                      <span className="text-red-600">📍 Click on map to select END location</span>
                    )}
                  </div>
                  {mapState.startLocation && (
                    <div className="text-xs text-gray-500 mt-1">
                      Start: {mapState.startLocation.name}
                    </div>
                  )}
                </div>
                
                {/* Map Container */}
                <div 
                  id="route-map" 
                  className="w-full h-full"
                  style={{ minHeight: '600px' }}
                />
                
                {/* Route Summary Overlay */}
                {mapState.startLocation && mapState.endLocation && (
                  <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-sm">
                    <h4 className="font-semibold text-gray-900 mb-2">Route Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 text-green-600">🧭</span>
                        <span>{mapState.totalDistance.toFixed(1)} km</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 text-blue-600">⏱️</span>
                        <span>{mapState.estimatedDuration.toFixed(0)} min</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 text-purple-600">📍</span>
                        <span>{mapState.intermediateStops.length} stops</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Form Panel - Right Side */}
              <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Route Details */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Route Details</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Route Number *
                        </label>
                        <input
                          type="text"
                          value={mapRouteForm.routeNumber}
                          onChange={(e) => setMapRouteForm(prev => ({ ...prev, routeNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="R001"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Route Name *
                        </label>
                        <input
                          type="text"
                          value={mapRouteForm.routeName}
                          onChange={(e) => setMapRouteForm(prev => ({ ...prev, routeName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Auto-generated from map"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Depot *
                        </label>
                        <select
                          value={mapRouteForm.depotId}
                          onChange={(e) => setMapRouteForm(prev => ({ ...prev, depotId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Depot</option>
                          {depots.map(depot => (
                            <option key={depot._id} value={depot._id}>{depot.depotName}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bus Type
                        </label>
                        <select
                          value={mapRouteForm.busType}
                          onChange={(e) => {
                            const selectedType = e.target.value;
                            const policy = busTypeFares[selectedType] || {};
                            setMapRouteForm(prev => ({
                              ...prev,
                              busType: selectedType,
                              baseFare: typeof policy.baseFare === 'number' ? policy.baseFare : prev.baseFare,
                              farePerKm: typeof policy.farePerKm === 'number' ? policy.farePerKm : prev.farePerKm
                            }));
                            // Recompute fare matrix preview with new policy
                            calculateFareMatrix(mapState.intermediateStops, mapState.totalDistance);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="ordinary">Ordinary</option>
                          <option value="fast_passenger">Fast Passenger</option>
                          <option value="super_fast">Super Fast</option>
                          <option value="ac">AC</option>
                          <option value="volvo">Volvo</option>
                          <option value="garuda">Garuda</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Route Stops */}
                  {(mapState.intermediateStops.length > 0 || mapState.startLocation) && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">Route Stops</h4>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={addManualStop}
                            disabled={!mapState.startLocation || !mapState.endLocation}
                            className="text-green-600 hover:text-green-800 text-sm font-medium disabled:text-gray-400"
                          >
                            Add Stop
                          </button>
                          <button
                            onClick={() => setShowFareMatrixModal(true)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Preview Fare Matrix
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {mapState.intermediateStops.map((stop, index) => (
                          <div key={stop.stopId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <span className="w-4 h-4 text-gray-400 cursor-move">⋮⋮</span>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <div className="font-medium text-sm text-gray-900">{stop.name}</div>
                                {stop.isManual && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                    Manual
                                  </span>
                                )}
                                {stop.isAutoGenerated && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    Auto
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {stop.distanceFromStart.toFixed(1)} km from start • Stop #{stop.sequence}
                              </div>
                            </div>
                            <button
                              onClick={() => removeStop(stop.stopId)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove stop"
                            >
                              <span className="w-4 h-4 text-red-600 hover:text-red-800">✕</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Fare Configuration */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Fare Configuration</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Base Fare (₹)
                        </label>
                        <input
                          type="number"
                          value={mapRouteForm.baseFare}
                          onChange={(e) => setMapRouteForm(prev => ({ ...prev, baseFare: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fare per KM (₹)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={mapRouteForm.farePerKm}
                          onChange={(e) => setMapRouteForm(prev => ({ ...prev, farePerKm: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowMapRouteModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveMapRoute}
                      disabled={loading || !mapRouteForm.routeNumber || !mapRouteForm.depotId || !mapState.startLocation || !mapState.endLocation}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span className="w-4 h-4">💾</span>}
                      <span>Save Route</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const FareMatrixModal = () => (
    <AnimatePresence>
      {showFareMatrixModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowFareMatrixModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Fare Matrix Preview</h3>
                <button
                  onClick={() => setShowFareMatrixModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="w-6 h-6 text-gray-400 hover:text-gray-600">✕</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Route: {mapRouteForm.routeName}</h4>
                <p className="text-sm text-gray-600">
                  Total Distance: {mapState.totalDistance.toFixed(1)} km | 
                  Duration: {mapState.estimatedDuration.toFixed(0)} min
                </p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From Stop
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        To Stop
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Distance (km)
                      </th>
                      {Object.keys(busTypeFares).map(busType => (
                        <th key={busType} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {busType.replace('_', ' ').toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.from(fareMatrix.entries()).map(([fromStop, toStopsMap]) =>
                      Array.from(toStopsMap.entries()).map(([toStop, data]) => (
                        <tr key={`${fromStop}-${toStop}`}>
                          <td className="px-4 py-3 text-sm text-gray-900">{fromStop}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{toStop}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{data.distance.toFixed(1)}</td>
                          {Object.keys(busTypeFares).map(busType => (
                            <td key={busType} className="px-4 py-3 text-center text-sm text-gray-900">
                              ₹{data.fares[busType]?.toFixed(0) || 0}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowFareMatrixModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const KeralaAutoRouteModal = () => (
    <AnimatePresence>
      {showKeralaAutoModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowKeralaAutoModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">🚌 Kerala Auto Route Generation</h3>
                <button
                  onClick={() => setShowKeralaAutoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="w-6 h-6 text-gray-400 hover:text-gray-600">✕</span>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Automatically generate routes connecting all major Kerala destinations with trips
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Depot Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Depot *
                </label>
                <select
                  value={keralaAutoForm.depotId}
                  onChange={(e) => setKeralaAutoForm(prev => ({ ...prev, depotId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Depot</option>
                  {depots.map(depot => (
                    <option key={depot._id} value={depot._id}>{depot.depotName}</option>
                  ))}
                </select>
              </div>

              {/* Bus Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bus Types
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['ordinary', 'fast_passenger', 'ac', 'volvo', 'garuda'].map(busType => (
                    <label key={busType} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={keralaAutoForm.busTypes.includes(busType)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setKeralaAutoForm(prev => ({
                              ...prev,
                              busTypes: [...prev.busTypes, busType]
                            }));
                          } else {
                            setKeralaAutoForm(prev => ({
                              ...prev,
                              busTypes: prev.busTypes.filter(type => type !== busType)
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">{busType.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fare Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Fare (₹)
                  </label>
                  <input
                    type="number"
                    value={keralaAutoForm.baseFare}
                    onChange={(e) => setKeralaAutoForm(prev => ({ ...prev, baseFare: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fare per KM (₹)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={keralaAutoForm.farePerKm}
                    onChange={(e) => setKeralaAutoForm(prev => ({ ...prev, farePerKm: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Time Slots
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {keralaAutoForm.timeSlots.map((timeSlot, index) => (
                    <input
                      key={index}
                      type="time"
                      value={timeSlot}
                      onChange={(e) => {
                        const newTimeSlots = [...keralaAutoForm.timeSlots];
                        newTimeSlots[index] = e.target.value;
                        setKeralaAutoForm(prev => ({ ...prev, timeSlots: newTimeSlots }));
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ))}
                </div>
                <div className="mt-2">
                  <button
                    onClick={() => setKeralaAutoForm(prev => ({ 
                      ...prev, 
                      timeSlots: [...prev.timeSlots, '08:00'] 
                    }))}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Time Slot
                  </button>
                </div>
              </div>

              {/* Days of Week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operating Days
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={keralaAutoForm.daysOfWeek.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setKeralaAutoForm(prev => ({
                              ...prev,
                              daysOfWeek: [...prev.daysOfWeek, day]
                            }));
                          } else {
                            setKeralaAutoForm(prev => ({
                              ...prev,
                              daysOfWeek: prev.daysOfWeek.filter(d => d !== day)
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 capitalize">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={keralaAutoForm.generateTrips}
                    onChange={(e) => setKeralaAutoForm(prev => ({ ...prev, generateTrips: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Generate trips automatically</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={keralaAutoForm.autoAssignBuses}
                    onChange={(e) => setKeralaAutoForm(prev => ({ ...prev, autoAssignBuses: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Auto-assign buses to trips</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={keralaAutoForm.autoAssignCrew}
                    onChange={(e) => setKeralaAutoForm(prev => ({ ...prev, autoAssignCrew: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Auto-assign crew to trips</span>
                </label>
              </div>

              {/* Preview */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">📊 Generation Preview:</h4>
                <div className="text-blue-700 text-sm space-y-1">
                  <p>• Destinations: {keralaDestinations.length} major Kerala cities</p>
                  <p>• Time Slots: {keralaAutoForm.timeSlots.length} departures per day</p>
                  <p>• Operating Days: {keralaAutoForm.daysOfWeek.length} days per week</p>
                  
                  {keralaAutoForm.selectedDepots.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-blue-800">Depot-wise Route Distribution:</p>
                      {keralaAutoForm.selectedDepots.map(depotId => {
                        const depot = depots.find(d => d._id === depotId);
                        const depotConfig = keralaAutoForm.depotConfigs[depotId];
                        const routesPerDepot = depotConfig ? 
                          (keralaDestinations.length * (keralaDestinations.length - 1) / 2 * depotConfig.busTypes.length) : 0;
                        const tripsPerDepot = depotConfig && keralaAutoForm.generateTrips ? 
                          routesPerDepot * keralaAutoForm.timeSlots.length * keralaAutoForm.daysOfWeek.length : 0;
                        
                        return (
                          <div key={depotId} className="ml-4 mt-1">
                            <p>• <strong>{depot?.depotName}</strong>: {routesPerDepot} routes ({depotConfig?.busTypes.length || 0} bus types)</p>
                            {keralaAutoForm.generateTrips && (
                              <p className="ml-4">  → {tripsPerDepot} trips will be generated</p>
                            )}
                          </div>
                        );
                      })}
                      
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <p className="font-medium">• <strong>Total Routes:</strong> {keralaAutoForm.selectedDepots.reduce((total, depotId) => {
                          const depotConfig = keralaAutoForm.depotConfigs[depotId];
                          return total + (depotConfig ? depotConfig.busTypes.length : 0);
                        }, 0) * (keralaDestinations.length * (keralaDestinations.length - 1) / 2)}</p>
                        
                        {keralaAutoForm.generateTrips && (
                          <p className="font-medium">• <strong>Total Trips:</strong> {keralaAutoForm.selectedDepots.reduce((total, depotId) => {
                            const depotConfig = keralaAutoForm.depotConfigs[depotId];
                            const routesPerDepot = depotConfig ? depotConfig.busTypes.length : 0;
                            return total + routesPerDepot;
                          }, 0) * (keralaDestinations.length * (keralaDestinations.length - 1) / 2) * keralaAutoForm.timeSlots.length * keralaAutoForm.daysOfWeek.length}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowKeralaAutoModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleKeralaAutoRouteGeneration}
                  disabled={loading || keralaAutoForm.selectedDepots.length === 0 || keralaAutoForm.defaultBusTypes.length === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? <span className="w-4 h-4" /> : <span className="w-4 h-4" />}
                  <span>Generate Kerala Routes</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const ExportModal = () => (
    <AnimatePresence>
      {showExportModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowExportModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">📥 Export Routes</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Export route data in your preferred format with filtering options
              </p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
                    { value: 'excel', label: 'Excel', description: 'Microsoft Excel format' },
                    { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' }
                  ].map(format => (
                    <label key={format.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        value={format.value}
                        checked={exportFormat === format.value}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-medium text-sm text-gray-900">{format.label}</div>
                        <div className="text-xs text-gray-500">{format.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Filters */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Export Filters</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status Filter
                    </label>
                    <select
                      value={exportFilters.status}
                      onChange={(e) => setExportFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Depot Filter
                    </label>
                    <select
                      value={exportFilters.depot}
                      onChange={(e) => setExportFilters(prev => ({ ...prev, depot: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Depots</option>
                      {depots.map(depot => (
                        <option key={depot._id} value={depot._id}>{depot.depotName}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date From
                    </label>
                    <input
                      type="date"
                      value={exportFilters.dateRange.from}
                      onChange={(e) => setExportFilters(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, from: e.target.value } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date To
                    </label>
                    <input
                      type="date"
                      value={exportFilters.dateRange.to}
                      onChange={(e) => setExportFilters(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, to: e.target.value } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Export Preview */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">📊 Export Preview:</h4>
                <div className="text-blue-700 text-sm space-y-1">
                  <p>• Format: {exportFormat.toUpperCase()}</p>
                  <p>• Status: {exportFilters.status === 'all' ? 'All routes' : `${exportFilters.status} routes only`}</p>
                  <p>• Depot: {exportFilters.depot === 'all' ? 'All depots' : depots.find(d => d._id === exportFilters.depot)?.depotName || 'Selected depot'}</p>
                  <p>• Date Range: {exportFilters.dateRange.from && exportFilters.dateRange.to ? 
                    `${exportFilters.dateRange.from} to ${exportFilters.dateRange.to}` : 'All dates'}</p>
                  <p>• Estimated Records: {routes.length} routes (filtered results may vary)</p>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportRoutes}
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? <span className="w-4 h-4 animate-spin" /> : <span className="w-4 h-4">📥</span>}
                  <span>Export Routes</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const ConfirmationModal = () => (
    <AnimatePresence>
      {showConfirmModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleCancelAction}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="w-6 h-6 text-yellow-600">⚠️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Action</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                {confirmAction?.type === 'kerala-auto-routes' && (
                  <div>
                    <p className="text-gray-700 mb-2">
                      Are you sure you want to generate Kerala auto routes? This will create multiple routes and may take several minutes.
                    </p>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <p className="text-orange-800 text-sm">
                        <strong>This action will:</strong>
                      </p>
                      <ul className="text-orange-700 text-sm mt-1 ml-4 list-disc">
                        <li>Create routes for all selected depots</li>
                        <li>Generate trips automatically (if enabled)</li>
                        <li>Assign buses and crew (if enabled)</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {confirmAction?.type === 'bulk-add-routes' && (
                  <div>
                    <p className="text-gray-700 mb-2">
                      Are you sure you want to create {bulkForm.count} bulk routes?
                    </p>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-blue-800 text-sm">
                        <strong>This will create:</strong>
                      </p>
                      <ul className="text-blue-700 text-sm mt-1 ml-4 list-disc">
                        <li>{bulkForm.count} routes with Kerala city pairs</li>
                        <li>Routes for depot: {depots.find(d => d._id === bulkForm.depotId)?.depotName}</li>
                        <li>Schedule trips (if target date is set)</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {confirmAction?.type === 'bulk-operation' && (
                  <div>
                    <p className="text-gray-700 mb-2">
                      Are you sure you want to perform this bulk operation on {selectedRoutes.length} selected routes?
                    </p>
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-red-800 text-sm">
                        <strong>Operation:</strong> {bulkOperation.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={handleCancelAction}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={loading}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? <span className="w-4 h-4 animate-spin" /> : <span className="w-4 h-4">✓</span>}
                  <span>Confirm</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Edit Route Modal
  const EditRouteModal = () => (
    <AnimatePresence>
      {showEditModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit Route</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Number
                  </label>
                  <input
                    type="text"
                    value={routeForm.routeNumber}
                    onChange={(e) => setRouteForm({ ...routeForm, routeNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., KL-THR-GUR-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Route Name
                  </label>
                  <input
                    type="text"
                    value={routeForm.routeName}
                    onChange={(e) => setRouteForm({ ...routeForm, routeName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Thrissur to Guruvayur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Starting Point
                  </label>
                  <input
                    type="text"
                    value={routeForm.startingPoint?.city || ''}
                    onChange={(e) => setRouteForm({ 
                      ...routeForm, 
                      startingPoint: { ...routeForm.startingPoint, city: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Starting city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ending Point
                  </label>
                  <input
                    type="text"
                    value={routeForm.endingPoint?.city || ''}
                    onChange={(e) => setRouteForm({ 
                      ...routeForm, 
                      endingPoint: { ...routeForm.endingPoint, city: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Destination city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    value={routeForm.totalDistance}
                    onChange={(e) => {
                      const newDistance = parseInt(e.target.value) || 0;
                      // Recalculate fare when distance changes
                      const policy = farePolicies.find(p => p.busType === routeForm.busType && p.isActive);
                      let newBaseFare = routeForm.baseFare;
                      
                      if (policy && newDistance > 0) {
                        const calculatedBaseFare = Math.max(
                          newDistance * policy.ratePerKm,
                          policy.minimumFare
                        );
                        newBaseFare = Math.round(calculatedBaseFare);
                      }
                      
                      setRouteForm({ 
                        ...routeForm, 
                        totalDistance: newDistance,
                        baseFare: newBaseFare
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Distance in kilometers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={routeForm.estimatedDuration}
                    onChange={(e) => setRouteForm({ ...routeForm, estimatedDuration: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Duration in minutes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Depot
                  </label>
                  <select
                    value={routeForm.depot?.depotId || ''}
                    onChange={(e) => {
                      const selectedDepot = depots.find(d => d._id === e.target.value);
                      setRouteForm({ 
                        ...routeForm, 
                        depot: { 
                          depotId: e.target.value, 
                          name: selectedDepot?.depotName || selectedDepot?.name || ''
                        }
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Depot</option>
                    {depots.map(depot => (
                      <option key={depot._id} value={depot._id}>
                        {depot.depotName || depot.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bus Type
                  </label>
                  <select
                    value={routeForm.busType}
                    onChange={(e) => {
                      const newBusType = e.target.value;
                      // Find the fare policy for the selected bus type
                      const policy = farePolicies.find(p => p.busType === newBusType && p.isActive);
                      let newBaseFare = routeForm.baseFare;
                      let newFarePerKm = routeForm.farePerKm;
                      
                      if (policy) {
                        // Calculate new base fare based on distance and new policy
                        const calculatedBaseFare = Math.max(
                          routeForm.totalDistance * policy.ratePerKm,
                          policy.minimumFare
                        );
                        newBaseFare = Math.round(calculatedBaseFare);
                        newFarePerKm = policy.ratePerKm;
                      }
                      
                      setRouteForm({ 
                        ...routeForm, 
                        busType: newBusType,
                        baseFare: newBaseFare,
                        farePerKm: newFarePerKm
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="City / Ordinary">Ordinary</option>
                    <option value="Fast Passenger / LSFP">Fast Passenger</option>
                    <option value="Super Fast Passenger">Super Fast</option>
                    <option value="A/C Low Floor">AC Low Floor</option>
                    <option value="Luxury / Hi-tech & AC">Volvo</option>
                    <option value="Garuda Maharaja / Garuda King / Multi-axle Premium">Garuda</option>
                    <option value="Garuda Sanchari / Biaxle Premium">Garuda Sanchari</option>
                    <option value="Super Deluxe">Super Deluxe</option>
                    <option value="Super Express">Super Express</option>
                    <option value="City Fast">City Fast</option>
                    <option value="Non A/C Low Floor">Non AC Low Floor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Fare (₹)
                  </label>
                  <input
                    type="number"
                    value={routeForm.baseFare}
                    onChange={(e) => setRouteForm({ ...routeForm, baseFare: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Base fare amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fare Per KM (₹)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={routeForm.farePerKm}
                    onChange={(e) => setRouteForm({ ...routeForm, farePerKm: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Fare per kilometer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={routeForm.status}
                  onChange={(e) => setRouteForm({ ...routeForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={routeForm.notes || ''}
                  onChange={(e) => setRouteForm({ ...routeForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Additional notes about this route"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditRoute}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Route'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Route Map Editor Modal
  const RouteMapEditorModal = () => (
    <RouteMapEditor
      isOpen={showRouteMapEditor}
      onClose={() => setShowRouteMapEditor(false)}
      route={selectedRoute}
      onSaveRoute={handleSaveRouteWithMap}
      loading={loading}
    />
  );

  // Conductor Pricing Dashboard Modal
  const ConductorPricingModal = () => (
    <ConductorPricingDashboard
      isOpen={showConductorPricing}
      onClose={() => setShowConductorPricing(false)}
      route={selectedRoute}
      onUpdatePrices={handleUpdateConductorPrices}
      conductorRole="ADMIN"
    />
  );

  // Route Details Modal
  const RouteDetailsModal = () => (
    <AnimatePresence>
      {showRouteDetailsModal && selectedRoute && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Route Details</h2>
                <button
                  onClick={() => setShowRouteDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Route Number:</span>
                        <p className="text-gray-900">{selectedRoute.routeNumber}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Route Name:</span>
                        <p className="text-gray-900">{selectedRoute.routeName}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          selectedRoute.status === 'active' ? 'bg-green-100 text-green-800' :
                          selectedRoute.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedRoute.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Route Path</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">From:</span>
                        <p className="text-gray-900">{selectedRoute.startingPoint?.city} - {selectedRoute.startingPoint?.location}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">To:</span>
                        <p className="text-gray-900">{selectedRoute.endingPoint?.city} - {selectedRoute.endingPoint?.location}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Distance:</span>
                        <p className="text-gray-900">{selectedRoute.totalDistance} km</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Duration:</span>
                        <p className="text-gray-900">{Math.floor(selectedRoute.estimatedDuration / 60)}h {selectedRoute.estimatedDuration % 60}m</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Fare Information</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Base Fare:</span>
                        <p className="text-gray-900">₹{selectedRoute.baseFare}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Fare Per KM:</span>
                        <p className="text-gray-900">₹{selectedRoute.farePerKm}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Total Fare (Est.):</span>
                        <p className="text-gray-900">₹{Math.round(selectedRoute.baseFare + (selectedRoute.totalDistance * selectedRoute.farePerKm))}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Service Details</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Bus Type:</span>
                        <p className="text-gray-900">{getBusTypeDisplayName(selectedRoute.busType)}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Depot:</span>
                        <p className="text-gray-900">{selectedRoute.depot?.depotName || selectedRoute.depot?.name || 'Not assigned'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Schedules:</span>
                        <p className="text-gray-900">{selectedRoute.schedules?.length || 0} active schedules</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Stops:</span>
                        <p className="text-gray-900">{selectedRoute.intermediateStops?.length || 0} intermediate stops</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedRoute.features && selectedRoute.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoute.features.map((feature, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedRoute.notes && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedRoute.notes}</p>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Actions</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowRouteDetailsModal(false);
                      openEditModal(selectedRoute);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Route
                  </button>
                  <button
                    onClick={() => {
                      setShowRouteDetailsModal(false);
                      handleScheduleManagement(selectedRoute);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Manage Schedules
                  </button>
                  <button
                    onClick={() => {
                      setShowRouteDetailsModal(false);
                      handleDeleteRoute(selectedRoute._id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Route
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Streamlined Route Management</h1>
          <p className="text-gray-600">Efficient route planning with intelligent scheduling</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Data Status */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
              }`} />
              <span className="text-sm font-medium text-gray-700">
                {loading ? 'Loading...' : 'Data Loaded'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Routes: {routes.length} | Depots: {depots.length} | Stops: {stops.length}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchData}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="w-6 h-6 text-green-600">🚌</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Routes</p>
              <p className="text-2xl font-bold text-green-600">{routes.filter(r => r.status === 'active').length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="w-6 h-6 text-green-600">✅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Schedules</p>
              <p className="text-2xl font-bold text-blue-600">{routes.reduce((acc, route) => acc + (route.schedules?.length || 0), 0)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="w-6 h-6 text-blue-600">📅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Stops</p>
              <p className="text-2xl font-bold text-purple-600">{routes.reduce((acc, route) => acc + (route.intermediateStops?.length || 0), 0)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="w-6 h-6 text-purple-600">📍</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-full -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <button
            onClick={() => setIsQuickActionsMinimized(!isQuickActionsMinimized)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={isQuickActionsMinimized ? "Expand Quick Actions" : "Minimize Quick Actions"}
          >
            {isQuickActionsMinimized ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
          {selectedRoutes.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">{selectedRoutes.length} routes selected</span>
              <select
                value={bulkOperation}
                onChange={(e) => setBulkOperation(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Bulk Operation</option>
                <option value="activate">Activate Routes</option>
                <option value="deactivate">Deactivate Routes</option>
                <option value="update_fare">Update Fares</option>
                <option value="schedule_trips">Schedule Trips</option>
              </select>
              <button
                onClick={handleBulkOperation}
                disabled={!bulkOperation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Execute
              </button>
            </div>
          )}
        </div>
        
        {!isQuickActionsMinimized && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 w-full">

          <button
            onClick={() => setShowKeralaAutoModal(true)}
            className="p-2 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors flex items-center space-x-2"
          >
            <div className="p-1 bg-orange-100 rounded-md">
              <span className="w-4 h-4 text-orange-600">🚌</span>
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-orange-900">Auto Routes</h4>
              <p className="text-xs text-orange-700">Generate all Kerala routes with trips automatically</p>
            </div>
          </button>
          
          <button
            onClick={() => setShowMapRouteModal(true)}
            className="p-2 bg-green-50 rounded-md hover:bg-green-100 transition-colors flex items-center space-x-2"
          >
            <div className="p-1 bg-green-100 rounded-md">
              <span className="w-4 h-4 text-green-600">🗺️</span>
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-green-900">Map-Based Route</h4>
              <p className="text-xs text-green-700">Create route by clicking on map with auto-routing</p>
            </div>
          </button>
          
          <button
            onClick={() => setShowSingleAddModal(true)}
            className="p-2 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors flex items-center space-x-2"
          >
            <div className="p-1 bg-blue-100 rounded-md">
              <span className="w-4 h-4 text-blue-600">➕</span>
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-blue-900">Add Single Route</h4>
              <p className="text-xs text-blue-700">Add one route with detailed configuration</p>
            </div>
          </button>
          
          <button
            onClick={() => setShowBulkAddModal(true)}
            className="p-2 bg-green-50 rounded-md hover:bg-green-100 transition-colors flex items-center space-x-2"
          >
            <div className="p-1 bg-green-100 rounded-md">
              <span className="w-4 h-4 text-green-600">📤</span>
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-green-900">Bulk Add Routes</h4>
              <p className="text-xs text-green-700">Add multiple routes with Kerala city pairs</p>
            </div>
          </button>
          
          <button
            onClick={() => setShowExportModal(true)}
            className="p-2 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors flex items-center space-x-2"
          >
            <div className="p-1 bg-purple-100 rounded-md">
              <span className="w-4 h-4 text-purple-600">📥</span>
            </div>
            <div className="text-left">
              <h4 className="text-sm font-medium text-purple-900">Export Routes</h4>
              <p className="text-xs text-purple-700">Export route data for external use</p>
            </div>
          </button>
        </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Depot</label>
            <select
              value={depotFilter}
              onChange={(e) => setDepotFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Depots</option>
              {depots.map(depot => (
                <option key={depot._id} value={depot._id}>{depot.depotName}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDepotFilter('all');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
            >
              <span className="w-4 h-4">🔍</span>
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Route Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoutes.map(route => (
          <RouteCard key={route._id} route={route} />
        ))}
      </div>

            {filteredRoutes.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="bg-blue-50 rounded-lg p-8 max-w-md mx-auto">
                  <span className="w-16 h-16 text-blue-400 mx-auto mb-4 block">🗺️</span>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No Routes Found</h3>
                  <p className="text-gray-600 mb-4">Routes are being fetched from the database. Add new routes using the Quick Actions above.</p>
                  <button
                    onClick={() => setShowSingleAddModal(true)}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add New Route
                  </button>
                </div>
              </div>
            )}

      {/* Modals */}
      <KeralaRoutesModal />
      <BulkAddModal />
      <SingleAddModal />
      <MapRouteModal />
      <FareMatrixModal />
      <KeralaAutoRouteModal />
      <ExportModal />
      <ConfirmationModal />
      <EditRouteModal />
      <RouteMapEditorModal />
      <ConductorPricingModal />
      <RouteDetailsModal />
    </div>
  );
};

export default StreamlinedRouteManagement;


