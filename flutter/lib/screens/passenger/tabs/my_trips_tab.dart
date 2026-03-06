import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/booking_provider.dart';
import '../../../services/api_service.dart';
import '../../../utils/colors.dart';

class MyTripsTab extends StatefulWidget {
  const MyTripsTab({super.key});

  @override
  State<MyTripsTab> createState() => _MyTripsTabState();
}

class _MyTripsTabState extends State<MyTripsTab> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> upcomingTrips = [];
  List<Map<String, dynamic>> completedTrips = [];
  List<Map<String, dynamic>> cancelledTrips = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadTrips();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadTrips() async {
    setState(() => isLoading = true);
    try {
      final apiService = ApiService();
      final response = await apiService.get('/api/passenger/tickets');
      
      if (response['success'] == true) {
        final tickets = response['tickets'] as List? ?? [];
        final now = DateTime.now();
        
        setState(() {
          upcomingTrips = tickets
              .where((ticket) {
                final tripDate = DateTime.tryParse(ticket['tripDetails']?['serviceDate'] ?? '');
                return tripDate != null && 
                       tripDate.isAfter(now) && 
                       ticket['state'] == 'active';
              })
              .map((e) => Map<String, dynamic>.from(e))
              .toList();

          completedTrips = tickets
              .where((ticket) {
                final tripDate = DateTime.tryParse(ticket['tripDetails']?['serviceDate'] ?? '');
                return tripDate != null && 
                       tripDate.isBefore(now) && 
                       ticket['state'] == 'completed';
              })
              .map((e) => Map<String, dynamic>.from(e))
              .toList();

          cancelledTrips = tickets
              .where((ticket) => ticket['state'] == 'cancelled')
              .map((e) => Map<String, dynamic>.from(e))
              .toList();
        });
      }
    } catch (e) {
      print('Error loading trips: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: Colors.white,
          child: TabBar(
            controller: _tabController,
            labelColor: AppColors.brandPink,
            unselectedLabelColor: AppColors.text600,
            indicatorColor: AppColors.brandPink,
            tabs: [
              Tab(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Upcoming'),
                    if (upcomingTrips.isNotEmpty) ...[
                      const SizedBox(width: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.brandPink,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${upcomingTrips.length}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const Tab(text: 'Completed'),
              const Tab(text: 'Cancelled'),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadTrips,
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildTripsList(upcomingTrips, 'upcoming'),
                _buildTripsList(completedTrips, 'completed'),
                _buildTripsList(cancelledTrips, 'cancelled'),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTripsList(List<Map<String, dynamic>> trips, String type) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (trips.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              type == 'upcoming' 
                  ? Icons.event_busy 
                  : type == 'completed' 
                      ? Icons.check_circle_outline 
                      : Icons.cancel_outlined,
              size: 64,
              color: AppColors.text400,
            ),
            const SizedBox(height: 16),
            Text(
              type == 'upcoming'
                  ? 'No upcoming trips'
                  : type == 'completed'
                      ? 'No completed trips'
                      : 'No cancelled trips',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.text600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              type == 'upcoming'
                  ? 'Book your next journey now!'
                  : type == 'completed'
                      ? 'Your travel history will appear here'
                      : 'Cancelled bookings will appear here',
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.text500,
              ),
            ),
            if (type == 'upcoming') ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  DefaultTabController.of(context).animateTo(2);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brandPink,
                  padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                ),
                child: const Text('Search Buses'),
              ),
            ],
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: trips.length,
      itemBuilder: (context, index) {
        return _buildTripCard(trips[index], type);
      },
    );
  }

  Widget _buildTripCard(Map<String, dynamic> trip, String type) {
    final statusColor = type == 'upcoming'
        ? Colors.green
        : type == 'completed'
            ? Colors.blue
            : Colors.red;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gray200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.confirmation_number, color: statusColor, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      'PNR: ${trip['pnr'] ?? trip['_id'] ?? 'N/A'}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    type.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 10,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Trip Details
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Route
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            trip['boardingStop'] ?? 'N/A',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.text900,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            trip['tripDetails']?['startTime'] ?? 'N/A',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.text600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.gray100,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.arrow_forward, size: 16, color: AppColors.text600),
                        ],
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            trip['destinationStop'] ?? 'N/A',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.text900,
                            ),
                            textAlign: TextAlign.right,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            trip['tripDetails']?['endTime'] ?? 'N/A',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.text600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(height: 1),
                const SizedBox(height: 16),

                // Additional Info
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildInfoItem(
                      Icons.event,
                      trip['tripDetails']?['serviceDate'] ?? 'N/A',
                    ),
                    _buildInfoItem(
                      Icons.airline_seat_recline_normal,
                      'Seat: ${trip['seatNumber'] ?? 'N/A'}',
                    ),
                    _buildInfoItem(
                      Icons.currency_rupee,
                      '₹${trip['fareAmount'] ?? 0}',
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Actions
          if (type == 'upcoming')
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.gray200)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        _showTicketDetails(trip);
                      },
                      icon: const Icon(Icons.visibility, size: 18),
                      label: const Text('View Ticket'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.brandPink,
                        side: const BorderSide(color: AppColors.brandPink),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        _cancelTrip(trip);
                      },
                      icon: const Icon(Icons.cancel, size: 18),
                      label: const Text('Cancel'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.text600),
        const SizedBox(width: 4),
        Text(
          text,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.text600,
          ),
        ),
      ],
    );
  }

  void _showTicketDetails(Map<String, dynamic> trip) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.gray300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Ticket Details',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.text900,
                ),
              ),
              const SizedBox(height: 24),
              // Add ticket details here
              Text('PNR: ${trip['pnr'] ?? trip['_id'] ?? 'N/A'}'),
              Text('Route: ${trip['boardingStop']} → ${trip['destinationStop']}'),
              Text('Date: ${trip['tripDetails']?['serviceDate'] ?? 'N/A'}'),
              Text('Seat: ${trip['seatNumber'] ?? 'N/A'}'),
              Text('Fare: ₹${trip['fareAmount'] ?? 0}'),
            ],
          ),
        ),
      ),
    );
  }

  void _cancelTrip(Map<String, dynamic> trip) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Trip'),
        content: const Text('Are you sure you want to cancel this trip?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              // Implement cancel logic
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Trip cancellation requested')),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
  }
}
