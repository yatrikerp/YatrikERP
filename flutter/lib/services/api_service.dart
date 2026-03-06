import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _token;
  SharedPreferences? _prefs;
  
  // HTTP client with keep-alive for faster requests
  final http.Client _client = http.Client();

  // Initialize SharedPreferences once
  Future<void> init() async {
    _prefs ??= await SharedPreferences.getInstance();
    _token = _prefs?.getString('auth_token');
  }

  // Get auth token (always reload from storage to ensure freshness)
  Future<String?> getToken() async {
    await init();
    _token = _prefs?.getString('auth_token');
    return _token;
  }

  // Set auth token (optimized)
  Future<void> setToken(String token) async {
    await init();
    _token = token;
    await _prefs?.setString('auth_token', token);
    print('💾 Token saved: ${token.substring(0, 20)}...'); // Debug log
  }

  // Clear auth token (optimized)
  Future<void> clearToken() async {
    _token = null;
    await init();
    await _prefs?.remove('auth_token');
  }

  // Get headers with async token loading
  Future<Map<String, String>> _getHeaders({bool includeAuth = true}) async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (includeAuth) {
      // Ensure token is loaded
      final token = await getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
        print('🔑 Token added to headers'); // Debug log
      } else {
        print('⚠️ No token found'); // Debug log
      }
    }
    
    return headers;
  }

  // GET request (optimized with persistent connection)
  Future<Map<String, dynamic>> get(String endpoint, {bool requireAuth = true}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      print('🌐 GET: $url'); // Debug log
      
      final headers = await _getHeaders(includeAuth: requireAuth);
      
      final response = await _client.get(url, headers: headers)
          .timeout(const Duration(seconds: 60)); // Increased timeout to 60s
      
      print('✅ Status: ${response.statusCode}'); // Debug log
      return _handleResponse(response);
    } catch (e) {
      print('❌ GET Error: $e'); // Debug log
      throw Exception('Network error: $e');
    }
  }

  // POST request (optimized)
  Future<Map<String, dynamic>> post(
    String endpoint,
    Map<String, dynamic> data, {
    bool requireAuth = true,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      print('🌐 POST: $url'); // Debug log
      print('📦 Data: $data'); // Debug log
      
      final headers = await _getHeaders(includeAuth: requireAuth);
      
      final response = await _client.post(
        url,
        headers: headers,
        body: json.encode(data),
      ).timeout(const Duration(seconds: 60)); // Increased timeout to 60s
      
      print('✅ Status: ${response.statusCode}'); // Debug log
      return _handleResponse(response);
    } catch (e) {
      print('❌ POST Error: $e'); // Debug log
      throw Exception('Network error: $e');
    }
  }

  // PUT request (optimized)
  Future<Map<String, dynamic>> put(
    String endpoint,
    Map<String, dynamic> data, {
    bool requireAuth = true,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      print('🌐 PUT: $url'); // Debug log
      
      final headers = await _getHeaders(includeAuth: requireAuth);
      
      final response = await _client.put(
        url,
        headers: headers,
        body: json.encode(data),
      ).timeout(const Duration(seconds: 30)); // Increased timeout
      
      print('✅ Status: ${response.statusCode}'); // Debug log
      return _handleResponse(response);
    } catch (e) {
      print('❌ PUT Error: $e'); // Debug log
      throw Exception('Network error: $e');
    }
  }

  // DELETE request (optimized)
  Future<Map<String, dynamic>> delete(String endpoint, {bool requireAuth = true}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      print('🌐 DELETE: $url'); // Debug log
      
      final headers = await _getHeaders(includeAuth: requireAuth);
      
      final response = await _client.delete(url, headers: headers)
          .timeout(const Duration(seconds: 30)); // Increased timeout
      
      print('✅ Status: ${response.statusCode}'); // Debug log
      return _handleResponse(response);
    } catch (e) {
      print('❌ DELETE Error: $e'); // Debug log
      throw Exception('Network error: $e');
    }
  }

  // Handle response (optimized)
  Map<String, dynamic> _handleResponse(http.Response response) {
    try {
      final body = json.decode(response.body);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return body;
      } else if (response.statusCode == 401) {
        // Authentication error - DON'T clear token automatically
        // Let the calling code decide what to do
        print('🔒 Authentication error detected, redirecting to login');
        final message = body['message'] ?? body['error'] ?? 'Authentication failed. Please log in again.';
        print('🔒 401 Error: $message');
        throw Exception(message);
      } else {
        throw Exception(body['message'] ?? body['error'] ?? 'Request failed with status ${response.statusCode}');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Failed to parse response');
    }
  }
  
  // Dispose client when done
  void dispose() {
    _client.close();
  }
}
