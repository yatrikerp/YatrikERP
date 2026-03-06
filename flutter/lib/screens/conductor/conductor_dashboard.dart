import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/conductor_service.dart';
import '../../utils/colors.dart';
import 'package:intl/intl.dart';
import 'qr_scanner_screen.dart';

class ConductorDashboard extends StatefulWidget {
  const ConductorDashboard({super.key});

  @override
  State<ConductorDashboard> createState() => _ConductorDashboardState();
}

class _ConductorDashboardState extends State<ConductorDashboard> {
  final ConductorService _conductorService = ConductorService();
  
  // State Management
  String _dutyStatus = 'assigned'; // not_assigned, assigned, active, completed
  int _activeView = 0; // 0: Dashboard, 1: Passengers, 2: Scanning
  bool _isLoading = true;
  String? _error;
  bool _soundEnabled = true;
  
  // Dashboard data
  Map<String, dynamic>? _dashboardData;
  Map<String, dynamic>? _conductorInfo;
  Map<String, dynamic>? _currentDuty;
  Map<String, dynamic>? _stats;
  
  // Trip Information
  final Map<String, dynamic> _tripInfo = {
    'routeName': 'Kochi → Alappuzha',
    'routeNumber': 'KL-07-CD-5678',
    'depotName': 'Kochi Depot',
    'dutyId': 'DUTY-2024-001',
    'busNumber': 'KL-07-CD-5678',
    'currentStop': 'Cherthala Junction',
    'nextStop': 'Alappuzha Central',
    'progress': 60,
    'stops': [
      {'name': 'Kochi Central', 'completed': true},
      {'name': 'Edappally', 'completed': true},
      {'name': 'Cherthala', 'completed': false, 'current': true},
      {'name': 'Alappuzha', 'completed': false},
    ],
  };
  
  // Passenger Management
  final List<Map<String, dynamic>> _passengers = [];
  String _passengerFilter = 'all'; // all, boarded, expected, no_show
  String _sortBy = 'seat'; // seat, name, stop, status, pnr
  String _searchQuery = '';
  
