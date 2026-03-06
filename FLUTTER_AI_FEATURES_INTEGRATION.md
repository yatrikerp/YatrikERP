# Flutter AI Features Integration Guide

## Overview
This document outlines the integration of AI-powered features from the Yatrik ERP web admin dashboard into the Flutter mobile application.

## Implemented Features

### 1. AI Scheduling Engine ✅
- **Location**: `/admin/genetic-scheduling`
- **Description**: Optimizes trip scheduling using Genetic Algorithm
- **Features**:
  - Schedule generation for date ranges
  - Fitness score calculation
  - Performance metrics (generations, execution time)
  - Optimization statistics

### 2. Predictive Demand Model ✅
- **Location**: `/admin/demand-prediction`
- **Description**: Forecasts passenger demand using AI
- **Features**:
  - Single route prediction
  - Batch predictions for multiple routes
  - Confidence scoring
  - Demand level classification (low, medium, high, very_high)
  - Time slot analysis

### 3. Crew Fatigue Management ✅
- **Location**: `/admin/crew-fatigue`
- **Description**: Monitors and manages crew fatigue levels
- **Features**:
  - Individual crew fatigue calculation
  - Depot-wide fatigue reports
  - Fatigue statistics and analytics
  - Eligibility status tracking
  - High fatigue alerts

### 4. Dynamic Fare Optimization 🔄
- **Location**: `/admin/fare-optimization`
- **Description**: AI-powered fare adjustments
- **Status**: Placeholder screen created (backend integration pending)

### 5. Smart Concession Verification 🔄
- **Location**: `/admin/concession-verification`
- **Description**: Automated concession validation
- **Status**: Placeholder screen created (backend integration pending)

## Architecture

### Services Layer
```
flutter/lib/services/
├── ai_service.dart          # API calls for AI features
└── api_service.dart         # Base API service
```

### Providers Layer
```
flutter/lib/providers/
├── ai_scheduling_provider.dart  # State management for AI features
├── auth_provider.dart
├── booking_provider.dart
└── trip_provider.dart
```

### Screens Layer
```
flutter/lib/screens/admin/
├── admin_dashboard.dart                    # Main admin dashboard
├── ai_scheduling_dashboard.dart            # AI features hub
├── demand_prediction_screen.dart           # Demand forecasting
├── crew_fatigue_screen.dart                # Fatigue management
├── genetic_scheduling_screen.dart          # AI scheduling
├── fare_optimization_screen.dart           # Fare optimization
└── concession_verification_screen.dart     # Concession verification
```

## API Endpoints

### Demand Prediction
- `POST /api/ai-scheduling/predict-demand` - Single prediction
- `POST /api/ai-scheduling/batch-predict` - Batch predictions
- `GET /api/ai-scheduling/predictions/:routeId` - Get predictions

### Crew Fatigue
- `POST /api/ai-scheduling/calculate-fatigue` - Calculate fatigue
- `POST /api/ai-scheduling/batch-calculate-fatigue` - Batch calculation
- `GET /api/ai-scheduling/eligible-crew` - Get eligible crew
- `GET /api/ai-scheduling/fatigue-report/:depotId` - Fatigue report

### Genetic Scheduling
- `POST /api/ai-scheduling/genetic-schedule` - Generate schedule

### Analytics
- `GET /api/ai-scheduling/analytics` - Get AI analytics

## Usage Guide

### Accessing AI Features

1. **From Admin Dashboard**:
   ```dart
   Navigator.pushNamed(context, '/admin/ai-dashboard');
   ```

2. **Direct Navigation**:
   ```dart
   // Demand Prediction
   Navigator.pushNamed(context, '/admin/demand-prediction');
   
   // Crew Fatigue
   Navigator.pushNamed(context, '/admin/crew-fatigue');
   
   // Genetic Scheduling
   Navigator.pushNamed(context, '/admin/genetic-scheduling');
   ```

### Using the AI Provider

