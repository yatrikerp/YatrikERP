# ML Research Roadmap for Yatrik ERP

## 🎯 Research Areas Identified

Your project has **5 major ML research opportunities** that can lead to academic publications and real-world impact.

---

## 1. Passenger Demand Prediction (LSTM/RNN)

### Current Status
- ❌ Rule-based heuristics (LSTM-inspired but not actual ML)
- ✅ Historical data collection infrastructure
- ✅ Contextual factors (weekday, peak hours, seasonal)

### Research Opportunity
**Train a real deep learning model for time-series demand forecasting**

### What to Do

#### Phase 1: Data Collection (Week 1-2)
```bash
# Run data collection script
cd backend
node ml-research/collect_training_data.js
```

**Requirements**:
- Minimum 6 months of historical trip data
- At least 1000+ completed trips
- Features: date, time, route, passengers, weather, holidays

#### Phase 2: Model Development (Week 3-4)
```bash
# Install Python dependencies
pip install tensorflow pandas numpy scikit-learn matplotlib

# Train LSTM model
python ml-research/demand_prediction_lstm.py
```

**Model Architecture**:
- Input: 7-day sequence of features
- LSTM layers: 128 → 64 units
- Output: Predicted passenger count
- Loss: MSE, Metrics: MAE, MAPE

#### Phase 3: Evaluation (Week 5)
**Metrics to Report**:
- MAE (Mean Absolute Error): Target < 5 passengers
- RMSE (Root Mean Squared Error): Target < 8 passengers
- MAPE (Mean Absolute Percentage Error): Target < 15%
- R² Score: Target > 0.85

#### Phase 4: Deployment (Week 6)
- Save trained model as `.h5` file
- Create REST API endpoint for predictions
- Integrate with existing `demandPredictionService.js`
- A/B test: Rule-based vs. ML model

### Research Questions
1. How does LSTM compare to rule-based prediction?
2. Which features are most important for demand forecasting?
3. Can we predict demand spikes during festivals/events?
4. What is the optimal sequence length (7 days vs. 14 days)?

### Expected Publication
**Conference**: IEEE ITSC (Intelligent Transportation Systems Conference)
**Journal**: Transportation Research Part C: Emerging Technologies

---

## 2. Crew Fatigue Prediction (Random Forest/XGBoost)

### Current Status
- ✅ Formula-based fatigue scoring (5 weighted components)
- ❌ No ML model trained on real fatigue data
- ❌ No validation against actual incidents

### Research Opportunity
**Train ML models to predict actual crew fatigue and incident risk**

### What to Do

#### Phase 1: Ground Truth Collection (Week 1-4)
**Critical**: You need actual fatigue data!

Options:
1. **Crew Surveys**: Daily fatigue self-assessment (1-10 scale)
2. **Incident Reports**: Collect accident/near-miss data
3. **Performance Metrics**: Reaction time, errors, complaints
4. **Wearable Devices**: Heart rate variability, sleep quality (if available)

```javascript
// Add to backend/models/CrewFatigue.js
actualFatigueLevel: {
  type: Number,  // Self-reported fatigue (1-10)
  required: false
},
incidentOccurred: {
  type: Boolean,
  default: false
},
incidentType: String,
performanceScore: Number
```

#### Phase 2: Model Training (Week 5-6)
```bash
# Train multiple models and compare
python ml-research/crew_fatigue_ml.py
```

**Models to Compare**:
- Random Forest Regressor
- XGBoost Regressor
- Gradient Boosting Regressor
- Neural Network (optional)

**Features**:
- Daily working hours
- Total distance covered
- Consecutive working days
- Night shift count
- Rest hours since last shift
- Age, experience (if available)
- Route difficulty, weather

#### Phase 3: Feature Importance Analysis (Week 7)
**Research Questions**:
- Which factor contributes most to fatigue?
- Is the current 25-20-20-20-15 weighting optimal?
- Can we identify high-risk crew members proactively?