  // Scan History
  final List<Map<String, dynamic>> _scanHistory = [];

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
    _addSampleScanHistory();
    // Auto-refresh every 30 seconds
    Future.delayed(const Duration(seconds: 30), () {
      if (mounted) _loadDashboardData();
    });
  }

  void _addSampleScanHistory() {
    setState(() {
      _scanHistory.addAll([
        {
          'success': true,
          'pnr': 'PNR123456',
          'passenger': 'John Doe',
          'seat': 'A1',
          'time': DateTime.now().subtract(const Duration(minutes: 2)),
        },
        {
          'success': true,
          'pnr': 'PNR123457',
          'passenger': 'Jane Smith',
          'seat': 'A2',
          'time': DateTime.now().subtract(const Duration(minutes: 5)),
        },
        {
          'success': false,
          'pnr': 'PNR999999',
          'time': DateTime.now().subtract(const Duration(minutes: 8)),
        },
        {
          'success': true,
          'pnr': 'PNR123461',
          'passenger': 'Diana Prince',
          'seat': 'C2',
          'time': DateTime.now().subtract(const Duration(minutes: 12)),
        },
      ]);
    });
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await _conductorService.getDashboard();
      
      // Update state variables
      _dashboardData = data;
      _conductorInfo = data['conductor'];
      _currentDuty = data['currentDuty'];
      _stats = data['stats'];
      
      // Update trip info from current duty
      if (_currentDuty != null) {
        _tripInfo['routeName'] = _currentDuty!['route'] ?? 'No route assigned';
        _tripInfo['routeNumber'] = _currentDuty!['routeNumber'] ?? '—';
        _tripInfo['depotName'] = _currentDuty!['depot'] ?? '—';
        _tripInfo['dutyId'] = _currentDuty!['dutyId'] ?? '—';
        _tripInfo['busNumber'] = _currentDuty!['bus'] ?? '—';
        _tripInfo['progress'] = _currentDuty!['progress'] ?? 0;
        
        // Set duty status
        final status = _currentDuty!['status'];
        _dutyStatus = (status == 'started' || status == 'in-progress') 
            ? 'active' 
            : (status == 'completed' ? 'completed' : 'assigned');
        
        // Load passengers if we have a trip ID
        await _loadPassengers();
      } else {
        _dutyStatus = 'not_assigned';
        // Add sample passengers for demo if no duty
        _addSamplePassengers();
      }
      
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('❌ Error loading dashboard: $e');
      // Add sample passengers even on error for demo
      _addSamplePassengers();
      
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _loadPassengers() async {
    try {
      // Try to get trip ID from current duty
      final tripId = _currentDuty?['tripId'];
      if (tripId != null) {
        print('🌐 Loading passengers for trip: $tripId');
        final passengers = await _conductorService.getTripPassengers(tripId);
        setState(() {
          _passengers.clear();
          _passengers.addAll(passengers.cast<Map<String, dynamic>>());
        });
        print('✅ Loaded ${_passengers.length} passengers');
      } else {
        print('⚠️ No trip ID available, using sample data');
        _addSamplePassengers();
      }
    } catch (e) {
      print('❌ Error loading passengers: $e');
      // Add sample passengers for demo
      _addSamplePassengers();
    }
  }

  void _addSamplePassengers() {
    setState(() {
      _passengers.clear();
      _passengers.addAll([
        {
          'id': 1,
          'name': 'John Doe',
          'seat': 'A1',
          'boardingStop': 'Kochi Central',
          'destination': 'Alappuzha',
          'status': 'boarded',
          'pnr': 'PNR123456'
        },
        {
          'id': 2,
          'name': 'Jane Smith',
          'seat': 'A2',
          'boardingStop': 'Edappally',
          'destination': 'Alappuzha',
          'status': 'boarded',
          'pnr': 'PNR123457'
        },
        {
          'id': 3,
          'name': 'Bob Wilson',
          'seat': 'B1',
          'boardingStop': 'Cherthala',
          'destination': 'Alappuzha',
          'status': 'expected',
          'pnr': 'PNR123458'
        },
        {
          'id': 4,
          'name': 'Alice Johnson',
          'seat': 'B2',
          'boardingStop': 'Kochi Central',
          'destination': 'Alappuzha',
          'status': 'expected',
          'pnr': 'PNR123459'
        },
        {
          'id': 5,
          'name': 'Charlie Brown',
          'seat': 'C1',
          'boardingStop': 'Edappally',
          'destination': 'Alappuzha',
          'status': 'no_show',
          'pnr': 'PNR123460'
        },
        {
          'id': 6,
          'name': 'Diana Prince',
          'seat': 'C2',
          'boardingStop': 'Cherthala',
          'destination': 'Alappuzha',
          'status': 'boarded',
          'pnr': 'PNR123461'
        },
      ]);
    });
    print('✅ Added ${_passengers.length} sample passengers');
  }

  void _startDuty() {
    setState(() {
      _dutyStatus = 'active';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Duty started successfully'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  void _endDuty() {
    setState(() {
      _dutyStatus = 'completed';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Duty completed successfully'),
        backgroundColor: AppColors.info,
      ),
    );
  }

  Future<void> _openQRScanner() async {
    final result = await Navigator.push<Map<String, dynamic>>(
      context,
      MaterialPageRoute(
        builder: (context) => const QRScannerScreen(),
      ),
    );

    if (result != null && mounted) {
      setState(() {
        _scanHistory.insert(0, result);
      });

      // Show result
      final isSuccess = result['success'] == true;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isSuccess
                ? 'Ticket validated: ${result['passenger'] ?? result['pnr']}'
                : 'Invalid ticket: ${result['pnr']}',
          ),
          backgroundColor: isSuccess ? AppColors.success : AppColors.error,
          duration: const Duration(seconds: 3),
        ),
      );

      // Reload passengers to update status
      if (isSuccess) {
        await _loadPassengers();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: _buildAppBar(),
      body: _isLoading ? _buildLoading() : _error != null ? _buildError() : _buildBody(),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      elevation: 0,
      backgroundColor: AppColors.brandPink,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'CONDUCTOR DASHBOARD',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          Text(
            _conductorInfo?['name'] ?? 'Conductor',
            style: const TextStyle(
              fontSize: 12,
              color: Colors.white70,
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: Icon(
            _soundEnabled ? Icons.volume_up : Icons.volume_off,
            color: Colors.white,
          ),
          onPressed: () {
            setState(() {
              _soundEnabled = !_soundEnabled;
            });
          },
        ),
        IconButton(
          icon: const Icon(Icons.refresh, color: Colors.white),
          onPressed: _loadDashboardData,
        ),
        IconButton(
          icon: const Icon(Icons.logout, color: Colors.white),
          onPressed: () async {
            final authProvider = Provider.of<AuthProvider>(context, listen: false);
            await authProvider.logout();
            if (mounted) {
              Navigator.pushReplacementNamed(context, '/landing');
            }
          },
        ),
      ],
    );
  }

  Widget _buildLoading() {
    return const Center(
      child: CircularProgressIndicator(
        color: AppColors.brandPink,
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            const Text(
              'Failed to load dashboard',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.text700),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadDashboardData,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brandPink,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    return Column(
      children: [
        _buildTripContextBar(),
        Expanded(
          child: IndexedStack(
            index: _activeView,
            children: [
              _buildDashboardView(),
              _buildPassengersView(),
              _buildScanningView(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTripContextBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Route Info
          Row(
            children: [
              const Icon(Icons.route, size: 16, color: AppColors.brandPink),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  _tripInfo['routeName'],
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text900,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getDutyStatusColor(),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _getDutyStatusText(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Depot and Bus Info
          Row(
            children: [
              const Icon(Icons.business, size: 14, color: AppColors.text700),
              const SizedBox(width: 4),
              Text(
                _tripInfo['depotName'],
                style: TextStyle(fontSize: 12, color: AppColors.text700),
              ),
              const SizedBox(width: 16),
              const Icon(Icons.directions_bus, size: 14, color: AppColors.text700),
              const SizedBox(width: 4),
              Text(
                'Bus: ${_tripInfo['busNumber']}',
                style: TextStyle(fontSize: 12, color: AppColors.text700),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: (_tripInfo['progress'] ?? 0) / 100,
              backgroundColor: Colors.grey[200],
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.brandPink),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${_tripInfo['progress']}% Complete',
            style: TextStyle(fontSize: 11, color: AppColors.text500),
          ),
        ],
      ),
    );
  }

  Widget _buildDashboardView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Quick Actions
          _buildQuickActions(),
          const SizedBox(height: 16),
          
          // Status Widgets
          _buildStatusWidgets(),
          const SizedBox(height: 16),
          
          // Trip Progress
          _buildTripProgress(),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildQuickActionCard(
                icon: _dutyStatus == 'active' ? Icons.check_circle : Icons.play_arrow,
                title: _dutyStatus == 'active' ? 'End Duty' : 'Start Duty',
                subtitle: _dutyStatus == 'active' ? 'Complete your duty' : 'Begin ticket scanning',
                color: _dutyStatus == 'active' ? AppColors.error : AppColors.success,
                onTap: _dutyStatus == 'active' ? _endDuty : _startDuty,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickActionCard(
                icon: Icons.qr_code_scanner,
                title: 'Scan Tickets',
                subtitle: 'QR code validation',
                color: AppColors.brandPink,
                onTap: () => setState(() => _activeView = 2),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildQuickActionCard(
                icon: Icons.people,
                title: 'Passenger List',
                subtitle: 'Manage passengers',
                color: AppColors.info,
                onTap: () => setState(() => _activeView = 1),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildQuickActionCard(
                icon: Icons.event_seat,
                title: 'Vacant Seats',
                subtitle: 'Sell available seats',
                color: AppColors.warning,
                onTap: () => setState(() => _activeView = 1),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildQuickActionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: AppColors.text900,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 11,
                color: AppColors.text700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusWidgets() {
    final ticketsValidated = _stats?['ticketsValidatedToday'] ?? 0;
    final revenueToday = _stats?['revenueToday'] ?? 0;
    
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            icon: Icons.people,
            label: 'Passengers',
            value: '${_passengers.where((p) => p['status'] == 'boarded').length}/${_passengers.length}',
            color: AppColors.success,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            icon: Icons.check_circle,
            label: 'Validated',
            value: ticketsValidated.toString(),
            color: AppColors.brandPink,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            icon: Icons.currency_rupee,
            label: 'Revenue',
            value: '₹$revenueToday',
            color: AppColors.info,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: AppColors.text700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTripProgress() {
    final progress = _tripInfo['progress'] ?? 0;
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Trip Progress',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.text900,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.brandPink.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$progress% Complete',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.brandPink,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          // Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress / 100,
              backgroundColor: Colors.grey[200],
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.brandPink),
              minHeight: 12,
            ),
          ),
          const SizedBox(height: 24),
          
          // Route Stops
          Column(
            children: [
              _buildStopItem(
                'Kochi Central',
                isCompleted: progress >= 0,
                isCurrent: progress < 33,
              ),
              _buildStopConnector(isCompleted: progress >= 33),
              _buildStopItem(
                'Edappally',
                isCompleted: progress >= 33,
                isCurrent: progress >= 33 && progress < 66,
              ),
              _buildStopConnector(isCompleted: progress >= 66),
              _buildStopItem(
                'Cherthala',
                isCompleted: progress >= 66,
                isCurrent: progress >= 66 && progress < 100,
              ),
              _buildStopConnector(isCompleted: progress >= 100),
              _buildStopItem(
                'Alappuzha',
                isCompleted: progress >= 100,
                isCurrent: false,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStopItem(String stopName, {required bool isCompleted, required bool isCurrent}) {
    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: isCompleted 
                ? AppColors.success 
                : isCurrent 
                    ? AppColors.brandPink 
                    : Colors.grey[300],
            shape: BoxShape.circle,
            border: Border.all(
              color: isCurrent ? AppColors.brandPink : Colors.transparent,
              width: 3,
            ),
          ),
          child: Center(
            child: Icon(
              isCompleted ? Icons.check : Icons.circle,
              color: Colors.white,
              size: isCompleted ? 18 : 12,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            stopName,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
              color: isCompleted || isCurrent ? AppColors.text900 : AppColors.text500,
            ),
          ),
        ),
        if (isCurrent)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.brandPink,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              'Current',
              style: TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildStopConnector({required bool isCompleted}) {
    return Padding(
      padding: const EdgeInsets.only(left: 15),
      child: Container(
        width: 2,
        height: 24,
        color: isCompleted ? AppColors.success : Colors.grey[300],
      ),
    );
  }

  Widget _buildPassengersView() {
    return Column(
      children: [
        // Filter Buttons
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.white,
          child: Row(
            children: [
              _buildFilterChip('All', 'all', _passengers.length),
              const SizedBox(width: 8),
              _buildFilterChip('Boarded', 'boarded', 
                _passengers.where((p) => p['status'] == 'boarded').length),
              const SizedBox(width: 8),
              _buildFilterChip('Expected', 'expected',
                _passengers.where((p) => p['status'] == 'expected').length),
              const SizedBox(width: 8),
              _buildFilterChip('No Show', 'no_show',
                _passengers.where((p) => p['status'] == 'no_show').length),
            ],
          ),
        ),
        
        // Passenger List
        Expanded(
          child: _passengers.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.people_outline, size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text(
                        'No passengers yet',
                        style: TextStyle(
                          fontSize: 16,
                          color: AppColors.text700,
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _getFilteredPassengers().length,
                  itemBuilder: (context, index) {
                    final passenger = _getFilteredPassengers()[index];
                    return _buildPassengerCard(passenger);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildFilterChip(String label, String value, int count) {
    final isSelected = _passengerFilter == value;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _passengerFilter = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.brandPink : Colors.grey[200],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: [
              Text(
                count.toString(),
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? Colors.white : AppColors.text900,
                ),
              ),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: isSelected ? Colors.white : AppColors.text700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Map<String, dynamic>> _getFilteredPassengers() {
    return _passengers.where((p) {
      if (_passengerFilter == 'all') return true;
      return p['status'] == _passengerFilter;
    }).toList();
  }

  Widget _buildPassengerCard(Map<String, dynamic> passenger) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: _getStatusColor(passenger['status']).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                passenger['seat'] ?? 'N/A',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: _getStatusColor(passenger['status']),
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  passenger['name'] ?? 'Unknown',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'PNR: ${passenger['pnr'] ?? 'N/A'}',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.text700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${passenger['boardingStop']} → ${passenger['destination']}',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.text500,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: _getStatusColor(passenger['status']),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              _getStatusText(passenger['status']),
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanningView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          const Text(
            'QR Ticket Scanning',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.text900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Scan passenger tickets for validation',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.text700,
            ),
          ),
          const SizedBox(height: 24),
          
          // Scan Area
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                // QR Icon
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: AppColors.brandPink.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.qr_code_scanner,
                    size: 64,
                    color: AppColors.brandPink,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Ready to Scan',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text900,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Tap the button below to start scanning QR codes',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.text700,
                  ),
                ),
                const SizedBox(height: 24),
                
                // Start Scan Button
                Container(
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.brandPink.withOpacity(0.3),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: ElevatedButton.icon(
                    onPressed: _openQRScanner,
                    icon: const Icon(Icons.camera_alt, size: 24),
                    label: const Text(
                      'Start QR Scan',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 16,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Quick Stats
          Row(
            children: [
              Expanded(
                child: _buildScanStatCard(
                  icon: Icons.check_circle,
                  label: 'Successful',
                  value: _scanHistory.where((s) => s['success'] == true).length.toString(),
                  color: AppColors.success,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildScanStatCard(
                  icon: Icons.error,
                  label: 'Failed',
                  value: _scanHistory.where((s) => s['success'] == false).length.toString(),
                  color: AppColors.error,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          
          // Recent Scan History
          if (_scanHistory.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Scans',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text900,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _scanHistory.clear();
                    });
                  },
                  child: const Text('Clear All'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ..._scanHistory.take(5).map((scan) => _buildScanHistoryItem(scan)).toList(),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Icon(Icons.history, size: 48, color: Colors.grey[400]),
                  const SizedBox(height: 12),
                  Text(
                    'No scan history yet',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.text700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Start scanning tickets to see history',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.text500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildScanStatCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 32),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: AppColors.text700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScanHistoryItem(Map<String, dynamic> scan) {
    final isSuccess = scan['success'] == true;
    final time = scan['time'] ?? DateTime.now();
    final timeStr = time is DateTime 
        ? DateFormat('HH:mm:ss').format(time)
        : time.toString();
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSuccess 
              ? AppColors.success.withOpacity(0.3)
              : AppColors.error.withOpacity(0.3),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isSuccess 
                  ? AppColors.success.withOpacity(0.1)
                  : AppColors.error.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              isSuccess ? Icons.check_circle : Icons.error,
              color: isSuccess ? AppColors.success : AppColors.error,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  scan['pnr'] ?? 'Unknown PNR',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text900,
                  ),
                ),
                const SizedBox(height: 4),
                if (isSuccess && scan['passenger'] != null)
                  Text(
                    scan['passenger'],
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.text700,
                    ),
                  ),
                Text(
                  timeStr,
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.text500,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: isSuccess ? AppColors.success : AppColors.error,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              isSuccess ? 'Valid' : 'Invalid',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNav() {
    return BottomNavigationBar(
      currentIndex: _activeView,
      onTap: (index) => setState(() => _activeView = index),
      selectedItemColor: AppColors.brandPink,
      unselectedItemColor: AppColors.text500,
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.dashboard),
          label: 'Dashboard',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.people),
          label: 'Passengers',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.qr_code_scanner),
          label: 'Scan',
        ),
      ],
    );
  }

  Color _getDutyStatusColor() {
    switch (_dutyStatus) {
      case 'active':
        return AppColors.success;
      case 'completed':
        return AppColors.info;
      case 'not_assigned':
        return AppColors.text500;
      default:
        return AppColors.warning;
    }
  }

  String _getDutyStatusText() {
    switch (_dutyStatus) {
      case 'active':
        return 'On Duty';
      case 'completed':
        return 'Completed';
      case 'not_assigned':
        return 'No Duty';
      default:
        return 'Ready';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'boarded':
        return AppColors.success;
      case 'expected':
        return AppColors.warning;
      case 'no_show':
        return AppColors.error;
      default:
        return AppColors.text500;
    }
  }

  String _getStatusText(String? status) {
    switch (status) {
      case 'boarded':
        return 'Boarded';
      case 'expected':
        return 'Expected';
      case 'no_show':
        return 'No Show';
      default:
        return 'Unknown';
    }
  }
}
