import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'screens/landing/landing_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/passenger/passenger_dashboard_tabs.dart';
import 'screens/passenger/wallet_screen.dart';
import 'screens/conductor/conductor_dashboard.dart';
import 'providers/auth_provider.dart';
import 'providers/booking_provider.dart';
import 'providers/trip_provider.dart';
import 'providers/navigation_provider.dart';
import 'services/api_service.dart';
import 'utils/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize services early for faster performance
  final apiService = ApiService();
  await apiService.init();
  
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  runApp(const YatrikApp());
}

class YatrikApp extends StatelessWidget {
  const YatrikApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..init()),
        ChangeNotifierProvider(create: (_) => BookingProvider()),
        ChangeNotifierProvider(create: (_) => TripProvider()),
        ChangeNotifierProvider(create: (_) => NavigationProvider()),
      ],
      child: MaterialApp(
        title: 'YATRIK - Bus Booking',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const SplashScreen(),
        routes: {
          '/landing': (context) => const LandingScreen(),
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/home': (context) => const PassengerDashboardTabs(),
          '/conductor': (context) => const ConductorDashboard(),
          '/search': (context) => const HomeScreen(),
          '/bookings': (context) => const HomeScreen(),
          '/profile': (context) => const HomeScreen(),
          '/wallet': (context) => const WalletScreen(),
        },
      ),
    );
  }
}