#### Phase 4: Validation (Week 8)
- Cross-validation (5-fold)
- Compare ML predictions vs. formula-based scores
- Validate against actual incidents
- Calculate ROC-AUC for incident prediction

### Research Questions
1. Can ML predict fatigue better than weighted formulas?
2. What are the most important fatigue factors?
3. Can we predict fatigue-related incidents before they occur?
4. How does fatigue vary by age, experience, route type?

### Expected Publication
**Conference**: ACM SIGKDD (Knowledge Discovery and Data Mining)
**Journal**: Expert Systems with Applications

---

## 3. Genetic Algorithm Optimization Enhancement

### Current Status
- ✅ Basic GA implementation (50 pop, 100 gen)
- ✅ Multi-objective fitness function
- ❌ Fixed parameters (no adaptive tuning)
- ❌ No comparison with other algorithms

### Research Opportunity
**Compare metaheuristics for multi-resource scheduling optimization**

### What to Do

#### Phase 1: Implement Alternative Algorithms (Week 1-3)

**Algorithms to Implement**:
1. **Particle Swarm Optimization (PSO)**
2. **Ant Colony Optimization (ACO)**
3. **Simulated Annealing (SA)**
4. **NSGA-II** (Multi-objective GA)
5. **Hybrid GA-PSO**

```python
# Create ml-research/optimization_comparison.py
class SchedulingOptimizer:
    def __init__(self, algorithm='GA'):
        self.algorithm = algorithm
        
    def optimize_ga(self):
        # Your existing GA
        pass
        
    def optimize_pso(self):
        # Particle Swarm Optimization
        pass
        
    def optimize_aco(self):
        # Ant Colony Optimization
        pass
        
    def optimize_nsga2(self):
        # Multi-objective GA
        pass
```

#### Phase 2: Benchmark Comparison (Week 4-5)

**Metrics to Compare**:
- Optimization score (0-100%)
- Convergence speed (generations to optimal)
- Computational time (seconds)
- Solution quality (conflicts, utilization)
- Robustness (variance across runs)

**Test Scenarios**:
- Small depot (10 buses, 20 crew)
- Medium depot (50 buses, 100 crew)
- Large depot (100 buses, 200 crew)
- Resource shortage scenarios
- High demand scenarios

#### Phase 3: Adaptive Parameter Tuning (Week 6)

**Implement Self-Adaptive GA**:
- Mutation rate adapts based on diversity
- Crossover rate adapts based on fitness improvement
- Population size adapts based on problem complexity

### Research Questions
1. Which algorithm performs best for bus scheduling?
2. How does performance scale with fleet size?
3. Can adaptive parameters improve convergence?
4. What is the trade-off between solution quality and speed?

### Expected Publication
**Conference**: GECCO (Genetic and Evolutionary Computation Conference)
**Journal**: Computers & Operations Research

---

## 4. Traffic Delay Prediction (XGBoost/Random Forest)

### Current Status
- ❌ Not implemented yet
- ❌ No real-time traffic data integration

### Research Opportunity
**Predict trip delays using ML and real-time traffic data**

### What to Do

#### Phase 1: Data Collection (Week 1-2)

**Data Sources**:
1. **Historical Trip Data**: Actual vs. scheduled arrival times
2. **Google Maps API**: Real-time traffic conditions
3. **Weather API**: Rain, temperature, visibility
4. **Event Calendar**: Festivals, strikes, road closures

```javascript
// Add to backend/models/Trip.js
actualStartTime: String,
actualEndTime: String,
delayMinutes: Number,
delayReason: String,
trafficCondition: String,
weatherCondition: String
```

#### Phase 2: Feature Engineering (Week 3)

**Features**:
- Time of day, day of week
- Route distance and complexity
- Historical delay on this route
- Current traffic level (Google Maps)
- Weather conditions
- Special events
- Bus age and condition

#### Phase 3: Model Training (Week 4-5)

