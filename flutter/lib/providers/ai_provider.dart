import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/ai_demand_prediction.dart';
import '../models/crew_fatigue.dart';

class AIProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  bool _isLoading = false;
  String? _error;
  
  List<DemandPrediction> _predictions = [];
  Map<String, dynamic>? _analytics;
  Map<String, dynamic>? _fatigueReport;
  Map<String, dynamic>? _schedulingResult;

  bool get isLoading => _isLoading;
  String? get error => _error;
  List<DemandPrediction> get predictions => _predictions;
  Map<String, dynamic>? get analytics => _analytics;
  Map<String, dynamic>? get fatigueReport => _fatigueReport;
  Map<String, dynamic>? get schedulingResult => _schedulingResult;

  // Predict demand for a route
  Future<DemandPrediction?> predictDemand({
    required String routeId,
    required DateTime predictionDate,
    required String timeSlot,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/api/ai-scheduling/predict-demand',
        {
          'routeId': routeId,
          'predictionDate': predictionDate.toIso8601String(),
          'timeSlot': timeSlot,
        },
      );

      if (response['success'] == true) {
        final prediction = DemandPrediction.fromJson(response['data']);
        _isLoading = false;
        notifyListeners();
        return prediction;
      } else {
        throw Exception(response['message'] ?? 'Failed to predict demand');
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  // Batch predict demand
  Future<bool> batchPredict({
    required List<String> routeIds,
    required DateTime startDate,
    required DateTime endDate,
    List<String>? timeSlots,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/api/ai-scheduling/batch-predict',
        {
          'routeIds': routeIds,
          'startDate': startDate.toIso8601String(),
          'endDate': endDate.toIso8601String(),
          if (timeSlots != null) 'timeSlots': timeSlots,
        },
      );

      if (response['success'] == true) {
        _predictions = (response['data'] as List)
            .map((json) => DemandPrediction.fromJson(json))
            .toList();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        throw Exception(response['message'] ?? 'Failed to batch predict');
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Get predictions for a route
  Future<void> getPredictions({
    required String routeId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      String url = '/api/ai-scheduling/predictions/$routeId';
      if (startDate != null && endDate != null) {
        url += '?startDate=${startDate.toIso8601String()}&endDate=${endDate.toIso8601String()}';
      }

      final response = await _apiService.get(url);

      if (response['success'] == true) {
        _predictions = (response['data'] as List)
            .map((json) => DemandPrediction.fromJson(json))
            .toList();
      } else {
        throw Exception(response['message'] ?? 'Failed to get predictions');
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Get fatigue report
  Future<void> getFatigueReport({
    required String depotId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      String url = '/api/ai-scheduling/fatigue-report/$depotId';
      if (startDate != null && endDate != null) {
        url += '?startDate=${startDate.toIso8601String()}&endDate=${endDate.toIso8601String()}';
      }

      final response = await _apiService.get(url);

      if (response['success'] == true) {
        _fatigueReport = response;
      } else {
        throw Exception(response['message'] ?? 'Failed to get fatigue report');
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Run genetic algorithm scheduling
  Future<bool> runGeneticScheduling({
    required String depotId,
    required DateTime startDate,
    required DateTime endDate,
    Map<String, dynamic>? options,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/api/ai-scheduling/genetic-schedule',
        {
          'depotId': depotId,
          'startDate': startDate.toIso8601String(),
          'endDate': endDate.toIso8601String(),
          if (options != null) 'options': options,
        },
      );

      if (response['success'] == true) {
        _schedulingResult = response['data'];
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        throw Exception(response['message'] ?? 'Failed to run scheduling');
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Get AI analytics
  Future<void> getAnalytics({
    String? depotId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      String url = '/api/ai-scheduling/analytics';
      List<String> params = [];
      
      if (depotId != null) params.add('depotId=$depotId');
      if (startDate != null) params.add('startDate=${startDate.toIso8601String()}');
      if (endDate != null) params.add('endDate=${endDate.toIso8601String()}');
      
      if (params.isNotEmpty) {
        url += '?${params.join('&')}';
      }

      final response = await _apiService.get(url);

      if (response['success'] == true) {
        _analytics = response['data'];
      } else {
        throw Exception(response['message'] ?? 'Failed to get analytics');
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
