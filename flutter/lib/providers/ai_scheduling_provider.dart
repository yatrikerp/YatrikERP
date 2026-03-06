import 'package:flutter/foundation.dart';
import '../services/ai_service.dart';

class AISchedulingProvider with ChangeNotifier {
  final AIService _aiService = AIService();

  bool _isLoading = false;
  String? _error;
  
  // Demand Prediction Data
  Map<String, dynamic>? _demandPrediction;
  List<dynamic> _predictions = [];
  
  // Crew Fatigue Data
  Map<String, dynamic>? _fatigueData;
  List<dynamic> _eligibleCrew = [];
  Map<String, dynamic>? _fatigueReport;
  
  // Genetic Scheduling Data
  Map<String, dynamic>? _scheduleResult;
  
  // Analytics Data
  Map<String, dynamic>? _analytics;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  Map<String, dynamic>? get demandPrediction => _demandPrediction;
  List<dynamic> get predictions => _predictions;
  Map<String, dynamic>? get fatigueData => _fatigueData;
  List<dynamic> get eligibleCrew => _eligibleCrew;
  Map<String, dynamic>? get fatigueReport => _fatigueReport;
  Map<String, dynamic>? get scheduleResult => _scheduleResult;
  Map<String, dynamic>? get analytics => _analytics;

  // ==================== DEMAND PREDICTION ====================

  Future<void> predictDemand({
    required String routeId,
    required DateTime predictionDate,
    required String timeSlot,
  }) async {
    _setLoading(true);
    try {
      final response = await _aiService.predictDemand(
        routeId: routeId,
        predictionDate: predictionDate,
        timeSlot: timeSlot,
      );
      
      if (response['success']) {
        _demandPrediction = response['data'];
        _error = null;
      } else {
        _error = response['message'] ?? 'Failed to predict demand';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> batchPredict({
    required List<String> routeIds,
    required DateTime startDate,
    required DateTime endDate,
    List<String>? timeSlots,
  }) async {
    _setLoading(true);
    try {
      final response = await _aiService.batchPredict(
        routeIds: routeIds,
        startDate: startDate,
        endDate: endDate,
        timeSlots: timeSlots,
      );
      
      if (response['success']) {
        _predictions = response['data'] ?? [];
        _error = null;
      } else {
        _error = response['message'] ?? 'Failed to batch predict';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> getPredictions({
    required String routeId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _setLoading(true);
    try {
      final response = await _aiService.getPredictions(
        routeId: routeId,
        startDate: startDate,
        endDate: endDate,
      );
      
      if (response['success']) {
        _predictions = response['data'] ?? [];
        _error = null;
      } else {
        _error = response['message'] ?? 'Failed to get predictions';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  // ==================== CREW FATIGUE ====================

  Future<void> calculateFatigue({
    required String crewId,
    required String crewType,
    DateTime? date,
  }) async {
    _setLoading(true);
    try {
      final response = await _aiService.calculateFatigue(
        crewId: crewId,
        crewType: crewType,
        date: date,
      );
      
      if (response['success']) {
        _fatigueData = response['data'];
        _error = null;
      } else {
        _error = response['message'] ?? 'Failed to calculate fatigue';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> batchCalculateFatigue({
    required String depotId,
    DateTime? date,
  }) async {
    _setLoading(true);
    try {
      final response = await _aiService.batchCalculateFatigue(
        depotId: depotId,
        date: date,
      );
      
      if (response['success']) {
        _fatigueData = response['data'];
        _error = null;
      } else {
        _error = response['message'] ?? 'Failed to calculate fatigue';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> getEligibleCrew({
    required String depotId,
    required String crewType,
    DateTime? date,
    int? maxFatigueScore,
  }) async {
    _setLoading(true);
    try {
      final response = await _aiService.getEligibleCrew(
        depotId: depotId,
        crewType: crewType,
        date: date,
        maxFatigueScore: maxFatigueScore,
      );
      
      if (response['success']) {
        _eligibleCrew = response['data'] ?? [];
        _error = null;
      } else {
        _error = response['message'] ?? 'Failed to get eligible crew';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> getFatigueReport({
    required String depotId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _setLoading(true);
    try {
      final response = await _aiService.getFatigueReport(
        depotId: depotId,
        startDate: startDate,
        endDate: endDate,
      );
      
      if (response['success']) {
        _fatigueReport = {
          'stats': response['stats'],
          'data': response['data'],
        };
        _error = null;
      } else {
        _error = response['message'] ?? 'Failed to get fatigue report';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  // ==================== GENETIC ALGORITHM SCHEDULING ====================

  Future<void> geneticSchedule({
    required String depotId,
    required DateTime startDate,
    required DateTime endDate,
    Map<String, dynamic>? options,
  }) async {
    _setLoading(true);
    try {
      final response = await _aiService.geneticSchedule(
        depotId: depotId,
        startDate: startDate,
        endDate: endDate,
        options: options,
      );
      
      if (response['success']) {
        _scheduleResult = response['data'];
        _error = null;
      } else {
        _error = response['message'] ?? 'Failed to schedule';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  // ==================== ANALYTICS ====================

  Future<void> getAnalytics({
    String? depotId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _setLoading(true);
    try {
      final response = await _aiService.getAnalytics(
        depotId: depotId,
        startDate: startDate,
        endDate: endDate,
      );
      
      if (response['success']) {
        _analytics = response['data'];
        _error = null;
      } else {
        _error = response['message'] ?? 'Failed to get analytics';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  // ==================== HELPERS ====================

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void reset() {
    _demandPrediction = null;
    _predictions = [];
    _fatigueData = null;
    _eligibleCrew = [];
    _fatigueReport = null;
    _scheduleResult = null;
    _analytics = null;
    _error = null;
    notifyListeners();
  }
}