```python
# ml-research/delay_prediction.py
from xgboost import XGBRegressor
from sklearn.ensemble import RandomForestRegressor

class DelayPredictor:
    def train(self, X_train, y_train):
        # Train XGBoost for delay prediction
        self.model = XGBRegressor(
            n_estimators=200,
            max_depth=8,
            learning_rate=0.1
        )
        self.model.fit(X_train, y_train)
```

**Target**: Predict delay in minutes (0-120)

#### Phase 4: Real-Time Integration (Week 6)

- Integrate Google Maps API for live traffic
- Update trip ETAs dynamically
- Send delay alerts to passengers
- Adjust downstream trip schedules

### Research Questions
1. Can we predict delays with <10 minute accuracy?
2. Which factors contribute most to delays?
3. How far in advance can we predict delays?
4. Can we proactively adjust schedules to minimize delays?

### Expected Publication
**Conference**: IEEE ITSC
**Journal**: IEEE Transactions on Intelligent Transportation Systems

---

## 5. Dynamic Fare Optimization (Reinforcement Learning)

### Current Status
- ❌ Not implemented
- ❌ Fixed fare pricing

### Research Opportunity
**Use RL to optimize fares dynamically for revenue maximization**

### What to Do

#### Phase 1: Problem Formulation (Week 1-2)

**Reinforcement Learning Setup**:
- **State**: Current demand, time, route, competitor prices, occupancy
- **Action**: Fare adjustment (-20% to +50%)
- **Reward**: Revenue - (empty_seats_penalty + customer_loss_penalty)
- **Goal**: Maximize long-term revenue

#### Phase 2: Algorithm Selection (Week 3-4)

**Options**:
1. **Q-Learning**: Simple, interpretable
2. **Deep Q-Network (DQN)**: Handles complex states
3. **Policy Gradient (PPO)**: Continuous action space
4. **Actor-Critic (A3C)**: Faster convergence

```python
# ml-research/dynamic_pricing_rl.py
import gym
from stable_baselines3 import PPO

class FareOptimizationEnv(gym.Env):
    def __init__(self):
        # Define state space, action space
        pass
        
    def step(self, action):
        # Apply fare change, calculate reward
        pass
        
    def reset(self):
        # Reset environment
        pass

# Train RL agent
model = PPO('MlpPolicy', env, verbose=1)
model.learn(total_timesteps=100000)
```

#### Phase 3: Simulation (Week 5-6)

**Test Scenarios**:
- Peak vs. off-peak pricing
- Competitor price changes
- Demand spikes (festivals)
- Capacity constraints

#### Phase 4: A/B Testing (Week 7-8)

- Deploy to 10% of routes
- Compare revenue vs. fixed pricing
- Monitor customer satisfaction
- Adjust reward function based on results

### Research Questions
1. Can dynamic pricing increase revenue by >15%?
2. What is the optimal price elasticity of demand?
3. How do customers respond to dynamic pricing?
4. Can we balance revenue and social welfare?

### Expected Publication
**Conference**: NeurIPS (Neural Information Processing Systems)
**Journal**: Management Science

---

## 📊 Research Timeline (6 Months)

### Month 1-2: Data Collection & Preparation
- ✅ Export historical data from MongoDB
- ✅ Clean and preprocess data
- ✅ Exploratory Data Analysis (EDA)
- ✅ Feature engineering

### Month 3-4: Model Development
- ✅ Train LSTM for demand prediction
- ✅ Train Random Forest/XGBoost for fatigue
- ✅ Implement alternative optimization algorithms
- ✅ Develop delay prediction model

### Month 5: Evaluation & Comparison
- ✅ Cross-validation and testing
- ✅ Benchmark comparisons
- ✅ Statistical significance testing
- ✅ Performance analysis

### Month 6: Deployment & Paper Writing
- ✅ Deploy models to production
- ✅ A/B testing and monitoring
- ✅ Write research paper
- ✅ Submit to conference/journal

---

## 📝 Research Paper Structure

