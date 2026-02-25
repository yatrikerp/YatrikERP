import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/trip.dart';

class TripProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<Trip> _trips = [];
  bool _isLoading = false;
  String? _error;

  List<Trip> get trips => _trips;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Search trips
  Future<void> searchTrips({
    required String from,
    required String to,
    required DateTime date,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final dateStr = date.toIso8601String().split('T')[0];
      final response = await _apiService.get(
        '${ApiConfig.searchTrips}?from=$from&to=$to&date=$dateStr',
        requireAuth: false,
      );

      if (response['success'] == true) {
        final tripsData = response['data']['trips'] as List;
        _trips = tripsData.map((json) => Trip.fromJson(json)).toList();
      } else {
        _error = response['message'] ?? 'Failed to search trips';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Get all trips for a date
  Future<void> getAllTrips({DateTime? date}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final dateStr = (date ?? DateTime.now()).toIso8601String().split('T')[0];
      final response = await _apiService.get(
        '${ApiConfig.allTrips}?date=$dateStr',
        requireAuth: false,
      );

      if (response['success'] == true) {
        final tripsData = response['data']['trips'] as List;
        _trips = tripsData.map((json) => Trip.fromJson(json)).toList();
      } else {
        _error = response['message'] ?? 'Failed to fetch trips';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Get trip details
  Future<Trip?> getTripDetails(String tripId) async {
    try {
      final response = await _apiService.get(
        '${ApiConfig.tripDetails}/$tripId',
        requireAuth: false,
      );

      if (response['success'] == true) {
        return Trip.fromJson(response['data']['trip']);
      }
      return null;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  // Clear trips
  void clearTrips() {
    _trips = [];
    notifyListeners();
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
