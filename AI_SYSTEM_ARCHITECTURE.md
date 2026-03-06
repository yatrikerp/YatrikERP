# AI Autonomous Scheduling - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                  http://localhost:3000                           │
├─────────────────────────────────────────────────────────────────┤
│  AdminAutonomousScheduling.jsx                                   │
│  - User Interface                                                │
│  - Visualization                                                 │
│  - Export/Publish Controls                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP POST
                         │ /api/admin/ai/autonomous/schedule
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                   │
│                  http://localhost:5000                           │
├─────────────────────────────────────────────────────────────────┤
│  Routes: adminAI.js                                              │
│  - POST /api/admin/ai/autonomous/schedule                        │
│  - GET  /api/admin/ai/autonomous/status                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI SERVICES LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  1. DemandPredictionService.js                           │   │
│  │     - LSTM-inspired time-series prediction               │   │
│  │     - Historical data analysis                           │   │
│  │     - Contextual factor calculation                      │   │
│  │     - Confidence scoring                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         │                                         │
│                         ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  2. CrewFatigueService.js                                │   │
│  │     - Multi-factor fatigue calculation                   │   │
│  │     - Eligibility determination                          │   │
│  │     - Rest period tracking                               │   │
│  │     - Alert generation                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         │                                         │
│                         ▼                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  3. GeneticSchedulerService.js                           │   │
│  │     - Population initialization                          │   │
│  │     - Fitness evaluation                                 │   │
│  │     - Selection, crossover, mutation                     │   │
│  │     - Elitism and evolution                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (MongoDB)                            │
├─────────────────────────────────────────────────────────────────┤
│  Collections:                                                    │
│  - routes          (active routes)                               │
│  - buses           (fleet data)                                  │
│  - users           (drivers, conductors)                         │
│  - depots          (depot information)                           │
│  - trips           (historical trips)                            │
│  - bookings        (passenger bookings)                          │
│  - demandpredictions (AI predictions)                            │
│  - crewfatigues    (fatigue records)                             │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow - Autonomous Scheduling