### Title
"AI-Driven Multi-Resource Optimization for Public Bus Fleet Scheduling: Integrating Demand Prediction, Fatigue Modeling, and Genetic Algorithms"

### Abstract (250 words)
- Problem statement
- Proposed solution
- Key contributions
- Results summary

### 1. Introduction
- Background on public transportation challenges
- Motivation for AI-based scheduling
- Research objectives
- Paper organization

### 2. Literature Review
- Demand prediction in transportation
- Crew fatigue modeling
- Scheduling optimization algorithms
- Integrated transportation systems
- Research gaps

### 3. Methodology
- System architecture
- LSTM demand prediction
- ML-based fatigue modeling
- Genetic algorithm optimization
- Multi-resource constraint handling

### 4. Implementation
- Technology stack
- Data sources
- System specifications
- Deployment details

### 5. Experiments and Results
- Dataset description
- Experimental setup
- Performance metrics
- Comparison with baselines
- Case studies

### 6. Discussion
- Key findings
- Advantages and limitations
- Practical implications
- Comparison with existing systems

### 7. Conclusion and Future Work
- Summary of contributions
- Research impact
- Future research directions

---

## 🎓 Expected Outcomes

### Academic Contributions
1. **Novel Integration**: First system combining demand prediction, fatigue modeling, and GA optimization
2. **Real-World Validation**: Tested on Kerala KSRTC data
3. **Open Source**: Code and datasets released for reproducibility
4. **Benchmarks**: Performance comparisons across algorithms

### Practical Impact
1. **Efficiency**: 15-20% improvement in resource utilization
2. **Safety**: 30% reduction in crew fatigue incidents
3. **Revenue**: 10-15% increase in projected revenue
4. **Scalability**: Handles 100+ buses, 200+ crew members

### Publications Target
- **1 Conference Paper**: IEEE ITSC 2026
- **1 Journal Paper**: Transportation Research Part C (2027)
- **1 Workshop Paper**: NeurIPS Workshop on ML for Transportation

---

## 🚀 Getting Started

### Step 1: Run Data Collection
```bash
cd backend
node ml-research/collect_training_data.js
```

### Step 2: Install Python Dependencies
```bash
pip install tensorflow pandas numpy scikit-learn xgboost matplotlib seaborn jupyter
```

### Step 3: Exploratory Data Analysis
```bash
jupyter notebook ml-research/exploratory_analysis.ipynb
```

### Step 4: Train First Model
```bash
python ml-research/demand_prediction_lstm.py
```

### Step 5: Evaluate and Iterate
- Check model performance
- Tune hyperparameters
- Compare with baselines
- Document results

---

## 📚 Resources

### Datasets
- Kerala KSRTC operational data (6+ months)
- Historical trip records
- Booking data
- Crew work logs

### Tools
- **ML Frameworks**: TensorFlow, PyTorch, scikit-learn, XGBoost
- **Optimization**: DEAP (GA library), pymoo (multi-objective)
- **Visualization**: Matplotlib, Seaborn, Plotly
- **Deployment**: TensorFlow Serving, Flask API

### References
- LSTM for time-series: Hochreiter & Schmidhuber (1997)
- Genetic algorithms: Goldberg (1989)
- Fatigue modeling: Dawson & Reid (1997)
- Multi-objective optimization: Deb et al. (2002)

---

## ✅ Success Criteria

### Technical Metrics
- Demand prediction MAPE < 15%
- Fatigue prediction MAE < 10 points
- Optimization score > 85%
- System response time < 5 seconds

### Research Metrics
- 1+ conference paper accepted
- 1+ journal paper submitted
- Code released on GitHub
- Dataset made public (anonymized)

### Business Metrics
- 15% improvement in resource utilization
- 20% reduction in manual scheduling time
- 10% increase in revenue
- 30% reduction in crew fatigue incidents

---

**Last Updated**: March 3, 2026
**Status**: Ready to Begin
**Priority**: High - Start with Demand Prediction (easiest to implement)
