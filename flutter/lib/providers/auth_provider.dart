import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../config/api_config.dart';
import 'dart:convert';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final AuthService _authService = AuthService();
  
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _token;
  Map<String, dynamic>? _user;
  String? _error;
  SharedPreferences? _prefs;
  bool _rememberMe = false;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  Map<String, dynamic>? get user => _user;
  String? get error => _error;
  bool get rememberMe => _rememberMe;

  // Initialize (call once at app start)
  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
    await _apiService.init();
  }

  // Check if user is logged in (optimized)
  Future<void> checkAuth() async {
    try {
      await init();
      
      final token = await _apiService.getToken();
      _rememberMe = _prefs?.getBool('remember_me') ?? false;
      
      if (token != null && _rememberMe) {
        _token = token;
        _isAuthenticated = true;
        
        // Load user data from cache (instant)
        final userJson = _prefs?.getString('user_data');
        if (userJson != null) {
          try {
            _user = json.decode(userJson);
          } catch (e) {
            // Fallback to old format
            _user = Map<String, dynamic>.from(
              Uri.splitQueryString(userJson)
            );
          }
        }
      }
    } catch (e) {
      _error = e.toString();
    }
  }

  // Get saved credentials
  Future<Map<String, String?>> getSavedCredentials() async {
    await init();
    return {
      'email': _prefs?.getString('saved_email'),
      'password': _prefs?.getString('saved_password'),
    };
  }

  // Login (ultra-optimized)
  Future<bool> login(String email, String password, {bool rememberMe = false}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await init();
      
      print('🔐 Attempting login for: $email');
      
      final response = await _apiService.post(
        ApiConfig.login,
        {
          'email': email.trim(),
          'password': password,
        },
        requireAuth: false,
      );

      print('📥 Login response: ${response['success']}');

      if (response['success'] == true && response['token'] != null) {
        _token = response['token'];
        _user = response['user'] ?? response['data']?['user'];
        _isAuthenticated = true;
        _rememberMe = rememberMe;

        print('✅ Login successful, saving token...');
        print('👤 User role: ${_user?['role']}');

        // Save token FIRST before anything else
        await _apiService.setToken(_token!);
        
        // Then save user data and preferences (parallel)
        final futures = [
          _prefs!.setString('user_data', json.encode(_user)),
          _prefs!.setBool('remember_me', rememberMe),
        ];
        
        // Save credentials if remember me is checked
        if (rememberMe) {
          futures.add(_prefs!.setString('saved_email', email.trim()));
          futures.add(_prefs!.setString('saved_password', password));
        } else {
          futures.add(_prefs!.remove('saved_email'));
          futures.add(_prefs!.remove('saved_password'));
        }
        
        await Future.wait(futures);

        // Verify token was saved
        final savedToken = await _apiService.getToken();
        print('🔍 Token verification: ${savedToken != null ? "Token saved successfully" : "ERROR: Token not saved!"}');

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['message'] ?? 'Invalid email or password';
        print('❌ Login failed: $_error');
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      print('❌ Login error: $_error');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Register (optimized)
  Future<bool> register(Map<String, dynamic> userData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await init();
      
      // Ensure phone has +91 prefix
      if (userData['phone'] != null && !userData['phone'].toString().startsWith('+91')) {
        userData['phone'] = '+91${userData['phone']}';
      }
      
      userData['role'] = userData['role'] ?? 'passenger';

      final response = await _apiService.post(
        ApiConfig.register,
        userData,
        requireAuth: false,
      );

      if (response['success'] == true) {
        final data = response['data'];
        _token = data['token'];
        _user = data['user'];
        _isAuthenticated = true;

        // Save token and user data (parallel)
        await Future.wait([
          _apiService.setToken(_token!),
          _prefs!.setString('user_data', json.encode(_user)),
        ]);

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['message'] ?? response['error'] ?? 'Registration failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Logout (optimized)
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      // Don't wait for API call - logout locally first for speed
      final logoutFuture = _apiService.post(ApiConfig.logout, {});
      
      // Clear local data immediately (parallel)
      await Future.wait([
        _apiService.clearToken(),
        _prefs!.remove('user_data'),
        _prefs!.remove('remember_me'),
        _prefs!.remove('saved_email'),
        _prefs!.remove('saved_password'),
      ]);

      _token = null;
      _user = null;
      _isAuthenticated = false;
      
      // Wait for API call to complete (but don't block UI)
      logoutFuture.catchError((_) {});
      
    } catch (e) {
      // Ignore logout errors - user is logged out locally anyway
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Google Sign-In
  Future<bool> signInWithGoogle() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await init();
      
      final result = await _authService.signInWithGoogle();
      
      if (result == null) {
        // User cancelled
        _isLoading = false;
        notifyListeners();
        return false;
      }

      if (result['success'] == true && result['token'] != null) {
        _token = result['token'];
        _user = result['user'];
        _isAuthenticated = true;

        // Save token and user data
        await Future.wait([
          _apiService.setToken(_token!),
          _prefs!.setString('user_data', json.encode(_user)),
          _prefs!.setBool('remember_me', true),
        ]);

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = result['message'] ?? 'Google Sign-In failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