```
USER CLICKS "RUN FULL AI FLEET SCHEDULING"
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: DATA AGGREGATION                                     │
│ - Fetch all active routes                                    │
│ - Fetch all available buses                                  │
│ - Fetch all active drivers                                   │
│ - Fetch all active conductors                                │
│ - Fetch all depots                                           │
│ - Fetch historical bookings (30 days)                        │
│ - Fetch maintenance schedules                                │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 2: DEMAND PREDICTION (AI)                               │
│ For each route:                                              │
│   - Analyze historical passenger data                        │
│   - Calculate 7-day and 30-day averages                      │
│   - Apply seasonal factors (Kerala tourism)                  │
│   - Apply contextual factors (weekday, peak, holiday)        │
│   - Generate prediction with confidence score                │
│ Output: Predicted passengers per route/time                  │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 3: TRIP FREQUENCY CALCULATION                           │
│ For each route:                                              │
│   - Calculate required trips based on demand                 │
│   - Distribute trips across time slots                       │
│   - Allocate 60% to peak hours (6-10 AM, 5-9 PM)            │
│   - Allocate 40% to off-peak hours                          │
│ Output: Trip requirements per route                          │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 4: BUS ALLOCATION (Depot-Aware)                         │
│ For each required trip:                                      │
│   - Find available bus from same depot                       │
│   - Check time conflict (no overlapping assignments)         │
│   - Verify maintenance status                                │
│   - Mark bus as assigned for time slot                       │
│ Output: Bus assignments                                      │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 5: DRIVER ASSIGNMENT (Fatigue-Aware)                    │
│ For each trip:                                               │
│   - Calculate fatigue score for each driver                  │
│   - Check eligibility (hours < 48, fatigue < 70)            │
│   - Verify depot match                                       │
│   - Check time conflict                                      │
│   - Assign driver with lowest fatigue                        │
│ Output: Driver assignments with fatigue scores               │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 6: CONDUCTOR ASSIGNMENT (Fatigue-Aware)                 │
│ For each trip:                                               │
│   - Calculate fatigue score for each conductor               │
│   - Check eligibility (hours < 48, fatigue < 70)            │
│   - Verify depot match                                       │
│   - Check time conflict                                      │
│   - Assign conductor with lowest fatigue                     │
│ Output: Conductor assignments with fatigue scores            │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 7: DEPOT VALIDATION                                     │
│ For each trip:                                               │
│   - Verify bus depot matches driver depot                    │
│   - Verify bus depot matches conductor depot                 │
│   - Flag depot mismatches as low-severity conflicts          │
│ Output: Validated assignments                                │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 8: SCHEDULE ENTRY CREATION                              │
│ For each valid assignment:                                   │
│   - Calculate expected passenger load                        │
│   - Calculate projected revenue                              │
│   - Determine trip period (peak/off-peak)                    │
│   - Create schedule entry with all details                   │
│ Output: Complete schedule array                              │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 9: CONFLICT DETECTION                                   │
│ Analyze schedule for:                                        │
│   - Bus shortages (high severity)                            │
│   - Driver shortages (high severity)                         │
│   - Conductor shortages (medium severity)                    │
│   - Depot mismatches (low severity)                          │
│   - Time overlaps (high severity)                            │
│ Output: Conflict list with severity levels                   │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 10: OPTIMIZATION SCORING                                │
│ Calculate fitness components:                                │
│   - Revenue Score (40%): Total projected revenue             │
│   - Utilization Score (30%): Resource usage efficiency       │
│   - Route Coverage (20%): Percentage of routes covered       │
│   - Fatigue Penalty (5%): Average crew fatigue               │
│   - Conflict Penalty (5%): Number and severity of conflicts  │
│ Output: Optimization score (0-100%)                          │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 11: RESULT GENERATION                                   │
│ Package complete result:                                     │
│   - Schedule array (all trips)                               │
│   - Conflicts array                                          │
│   - Summary statistics                                       │
│   - Utilization metrics                                      │
│   - AI metadata                                              │
│ Output: JSON response to frontend                            │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
                  DISPLAY RESULTS
```

## 🧬 Genetic Algorithm Flow (Alternative Approach)

```
START: scheduleWithGA(depotId, startDate, endDate)
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│ INITIALIZATION                                               │
│ - Gather resources (buses, drivers, conductors, routes)      │
│ - Get demand predictions for all routes/dates                │
│ - Calculate crew fatigue for all crew members                │
│ - Create initial population (50 random chromosomes)          │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ GENERATION LOOP (100 iterations)                             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. FITNESS EVALUATION                                   │ │
│  │    For each chromosome:                                 │ │
│  │    - Calculate demand fulfillment (35%)                 │ │
│  │    - Calculate fatigue minimization (30%)               │ │
│  │    - Calculate resource utilization (20%)               │ │
│  │    - Calculate operational cost (15%)                   │ │
│  │    - Compute weighted fitness score                     │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 2. SELECTION (Tournament)                               │ │
│  │    - Create tournaments of 3 chromosomes                │ │
│  │    - Select best from each tournament                   │ │
│  │    - Build mating pool                                  │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 3. CROSSOVER (70% rate)                                 │ │
│  │    - Pair chromosomes                                   │ │
│  │    - Single-point crossover                             │ │
│  │    - Create offspring                                   │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 4. MUTATION (10% rate)                                  │ │
│  │    - Randomly select chromosomes                        │ │
│  │    - Randomly reassign bus/driver/conductor             │ │
│  │    - Create mutated offspring                           │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           ▼                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 5. ELITISM (10%)                                        │ │
│  │    - Keep top 10% of current generation                 │ │
│  │    - Combine with offspring                             │ │
│  │    - Form new generation                                │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           ▼                                   │
│                    Track Best Solution                        │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │
                            ▼ (After 100 generations)
┌──────────────────────────────────────────────────────────────┐
│ TRIP CREATION                                                │
│ - Take best chromosome                                       │
│ - Create Trip documents in database                          │
│ - Return created trips                                       │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
                    RETURN RESULT
```