```dart
// Get provider
final aiProvider = Provider.of<AISchedulingProvider>(context);

// Predict demand
await aiProvider.predictDemand(
  routeId: 'route123',
  predictionDate: DateTime.now(),
  timeSlot: '09:00',
);

// Calculate fatigue
await aiProvider.calculateFatigue(
  crewId: 'crew456',
  crewType: 'driver',
  date: DateTime.now(),
);

// Generate schedule
await aiProvider.geneticSchedule(
  depotId: 'depot789',
  startDate: DateTime.now(),
  endDate: DateTime.now().add(Duration(days: 7)),
);

// Get analytics
await aiProvider.getAnalytics(
  depotId: 'depot789',
  startDate: DateTime.now().subtract(Duration(days: 30)),
  endDate: DateTime.now(),
);
```

## Features Comparison

| Feature | Web Dashboard | Flutter App | Status |
|---------|--------------|-------------|--------|
| AI Scheduling Engine | ✅ Working | ✅ Implemented | Complete |
| Predictive Demand Model | ✅ Working | ✅ Implemented | Complete |
| Crew Fatigue Management | ✅ Working | ✅ Implemented | Complete |
| Dynamic Fare Optimization | ✅ Working | 🔄 Placeholder | Pending |
| Smart Concession Verification | ✅ Working | 🔄 Placeholder | Pending |
| AI Dashboard for Policymakers | ✅ Working | ✅ Implemented | Complete |

## Next Steps

### Phase 1: Complete Core Features ✅
- [x] Create AI service layer
- [x] Implement AI scheduling provider
- [x] Build demand prediction screen
- [x] Build crew fatigue screen
- [x] Build genetic scheduling screen
- [x] Create AI dashboard hub

### Phase 2: Enhance UI/UX
- [ ] Add charts and visualizations
- [ ] Implement real-time updates
- [ ] Add export functionality
- [ ] Improve error handling
- [ ] Add loading states

### Phase 3: Complete Remaining Features
- [ ] Implement fare optimization backend integration
- [ ] Implement concession verification backend integration
- [ ] Add notification system for alerts
- [ ] Implement offline caching

### Phase 4: Testing & Optimization
- [ ] Unit tests for AI service
- [ ] Integration tests for providers
- [ ] UI tests for screens
- [ ] Performance optimization
- [ ] Error handling improvements

## Testing

### Running the App
```bash
cd flutter
flutter pub get
flutter run
```

### Testing AI Features
1. Login as admin user
2. Navigate to Admin Dashboard
3. Click "AI Scheduling Dashboard"
4. Test each feature:
   - Demand Prediction: Enter route ID and date
   - Crew Fatigue: Enter depot ID
   - Genetic Scheduling: Enter depot ID and date range

## Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  provider: ^6.0.0
  http: ^1.0.0
  shared_preferences: ^2.0.0
  intl: ^0.18.0
```

## Configuration

### API Base URL
Update in `flutter/lib/config/api_config.dart`:
```dart
class ApiConfig {
  static const String baseUrl = 'YOUR_API_URL';
}
```

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check API base URL in config
   - Verify network connectivity
   - Check authentication token

2. **Provider Not Found**
   - Ensure provider is registered in main.dart
   - Check provider import statements

3. **Navigation Error**
   - Verify route names in main.dart
   - Check screen imports

## Performance Considerations

- API calls are optimized with timeout settings
- Loading states prevent multiple simultaneous requests
- Error handling prevents app crashes
- Efficient state management with Provider

## Security

- All API calls require authentication
- Tokens are stored securely in SharedPreferences
- Role-based access control (admin/depot_manager only)
- Input validation on all forms

## Support

For issues or questions:
1. Check this documentation
2. Review backend API documentation
3. Check console logs for errors
4. Verify API endpoint availability

## Version History

- **v1.0.0** (Current)
  - Initial AI features integration
  - Demand prediction implemented
  - Crew fatigue management implemented
  - Genetic scheduling implemented
  - AI dashboard hub created

## Contributors

- AI Features Backend: Working perfectly in web dashboard
- Flutter Integration: Complete for core features

---

**Last Updated**: March 2, 2026
**Status**: Core features implemented and ready for testing
