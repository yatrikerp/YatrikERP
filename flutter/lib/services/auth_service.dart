import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../config/api_config.dart';

class AuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    // IMPORTANT: Use WEB client ID (auto-created by Firebase)
    // Find it in Google Cloud Console → APIs & Credentials → OAuth 2.0 Client IDs
    // Look for "Web client (auto created by Google Service)"
    // TODO: Replace with your actual Web Client ID after Firebase setup
    clientId: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com',
  );

  // Google Sign-In with detailed error logging
  Future<Map<String, dynamic>?> signInWithGoogle() async {
    try {
      print('🔵 Starting Google Sign-In...');
      
      // Trigger Google Sign-In flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        print('🟡 User cancelled sign-in');
        return null;
      }

      print('✅ Google user signed in: ${googleUser.email}');

      // Get authentication details
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      print('🔵 Got authentication tokens');
      print('   - ID Token: ${googleAuth.idToken != null ? "Present" : "Missing"}');
      print('   - Access Token: ${googleAuth.accessToken != null ? "Present" : "Missing"}');
      
      // Send to backend for verification and user creation
      print('🔵 Sending to backend: ${ApiConfig.baseUrl}/api/auth/google');
      
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/api/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'idToken': googleAuth.idToken,
          'accessToken': googleAuth.accessToken,
          'email': googleUser.email,
          'name': googleUser.displayName,
          'photoUrl': googleUser.photoUrl,
        }),
      );

      print('🔵 Backend response: ${response.statusCode}');
      print('   Body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        print('✅ Backend authentication successful');
        return {
          'success': true,
          'token': data['token'],
          'user': data['user'] ?? data['data']?['user'],
        };
      } else {
        final error = json.decode(response.body);
        print('❌ Backend error: ${error['message']}');
        return {
          'success': false,
          'message': error['message'] ?? 'Google Sign-In failed',
        };
      }
    } catch (e, stackTrace) {
      print('❌ Google Sign-In error: $e');
      print('Stack trace: $stackTrace');
      return {
        'success': false,
        'message': 'Google Sign-In error: ${e.toString()}',
      };
    }
  }

  // Google Sign-Out
  Future<void> signOutGoogle() async {
    try {
      await _googleSignIn.signOut();
      print('✅ Google sign-out successful');
    } catch (e) {
      print('⚠️ Google sign-out error: $e');
    }
  }

  // Check if user is signed in with Google
  Future<bool> isSignedInWithGoogle() async {
    return await _googleSignIn.isSignedIn();
  }
}