## 🧮 Fatigue Calculation Flow

```
calculateFatigueScore(crewId, crewType, date)
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│ GATHER WORKLOAD METRICS                                      │
│ - Get trips for today                                        │
│ - Get trips for last 7 days                                  │
│ - Calculate daily working hours                              │
│ - Calculate total distance covered                           │
│ - Count consecutive working days                             │
│ - Count night shifts (10 PM - 6 AM)                          │
│ - Calculate rest hours since last shift                      │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ CALCULATE FATIGUE COMPONENTS                                 │
│                                                              │
│ Work Hours Fatigue = (dailyHours / 12) × 100                │
│ Distance Fatigue = (totalDistance / 500) × 100              │
│ Consecutive Days Fatigue = (consecutiveDays / 6) × 100      │
│ Night Shift Fatigue = (nightShifts / 3) × 100               │
│ Rest Deficit Fatigue = 100 - (restHours / 8) × 100          │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ WEIGHTED FATIGUE SCORE                                       │
│                                                              │
│ FatigueScore = (WorkHours × 0.25)                           │
│              + (Distance × 0.20)                             │
│              + (ConsecutiveDays × 0.20)                      │
│              + (NightShifts × 0.20)                          │
│              + (RestDeficit × 0.15)                          │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ ELIGIBILITY DETERMINATION                                    │
│                                                              │
│ Ineligible if:                                               │
│   - Fatigue score ≥ 70 (critical)                           │
│   - Daily hours ≥ 12                                         │
│   - Consecutive days ≥ 6                                     │
│   - Rest hours < 8                                           │
│                                                              │
│ Limited duty if:                                             │
│   - Fatigue score ≥ 50 (high)                               │
│   - Assign only short routes                                 │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ GENERATE ALERTS                                              │
│ - Critical fatigue alert (≥70)                               │
│ - High fatigue warning (≥50)                                 │
│ - Consecutive days warning (≥6)                              │
│ - Night shift limit warning (≥3)                             │
│ - Rest required alert                                        │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ SAVE FATIGUE RECORD                                          │
│ - Store in CrewFatigue collection                            │
│ - Include all metrics and components                         │
│ - Return complete fatigue record                             │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
                  RETURN RESULT
```

## 📊 Demand Prediction Flow

```
predictDemand(routeId, predictionDate, timeSlot)
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│ GATHER HISTORICAL DATA                                       │
│ - Get trips from last 7 days                                 │
│ - Get trips from last 30 days                                │
│ - Calculate 7-day average passengers                         │
│ - Calculate 30-day average passengers                        │
│ - Calculate same-weekday average                             │
│ - Determine seasonal factor (month-based)                    │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ CALCULATE CONTEXTUAL FACTORS                                 │
│ - Day of week (Monday-Sunday)                                │
│ - Is weekend? (Saturday/Sunday)                              │
│ - Is holiday? (check holiday calendar)                       │
│ - Is peak hour? (7-9 AM, 5-7 PM)                            │
│ - Weather condition (if available)                           │
│ - Special events (if available)                              │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ LSTM-INSPIRED PREDICTION                                     │
│                                                              │
│ Base = SameWeekdayAvg OR Avg30Days                          │
│                                                              │
│ Prediction = Base × SeasonalFactor                           │
│            × WeekendFactor (0.7 if weekend)                  │
│            × PeakHourFactor (1.5 if peak)                    │
│            × HolidayFactor (1.3 if holiday)                  │
│                                                              │
│ If recent data available:                                    │
│   Prediction = (Prediction × 0.6) + (Avg7Days × 0.4)        │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ CONFIDENCE CALCULATION                                       │
│ - 0-7 data points: 50% confidence                            │
│ - 7-14 data points: 70% confidence                           │
│ - 14+ data points: 90% confidence                            │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ DEMAND CATEGORIZATION                                        │
│ Utilization = Predicted / Capacity                           │
│ - Very Low: <20%                                             │
│ - Low: 20-40%                                                │
│ - Medium: 40-70%                                             │
│ - High: 70-90%                                               │
│ - Very High: >90%                                            │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ GENERATE RECOMMENDATIONS                                     │
│ Based on demand level:                                       │
│ - Recommended number of buses                                │
│ - Recommended bus type                                       │
│ - Recommended frequency (minutes)                            │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ SAVE PREDICTION                                              │
│ - Store in DemandPrediction collection                       │
│ - Include all factors and metadata                           │
│ - Return complete prediction                                 │
└────────────────────────┬─────────────────────────────────────┘
                         ▼
                  RETURN RESULT
```

