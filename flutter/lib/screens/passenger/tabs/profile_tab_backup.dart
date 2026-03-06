import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/booking_provider.dart';
import '../../../services/api_service.dart';
import '../../../utils/colors.dart';

class DashboardTab extends StatefulWidget {
  const DashboardTab({super.key});

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  List<Map<String, dynamic>> upcomingTrips = [];
  List<Map<String, dynamic>> popularRoutes = [];
  double walletBalance = 0.0;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => isLoading = true);
    try {
      final apiService = ApiService();
      
      // Fetch user's tickets/bookings
      try {
        final ticketsResponse = await apiService.get('/api/passenger/tickets');
        if (ticketsResponse['success'] == true) {
          final tickets = ticketsResponse['tickets'] as List? ?? [];
          setState(() {
            upcomingTrips = tickets
                .where((ticket) {
                  final tripDate = DateTime.tryParse(ticket['tripDetails']?['serviceDate'] ?? '');
                  return tripDate != null && 
                         tripDate.isAfter(DateTime.now()) && 
                         ticket['state'] == 'active';
                })
                .take(3)
                .map((e) => Map<String, dynamic>.from(e))
                .toList();
          });
        }
      } catch (ticketsError) {
        print('⚠️ Error loading tickets: $ticketsError');
        // Don't logout - just show empty state
        // User can still use search and other features
        setState(() {
          upcomingTrips = [];
        });
      }

      // Fetch popular routes (doesn't require auth)
      try {
        final routesResponse = await apiService.get('/api/routes/popular?limit=6', requireAuth: false);
        if (routesResponse['success'] == true) {
          setState(() {
            popularRoutes = (routesResponse['data'] as List? ?? [])
                .map((e) => Map<String, dynamic>.from(e))
                .toList();
          });
        }
      } catch (routesError) {
        print('⚠️ Error loading routes: $routesError');
        // Use default routes if API fails
        setState(() {
          popularRoutes = [
            {'from': 'Kochi', 'to': 'Thiruvananthapuram', 'routeName': 'KL-01'},
            {'from': 'Kochi', 'to': 'Kozhikode', 'routeName': 'KL-02'},
            {'from': 'Kochi', 'to': 'Kollam', 'routeName': 'KL-03'},
            {'from': 'Kochi', 'to': 'Kottayam', 'routeName': 'KL-04'},
            {'from': 'Kochi', 'to': 'Thrissur', 'routeName': 'KL-05'},
            {'from': 'Kochi', 'to': 'Palakkad', 'routeName': 'KL-06'},
          ];
        });
      }
    } catch (e) {
      print('⚠️ Error loading dashboard data: $e');
      // Set default data so dashboard still works
      setState(() {
        upcomingTrips = [];
        popularRoutes = [
          {'from': 'Kochi', 'to': 'Thiruvananthapuram', 'routeName': 'KL-01'},
          {'from': 'Kochi', 'to': 'Kozhikode', 'routeName': 'KL-02'},
          {'from': 'Kochi', 'to': 'Kollam', 'routeName': 'KL-03'},
          {'from': 'Kochi', 'to': 'Kottayam', 'routeName': 'KL-04'},
          {'from': 'Kochi', 'to': 'Thrissur', 'routeName': 'KL-05'},
          {'from': 'Kochi', 'to': 'Palakkad', 'routeName': 'KL-06'},
        ];
      });
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return RefreshIndicator(
      onRefresh: _loadDashboardData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Header
            _buildWelcomeHeader(user),
            const SizedBox(height: 20),

            // Quick Actions
            _buildQuickActions(context),
            const SizedBox(height: 20),

            // Upcoming Trips
            if (upcomingTrips.isNotEmpty) ...[
              _buildUpcomingTrips(),
              const SizedBox(height: 20),
            ],

            // Popular Routes
            _buildPopularRoutes(),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeHeader(Map<String, dynamic>? user) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome back,',
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            user?['name'] ?? 'Passenger',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Plan your next journey with us',
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.text900,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                icon: Icons.search,
                title: 'Search Trip',
                color: AppColors.brandPink,
                onTap: () {
                  // Navigate to search tab
                  DefaultTabController.of(context).animateTo(2);
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                icon: Icons.confirmation_number,
                title: 'My Tickets',
                color: Colors.blue,
                onTap: () {
                  // Navigate to my trips tab
                  DefaultTabController.of(context).animateTo(1);
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                icon: Icons.account_balance_wallet,
                title: 'Wallet',
                subtitle: '₹${walletBalance.toStringAsFixed(0)}',
                color: Colors.green,
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Wallet feature coming soon!')),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                icon: Icons.person,
                title: 'Profile',
                color: Colors.purple,
                onTap: () {
                  // Navigate to profile tab
                  DefaultTabController.of(context).animateTo(3);
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String title,
    String? subtitle,
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
          border: Border.all(color: AppColors.gray200),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.text900,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 12,
                  color: color,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildUpcomingTrips() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Upcoming Trips',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.text900,
              ),
            ),
            TextButton(
              onPressed: () {
                DefaultTabController.of(context).animateTo(1);
              },
              child: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...upcomingTrips.map((trip) => _buildTripCard(trip)),
      ],
    );
  }

  Widget _buildTripCard(Map<String, dynamic> trip) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.directions_bus, color: Colors.blue, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${trip['boardingStop']} → ${trip['destinationStop']}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Seat: ${trip['seatNumber']}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.text600,
                  ),
                ),
                Text(
                  '${trip['tripDetails']?['serviceDate']} • ${trip['tripDetails']?['startTime']}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.text500,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₹${trip['fareAmount']}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.text900,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  trip['state'] ?? 'confirmed',
                  style: const TextStyle(
                    fontSize: 10,
                    color: Colors.green,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPopularRoutes() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Popular Routes',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.text900,
          ),
        ),
        const SizedBox(height: 12),
        if (isLoading)
          const Center(child: CircularProgressIndicator())
        else if (popularRoutes.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Text('No popular routes available'),
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.5,
            ),
            itemCount: popularRoutes.length,
            itemBuilder: (context, index) {
              final route = popularRoutes[index];
              return _buildRouteCard(route);
            },
          ),
      ],
    );
  }

  Widget _buildRouteCard(Map<String, dynamic> route) {
    return InkWell(
      onTap: () {
        // Navigate to search with pre-filled route
        DefaultTabController.of(context).animateTo(2);
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.gray200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    '${route['from']} → ${route['to']}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.text900,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const Icon(
                  Icons.trending_up,
                  color: Colors.green,
                  size: 16,
                ),
              ],
            ),
            Text(
              'Route: ${route['routeName'] ?? route['routeNumber'] ?? 'N/A'}',
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.text600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
