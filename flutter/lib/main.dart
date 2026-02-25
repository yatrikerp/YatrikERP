import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'screens/landing/landing_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/conductor/conductor_dashboard.dart';
import 'providers/auth_provider.dart';
import 'providers/booking_provider.dart';
import 'providers/trip_provider.dart';
import 'utils/theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
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
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => BookingProvider()),
        ChangeNotifierProvider(create: (_) => TripProvider()),
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
          '/home': (context) => const HomeScreen(),
          '/conductor': (context) => const ConductorDashboard(),
        },
      ),
    );
  }
}
