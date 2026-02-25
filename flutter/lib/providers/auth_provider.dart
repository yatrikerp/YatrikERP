import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../config/api_config.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _token;
  Map<String, dynamic>? _user;
  String? _error;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  Map<String, dynamic>? get user => _user;
  String? get error => _error;

  // Check if user is logged in
  Future<void> checkAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _apiService.getToken();
      if (token != null) {
        _token = token;
        _isAuthenticated = true;
        
        // Load user data from SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        final userJson = prefs.getString('user_data');
        if (userJson != null) {
          _user = Map<String, dynamic>.from(
            Uri.splitQueryString(userJson)
          );
        }
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Login - matches web app backend logic
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        ApiConfig.login,
        {
          'email': email.trim(),
          'password': password,
        },
        requireAuth: false,
      );

      // Backend returns: { success: true, token, user, redirectPath }
      if (response['success'] == true && response['token'] != null) {
        _token = response['token'];
        _user = response['user'] ?? response['data']?['user'];
        _isAuthenticated = true;

        // Save token and user data
        await _apiService.setToken(_token!);
        final prefs = await SharedPreferences.getInstance();
        
        // Save user data as JSON string
        final userJson = {
          '_id': _user?['_id'],
          'name': _user?['name'],
          'email': _user?['email'],
          'role': _user?['role'],
          'phone': _user?['phone'],
        };
        await prefs.setString('user_data', userJson.toString());

        notifyListeners();
        return true;
      } else {
        _error = response['message'] ?? 'Invalid email or password';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Register - matches web app backend logic
  Future<bool> register(Map<String, dynamic> userData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Ensure phone has +91 prefix
      if (userData['phone'] != null && !userData['phone'].toString().startsWith('+91')) {
        userData['phone'] = '+91${userData['phone']}';
      }
      
      // Set default role to passenger
      userData['role'] = userData['role'] ?? 'passenger';

      final response = await _apiService.post(
        ApiConfig.register,
        userData,
        requireAuth: false,
      );

      // Backend returns: { success: true, data: { user, token } }
      if (response['success'] == true) {
        final data = response['data'];
        _token = data['token'];
        _user = data['user'];
        _isAuthenticated = true;

        // Save token and user data
        await _apiService.setToken(_token!);
        final prefs = await SharedPreferences.getInstance();
        
        final userJson = {
          '_id': _user?['_id'],
          'name': _user?['name'],
          'email': _user?['email'],
          'role': _user?['role'],
          'phone': _user?['phone'],
        };
        await prefs.setString('user_data', userJson.toString());

        notifyListeners();
        return true;
      } else {
        _error = response['message'] ?? response['error'] ?? 'Registration failed';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Logout
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _apiService.post(ApiConfig.logout, {});
    } catch (e) {
      // Ignore logout errors
    } finally {
      // Clear local data
      await _apiService.clearToken();
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user_data');

      _token = null;
      _user = null;
      _isAuthenticated = false;
      _isLoading = false;
      notifyListeners();
    }
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
