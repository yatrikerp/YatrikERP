import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ConductorService {
  // Get auth token
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  // Get conductor dashboard data
  Future<Map<String, dynamic>> getDashboard() async {
    try {
      print('🌐 Fetching conductor dashboard...');
      
      final token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      // Use the same endpoint as web app: /api/conductor/duties/current
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/conductor/duties/current'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout - please check your connection');
        },
      );

      print('✅ Dashboard response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        // Transform the response to match expected format
        final duty = data['data'];
        if (duty == null) {
          // No active duty
          return {
            'conductor': {
              'name': 'Conductor',
              'email': '',
              'phone': ''
            },
            'todaysTrips': [],
            'stats': {
              'ticketsValidatedToday': 0,
              'revenueToday': 0
            }
          };
        }
        
        return {
          'conductor': {
            'name': duty['conductorId']?['name'] ?? 'Conductor',
            'email': duty['conductorId']?['email'] ?? '',
            'phone': duty['conductorId']?['phone'] ?? ''
          },
          'currentDuty': {
            'dutyId': duty['dutyId'] ?? '',
            'status': duty['status'] ?? 'assigned',
            'route': duty['routeId']?['name'] ?? 'No route assigned',
            'routeNumber': duty['routeId']?['routeNumber'] ?? '',
            'bus': duty['busId']?['registrationNumber'] ?? duty['busId']?['busNumber'] ?? 'No bus assigned',
            'depot': duty['depotId']?['depotName'] ?? '',
            'startTime': duty['actualStartTime'] ?? duty['scheduledStartTime'],
            'endTime': duty['actualEndTime'] ?? duty['scheduledEndTime'],
            'progress': duty['progress'] ?? 0
          },
          'todaysTrips': [],
          'stats': {
            'ticketsValidatedToday': 0,
            'revenueToday': 0
          }
        };
      } else {
        print('❌ Dashboard error: ${response.body}');
        throw Exception('Failed to load dashboard: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Dashboard exception: $e');
      rethrow;
    }
  }

  // Get conductor's trips
  Future<List<dynamic>> getTrips({String? date}) async {
    try {
      print('🌐 Fetching conductor trips...');
      
      final token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      // Use the conductor duties endpoint
      String url = '${ApiConfig.baseUrl}/api/conductor/duties/current';
      if (date != null) {
        url += '?date=$date';
      }

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout - please check your connection');
        },
      );

      print('✅ Trips response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        // Transform duty data to trips format
        if (data['success'] == true && data['data'] != null) {
          final duty = data['data'];
          return [
            {
              'id': duty['dutyId'],
              'route': {
                'name': duty['routeId']?['name'] ?? 'Unknown Route',
                'number': duty['routeId']?['routeNumber'] ?? '—'
              },
              'bus': {
                'busNumber': duty['busId']?['registrationNumber'] ?? duty['busId']?['busNumber'] ?? '—'
              },
              'startTime': duty['scheduledStartTime'],
              'endTime': duty['scheduledEndTime'],
              'status': duty['status']
            }
          ];
        }
        return [];
      } else {
        print('❌ Trips error: ${response.body}');
        return [];
      }
    } catch (e) {
      print('❌ Trips exception: $e');
      return [];
    }
  }

  // Get trip passengers
  Future<List<dynamic>> getTripPassengers(String tripId) async {
    try {
      print('🌐 Fetching trip passengers for trip: $tripId');
      
      final token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      // Use the conductor endpoint to get trip passengers
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/api/conductor/trip/$tripId/passengers'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout - please check your connection');
        },
      );

      print('✅ Passengers response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        // Handle different response formats
        if (data['success'] == true) {
          final passengers = data['data']?['passengers'] ?? [];
          print('✅ Found ${passengers.length} passengers');
          return passengers;
        } else {
          print('⚠️ No passengers found');
          return [];
        }
      } else if (response.statusCode == 404) {
        print('⚠️ Trip not found or no passengers');
        return [];
      } else {
        print('❌ Passengers error: ${response.body}');
        return [];
      }
    } catch (e) {
      print('❌ Passengers exception: $e');
      return [];
    }
  }

  // Scan and validate ticket
  Future<Map<String, dynamic>> scanTicket({
    required String qrPayload,
    String? currentStop,
    String? deviceId,
    String? appVersion,
    double? latitude,
    double? longitude,
  }) async {
    try {
      print('🌐 Scanning ticket...');
      
      final token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      // Use the same endpoint as web app: /api/conductor/scan-ticket
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/conductor/scan-ticket'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'qrPayload': qrPayload,
          'currentStop': currentStop,
          'deviceId': deviceId,
          'appVersion': appVersion,
          'latitude': latitude,
          'longitude': longitude,
        }),
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () {
          throw Exception('Request timeout - please check your connection');
        },
      );

      print('✅ Scan response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data;
      } else {
        print('❌ Scan error: ${response.body}');
        final errorData = json.decode(response.body);
        throw Exception(errorData['message'] ?? 'Failed to scan ticket');
      }
    } catch (e) {
      print('❌ Scan exception: $e');
      rethrow;
    }
  }

  // Validate ticket (alias for scanTicket for backward compatibility)
  Future<Map<String, dynamic>> validateTicket(String qrCode) async {
    return await scanTicket(qrPayload: qrCode);
  }
}
