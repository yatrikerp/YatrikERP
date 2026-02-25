import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';
import '../models/booking.dart';

class BookingProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<Booking> _bookings = [];
  Booking? _currentBooking;
  bool _isLoading = false;
  String? _error;

  List<Booking> get bookings => _bookings;
  Booking? get currentBooking => _currentBooking;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Create booking
  Future<Map<String, dynamic>?> createBooking(Map<String, dynamic> bookingData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        ApiConfig.createBooking,
        bookingData,
      );

      if (response['success'] == true) {
        return response['data'];
      } else {
        _error = response['message'] ?? 'Failed to create booking';
        return null;
      }
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Confirm booking (after payment)
  Future<bool> confirmBooking(String bookingId, {String? paymentId}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        ApiConfig.confirmBooking,
        {
          'bookingId': bookingId,
          'paymentId': paymentId,
          'paymentStatus': 'completed',
        },
        requireAuth: false,
      );

      if (response['success'] == true) {
        _currentBooking = Booking.fromJson(response['data']['booking']);
        notifyListeners();
        return true;
      } else {
        _error = response['message'] ?? 'Failed to confirm booking';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Get my bookings
  Future<void> getMyBookings() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get(ApiConfig.passengerBookings);

      if (response['success'] == true) {
        final bookingsData = response['data']['bookings'] as List;
        _bookings = bookingsData.map((json) => Booking.fromJson(json)).toList();
      } else {
        _error = response['message'] ?? 'Failed to fetch bookings';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Get booking by PNR
  Future<Booking?> getBookingByPnr(String pnr) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get(
        '${ApiConfig.bookingByPnr}/$pnr',
        requireAuth: false,
      );

      if (response['success'] == true) {
        _currentBooking = Booking.fromJson(response['data']);
        notifyListeners();
        return _currentBooking;
      } else {
        _error = response['message'] ?? 'Booking not found';
        return null;
      }
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Clear current booking
  void clearCurrentBooking() {
    _currentBooking = null;
    notifyListeners();
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
