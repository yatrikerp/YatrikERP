/**
 * AUTO-SCHEDULING SCRIPT
 * 
 * This script demonstrates how to automatically schedule trips
 * for the whole day using the existing mass scheduling system.
 * 
 * Run with: node start-auto-scheduling.js
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Configuration for whole-day automatic scheduling
const SCHEDULING_CONFIG = {
  // Schedule for today
  date: new Date().toISOString().split('T')[0],
  
  // Create multiple trips per route throughout the day
  maxTripsPerRoute: 6,  // 6 trips per route (every 2-3 hours)
  maxTripsPerBus: 3,    // Each bus can do max 3 trips per day
  
  // 30-minute gaps between trips
  timeGap: 30,
  
  // Auto-assign everything
  autoAssignCrew: true,
  autoAssignBuses: true,
  generateReports: true,
  
  // Select all depots (will be populated dynamically)
  selectedDepots: []
};

async function startAutomaticScheduling() {
  console.log('🚀 Starting Automatic Trip Scheduling for Whole Day');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Get all available depots
    console.log('📋 Step 1: Fetching available depots...');
    const depotsResponse = await axios.get(`${API_BASE}/admin/depots`);
    const depots = depotsResponse.data?.data?.depots || depotsResponse.data?.depots || [];
    
    if (depots.length === 0) {
      console.log('❌ No depots found. Please create depots first.');
      return;
    }
    
    console.log(`✅ Found ${depots.length} depots:`, depots.map(d => d.depotName || d.name));
    
    // Step 2: Get available routes
    console.log('\n📋 Step 2: Fetching available routes...');
    const routesResponse = await axios.get(`${API_BASE}/admin/routes`);
    const routes = routesResponse.data?.data?.routes || routesResponse.data?.routes || [];
    
    if (routes.length === 0) {
      console.log('❌ No routes found. Please create routes first.');
      return;
    }
    
    console.log(`✅ Found ${routes.length} routes`);
    
    // Step 3: Get available buses
    console.log('\n📋 Step 3: Fetching available buses...');
    const busesResponse = await axios.get(`${API_BASE}/admin/buses`);
    const buses = busesResponse.data?.data?.buses || busesResponse.data?.buses || [];
    
    if (buses.length === 0) {
      console.log('❌ No buses found. Please create buses first.');
      return;
    }
    
    console.log(`✅ Found ${buses.length} buses`);
    
    // Step 4: Configure scheduling for all depots
    SCHEDULING_CONFIG.selectedDepots = depots.map(depot => depot._id);
    
    console.log('\n🚀 Step 4: Starting Mass Scheduling...');
    console.log(`📅 Date: ${SCHEDULING_CONFIG.date}`);
    console.log(`🏢 Depots: ${SCHEDULING_CONFIG.selectedDepots.length}`);
    console.log(`🛣️ Routes: ${routes.length}`);
    console.log(`🚌 Buses: ${buses.length}`);
    console.log(`⏰ Max Trips per Route: ${SCHEDULING_CONFIG.maxTripsPerRoute}`);
    console.log(`⏱️ Time Gap: ${SCHEDULING_CONFIG.timeGap} minutes`);
    
    // Step 5: Execute mass scheduling
    const schedulingResponse = await axios.post(`${API_BASE}/auto-scheduler/mass-schedule`, SCHEDULING_CONFIG);
    
    if (schedulingResponse.data.success) {
      const result = schedulingResponse.data.data;
      
      console.log('\n✅ AUTOMATIC SCHEDULING COMPLETED SUCCESSFULLY!');
      console.log('=' .repeat(60));
      console.log(`📊 Trips Created: ${result.tripsCreated}`);
      console.log(`🚌 Buses Assigned: ${result.busesAssigned}`);
      console.log(`👨‍✈️ Drivers Assigned: ${result.driversAssigned}`);
      console.log(`👨‍💼 Conductors Assigned: ${result.conductorsAssigned}`);
      console.log(`📈 Success Rate: ${result.successRate}`);
      console.log(`🏢 Buses Utilized: ${result.busesUtilized}/${result.totalBuses}`);
      console.log(`📊 Avg Trips per Bus: ${result.averageTripsPerBus}`);
      
      if (result.warnings && result.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        result.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
      
      console.log('\n🎯 NEXT STEPS:');
      console.log(`1. View scheduled trips: http://localhost:5173/admin/streamlined-trips`);
      console.log(`2. Check trip details for date: ${SCHEDULING_CONFIG.date}`);
      console.log(`3. Review mass scheduling dashboard: http://localhost:5173/admin/mass-scheduling`);
      
    } else {
      console.log('❌ Scheduling failed:', schedulingResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error during automatic scheduling:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure you are logged in as admin or have proper authentication');
    }
  }
}

// Run the automatic scheduling
startAutomaticScheduling();


