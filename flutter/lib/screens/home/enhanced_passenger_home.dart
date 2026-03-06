import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../config/api_config.dart';
import '../../utils/colors.dart';
import 'package:intl/intl.dart';

class EnhancedPassengerHome extends StatefulWidget {
  const EnhancedPassengerHome({super.key});

  @override
  State<EnhancedPassengerHome> createState() => _EnhancedPassengerHomeState();
}

class _EnhancedPassengerHomeState extends State<EnhancedPassengerHome> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  
  // Dashboard data
  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
  }

  Future<void> _fetchDashboardData() async {
    setStat