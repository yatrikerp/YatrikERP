import 'api_service.dart';

class AIService {
  final ApiService _apiService = ApiService();

  // ==================== DEMAND PREDICTION ====================

  /// Predict passenger demand for a route
  Future<Map<String, dynamic>> predictDemand({
    required String routeId,
    required DateTime predictionDate,
    required String timeSlot,
  }) async {
    return await _apiService.post('/api/ai-scheduling/predict-demand', {
      'routeId': routeId,
      'predictionDate': predictionDate.toIso8601String(),
      'timeSlot': timeSlot,
    });
  }

  /// Batch predict demand for multiple routes
  Future<Map<String, dynamic>> batchPredict({
    required List<String> routeIds,
    required DateTime startDate,
    required DateTime endDate,
    List<String>? timeSlots,
  }) async {
    return await _apiService.post('/api/ai-scheduling/batch-predict', {
      'routeIds': routeIds,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      if (timeSlots != null) 'timeSlots': timeSlots,
    });
  }

  /// Get demand predictions for a route
  Future<Map<String, dynamic>> getPredictions({
    required String routeId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    String endpoint = '/api/ai-scheduling/predictions/$routeId';
    
    if (startDate != null && endDate != null) {
      endpoint += '?startDate=${startDate.toIso8601String()}&endDate=${endDate.toIso8601String()}';
    }
    
    return await _apiService.get(endpoint);
  }

  // ==================== CREW FATIGUE ====================

  /// Calculate fatigue score for a crew member
  Future<Map<String, dynamic>> calculateFatigue({
    required String crewId,
    required String crewType,
    DateTime? date,
  }) async {
    return await _apiService.post('/api/ai-scheduling/calculate-fatigue', {
      'crewId': crewId,
      'crewType': crewType,
      if (date != null) 'date': date.toIso8601String(),
    });
  }

  /// Calculate fatigue for all crew in a depot
  Future<Map<String, dynamic>> batchCalculateFatigue({
    required String depotId,
    DateTime? date,
  }) async {
    return await _apiService.post('/api/ai-scheduling/batch-calculate-fatigue', {
      'depotId': depotId,
      if (date != null) 'date': date.toIso8601String(),
    });
  }

  /// Get eligible crew members for assignment
  Future<Map<String, dynamic>> getEligibleCrew({
    required String depotId,
    required String crewType,
    DateTime? date,
    int? maxFatigueScore,
  }) async {
    String endpoint = '/api/ai-scheduling/eligible-crew?depotId=$depotId&crewType=$crewType';
    
    if (date != null) {
      endpoint += '&date=${date.toIso8601String()}';
    }
    if (maxFatigueScore != null) {
      endpoint += '&maxFatigueScore=$maxFatigueScore';
    }
    
    return await _apiService.get(endpoint);
  }

  /// Get comprehensive fatigue report for a depot
  Future<Map<String, dynamic>> getFatigueReport({
    required String depotId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    String endpoint = '/api/ai-scheduling/fatigue-report/$depotId';
    
    if (startDate != null && endDate != null) {
      endpoint += '?startDate=${startDate.toIso8601String()}&endDate=${endDate.toIso8601String()}';
    }
    
    return await _apiService.get(endpoint);
  }

  // ==================== GENETIC ALGORITHM SCHEDULING ====================

  /// Schedule trips using Genetic Algorithm
  Future<Map<String, dynamic>> geneticSchedule({
    required String depotId,
    required DateTime startDate,
    required DateTime endDate,
    Map<String, dynamic>? options,
  }) async {
    return await _apiService.post('/api/ai-scheduling/genetic-schedule', {
      'depotId': depotId,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      if (options != null) 'options': options,
    });
  }

  // ==================== ANALYTICS ====================

  /// Get AI scheduling analytics and insights
  Future<Map<String, dynamic>> getAnalytics({
    String? depotId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    String endpoint = '/api/ai-scheduling/analytics';
    
    List<String> params = [];
    if (depotId != null) params.add('depotId=$depotId');
    if (startDate != null) params.add('startDate=${startDate.toIso8601String()}');
    if (endDate != null) params.add('endDate=${endDate.toIso8601String()}');
    
    if (params.isNotEmpty) {
      endpoint += '?${params.join('&')}';
    }
    
    return await _apiService.get(endpoint);
  }
}
