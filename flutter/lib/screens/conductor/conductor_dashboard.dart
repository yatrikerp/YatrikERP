import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../utils/colors.dart';

class ConductorDashboard extends StatefulWidget {
  const ConductorDashboard({super.key});

  @override
  State<ConductorDashboard> createState() => _ConductorDashboardState();
}

class _ConductorDashboardState extends State<ConductorDashboard> {
  String _dutyStatus = 'assigned'; // assigned, active, completed
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Conductor Dashboard'),
        backgroundColor: AppColors.brandPink,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              await authProvider.logout();
              if (mounted) {
                Navigator.pushReplacementNamed(context, '/landing');
              }
            },
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
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
      ),
    );
  }

  Widget _buildBody() {
    switch (_currentIndex) {
      case 0:
        return _buildDashboard();
      case 1:
        return _buildPassengers();
      case 2:
        return _buildScanner();
      default:
        return _buildDashboard();
    }
  }

  Widget _buildDashboard() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Trip Info Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppColors.brandPink.withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Current Trip',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Kochi → Alappuzha',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: const [
                    Icon(Icons.directions_bus, color: Colors.white, size: 16),
                    SizedBox(width: 8),
                    Text(
                      'KL-07-CD-5678',
                      style: TextStyle(color: Colors.white),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildTripDetail('Start', '09:00'),
                    _buildTripDetail('End', '10:30'),
                    _buildTripDetail('Seats', '45'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          
          // Duty Status
          _buildDutyStatus(),
          const SizedBox(height: 20),
          
          // Quick Stats
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Boarded',
                  '3',
                  Icons.check_circle,
                  AppColors.success,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'Expected',
                  '2',
                  Icons.schedule,
                  AppColors.warning,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  'No Show',
                  '1',
                  Icons.cancel,
                  AppColors.error,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          
          // Recent Activity
          const Text(
            'Recent Activity',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.text900,
            ),
          ),
          const SizedBox(height: 12),
          _buildActivityItem(
            'Invalid ticket scanned',
            '2 min ago',
            Icons.warning,
            AppColors.warning,
          ),
          _buildActivityItem(
            'Duplicate ticket detected',
            '5 min ago',
            Icons.error,
            AppColors.error,
          ),
          _buildActivityItem(
            'Passenger request: Seat change',
            '8 min ago',
            Icons.info,
            AppColors.info,
          ),
        ],
      ),
    );
  }

  Widget _buildPassengers() {
    final passengers = [
      {'name': 'John Doe', 'seat': 'A1', 'status': 'boarded', 'pnr': 'PNR123456'},
      {'name': 'Jane Smith', 'seat': 'A2', 'status': 'boarded', 'pnr': 'PNR123457'},
      {'name': 'Bob Wilson', 'seat': 'B1', 'status': 'expected', 'pnr': 'PNR123458'},
      {'name': 'Alice Johnson', 'seat': 'B2', 'status': 'expected', 'pnr': 'PNR123459'},
      {'name': 'Charlie Brown', 'seat': 'C1', 'status': 'no_show', 'pnr': 'PNR123460'},
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: passengers.length,
      itemBuilder: (context, index) {
        final passenger = passengers[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: _getStatusColor(passenger['status'] as String),
              child: Text(
                passenger['seat'] as String,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            title: Text(
              passenger['name'] as String,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text('PNR: ${passenger['pnr']}'),
            trailing: Chip(
              label: Text(
                _getStatusText(passenger['status'] as String),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                ),
              ),
              backgroundColor: _getStatusColor(passenger['status'] as String),
            ),
          ),
        );
      },
    );
  }

  Widget _buildScanner() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 200,
            height: 200,
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.brandPink, width: 3),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.qr_code_scanner,
              size: 100,
              color: AppColors.brandPink,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Scan Passenger Ticket',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.text900,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Position the QR code within the frame',
            style: TextStyle(
              fontSize: 14,
              color: AppColors.text700,
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () {
              // Implement QR scanning
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('QR Scanner will be implemented'),
                  backgroundColor: AppColors.brandPink,
                ),
              );
            },
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text('Start Scanning'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.brandPink,
              padding: const EdgeInsets.symmetric(
                horizontal: 32,
                vertical: 16,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDutyStatus() {
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
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Duty Status',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.text900,
                ),
              ),
              Chip(
                label: Text(
                  _dutyStatus.toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                backgroundColor: _dutyStatus == 'active'
                    ? AppColors.success
                    : _dutyStatus == 'completed'
                        ? AppColors.info
                        : AppColors.warning,
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_dutyStatus == 'assigned')
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _dutyStatus = 'active';
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('Start Duty'),
            ),
          if (_dutyStatus == 'active')
            ElevatedButton(
              onPressed: () {
                setState(() {
                  _dutyStatus = 'completed';
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text('End Duty'),
            ),
        ],
      ),
    );
  }

  Widget _buildTripDetail(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.8),
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
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
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
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

  Widget _buildActivityItem(String message, String time, IconData icon, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.text900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  time,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.text500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
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

  String _getStatusText(String status) {
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