## 🎯 Optimization Score Calculation

```
┌──────────────────────────────────────────────────────────────┐
│ REVENUE SCORE (40% weight)                                   │
│ RevenueScore = min(100, (TotalRevenue / 100000) × 100)      │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌──────────────────────────────────────────────────────────────┐
│ UTILIZATION SCORE (30% weight)                               │
│ BusUtil = (UsedBuses / TotalBuses) × 100                     │
│ DriverUtil = (UsedDrivers / TotalDrivers) × 100              │
│ UtilizationScore = (BusUtil + DriverUtil) / 2                │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌──────────────────────────────────────────────────────────────┐
│ ROUTE COVERAGE (20% weight)                                  │
│ RouteCoverage = (CoveredRoutes / TotalRoutes) × 100          │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌──────────────────────────────────────────────────────────────┐
│ FATIGUE PENALTY (5% weight)                                  │
│ AvgFatigue = Sum(AllFatigueScores) / TripCount               │
│ FatiguePenalty = AvgFatigue                                  │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌──────────────────────────────────────────────────────────────┐
│ CONFLICT PENALTY (5% weight)                                 │
│ ConflictPenalty = (High × 10) + (Medium × 5) + (Low × 2)    │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│ FINAL OPTIMIZATION SCORE                                     │
│                                                              │
│ Score = (RevenueScore × 0.40)                                │
│       + (UtilizationScore × 0.30)                            │
│       + (RouteCoverage × 0.20)                               │
│       - (FatiguePenalty × 0.05)                              │
│       - (ConflictPenalty × 0.05)                             │
│                                                              │
│ Score = max(0, min(100, Score))                              │
└──────────────────────────────────────────────────────────────┘
```

## 📦 Data Models

### DemandPrediction
```javascript
{
  routeId: ObjectId,
  predictionDate: Date,
  timeSlot: String,
  predictedPassengers: Number,
  confidenceScore: Number,
  historicalData: {
    avgPassengersLast7Days: Number,
    avgPassengersLast30Days: Number,
    sameWeekdayAverage: Number,
    seasonalFactor: Number
  },
  contextFactors: {
    dayOfWeek: String,
    isWeekend: Boolean,
    isHoliday: Boolean,
    isPeakHour: Boolean,
    weatherCondition: String
  },
  demandLevel: String,
  recommendations: {
    recommendedBuses: Number,
    recommendedBusType: String,
    recommendedFrequency: Number
  },
  actualData: {
    actualPassengers: Number,
    accuracy: Number,
    error: Number
  }
}
```

### CrewFatigue
```javascript
{
  crewId: ObjectId,
  crewType: String,
  depotId: ObjectId,
  date: Date,
  fatigueScore: Number,
  workloadMetrics: {
    dailyWorkingHours: Number,
    totalDistanceCovered: Number,
    consecutiveWorkingDays: Number,
    nightShiftCount: Number,
    restHoursSinceLastShift: Number
  },
  fatigueComponents: {
    workHoursFatigue: Number,
    distanceFatigue: Number,
    consecutiveDaysFatigue: Number,
    nightShiftFatigue: Number,
    restDeficitFatigue: Number
  },
  eligibilityStatus: {
    isEligible: Boolean,
    reason: String,
    recommendedRestHours: Number
  },
  alerts: [{
    type: String,
    message: String,
    severity: String
  }]
}
```

---

**Architecture Version**: 2.0.0-MRCO
**Last Updated**: March 3, 2026
