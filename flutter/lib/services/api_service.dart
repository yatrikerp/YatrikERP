import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _token;

  // Get auth token
  Future<String?> getToken() async {
    if (_token != null) return _token;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    return _token;
  }

  // Set auth token
  Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  // Clear auth token
  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  // Get headers
  Future<Map<String, String>> _getHeaders({bool includeAuth = true}) async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (includeAuth) {
      final token = await getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    
    return headers;
  }

  // GET request
  Future<Map<String, dynamic>> get(String endpoint, {bool requireAuth = true}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final headers = await _getHeaders(includeAuth: requireAuth);
      
      final response = await http.get(url, headers: headers)
          .timeout(ApiConfig.timeout);
      
      return _handleResponse(response);
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // POST request
  Future<Map<String, dynamic>> post(
    String endpoint,
    Map<String, dynamic> data, {
    bool requireAuth = true,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final headers = await _getHeaders(includeAuth: requireAuth);
      
      final response = await http.post(
        url,
        headers: headers,
        body: json.encode(data),
      ).timeout(ApiConfig.timeout);
      
      return _handleResponse(response);
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // PUT request
  Future<Map<String, dynamic>> put(
    String endpoint,
    Map<String, dynamic> data, {
    bool requireAuth = true,
  }) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final headers = await _getHeaders(includeAuth: requireAuth);
      
      final response = await http.put(
        url,
        headers: headers,
        body: json.encode(data),
      ).timeout(ApiConfig.timeout);
      
      return _handleResponse(response);
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // DELETE request
  Future<Map<String, dynamic>> delete(String endpoint, {bool requireAuth = true}) async {
    try {
      final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final headers = await _getHeaders(includeAuth: requireAuth);
      
      final response = await http.delete(url, headers: headers)
          .timeout(ApiConfig.timeout);
      
      return _handleResponse(response);
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Handle response
  Map<String, dynamic> _handleResponse(http.Response response) {
    final body = json.decode(response.body);
    
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    } else {
      throw Exception(body['message'] ?? 'Request failed');
    }
  }
}
