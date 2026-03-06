import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../utils/colors.dart';
import '../booking/boarding_point_screen.dart';

class SearchResultsScreen extends StatefulWidget {
  final String from;
  final String to;
  final DateTime date;
  final int passengers;

  const SearchResultsScreen({
    super.key,
    required this.from,
    required this.to,
    required this.date,
    required this.passengers,
  });

  @override
  State<SearchResultsScreen> createState() => _SearchResultsScreenState();
}

class _SearchResultsScreenState extends State<SearchResultsScreen> {
  List<Map<String, dynamic>> trips = [];
  bool isLoading = true;
  String sortBy = 'departure'; // departure, price, duration, rating

  @override
  void initState() {
    super.initState();
    _searchTrips();
  }

  Future<void> _searchTrips() async {
    setState(() => isLoading = true);
    try {
      final apiService = ApiService();
      final dateString = '${widget.date.year}-${widget.date.month.toString().padLeft(2, '0')}-${widget.date.day.toString().padLeft(2, '0')}';
      
      final response = await apiService.get(
        '/api/trips/search?from=${Uri.encodeComponent(widget.from)}&to=${Uri.encodeComponent(widget.to)}&date=$dateString'
      );
      
      if (response['success'] == true) {
        setState(() {
          trips = (response['trips'] as List? ?? [])
              .map((e) => Map<String, dynamic>.from(e))
              .toList();
        });
      }
    } catch (e) {
      print('Error searching trips: $e');
      // Show mock data for demo
      setState(() {
        trips = _getMockTrips();
      });
    } finally {
      setState(() => isLoading = false);
    }
  }

  List<Map<String, dynamic>> _getMockTrips() {
    return [
      {
        '_id': '1',
        'routeName': 'Express Route 1',
        'busNumber': 'KL-01-AB-1234',
        'busType': 'AC Sleeper',
        'startTime': '06:00 AM',
        'endTime': '12:00 PM',
        'duration': '6h 0m',
        'availableSeats': 15,
        'totalSeats': 40,
        'fare': 450,
        'rating': 4.5,
        'amenities': ['AC', 'WiFi', 'Charging Point', 'Water Bottle'],
        'operator': 'KSRTC',
      },
      {
        '_id': '2',
        'routeName': 'Super Fast 2',
        'busNumber': 'KL-02-CD-5678',
        'busType': 'Non-AC Seater',
        'startTime': '08:30 AM',
        'endTime': '02:00 PM',
        'duration': '5h 30m',
        'availableSeats': 25,
        'totalSeats': 50,
        'fare': 350,
        'rating': 4.2,
        'amenities': ['Charging Point', 'Water Bottle'],
        'operator': 'Private',
      },
      {
        '_id': '3',
        'routeName': 'Luxury Express',
        'busNumber': 'KL-03-EF-9012',
        'busType': 'AC Seater',
        'startTime': '10:00 AM',
        'endTime': '04:30 PM',
        'duration': '6h 30m',
        'availableSeats': 8,
        'totalSeats': 35,
        'fare': 550,
        'rating': 4.8,
        'amenities': ['AC', 'WiFi', 'Charging Point', 'Water Bottle', 'Snacks'],
        'operator': 'KSRTC',
      },
    ];
  }

  void _sortTrips() {
    setState(() {
      switch (sortBy) {
        case 'price':
          trips.sort((a, b) => (a['fare'] ?? 0).compareTo(b['fare'] ?? 0));
          break;
        case 'departure':
          trips.sort((a, b) => (a['startTime'] ?? '').compareTo(b['startTime'] ?? ''));
          break;
        case 'duration':
          trips.sort((a, b) => (a['duration'] ?? '').compareTo(b['duration'] ?? ''));
          break;
        case 'rating':
          trips.sort((a, b) => (b['rating'] ?? 0).compareTo(a['rating'] ?? 0));
          break;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.text900),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${widget.from} → ${widget.to}',
              style: const TextStyle(
                color: AppColors.text900,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            Text(
              '${widget.date.day}/${widget.date.month}/${widget.date.year} • ${widget.passengers} passenger${widget.passengers > 1 ? 's' : ''}',
              style: const TextStyle(
                color: AppColors.text600,
                fontSize: 12,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list, color: AppColors.text700),
            onPressed: _showSortOptions,
          ),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : trips.isEmpty
              ? _buildEmptyState()
              : Column(
                  children: [
                    _buildResultsHeader(),
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: _searchTrips,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: trips.length,
                          itemBuilder: (context, index) {
                            return _buildTripCard(trips[index]);
                          },
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildResultsHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            '${trips.length} buses found',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.text900,
            ),
          ),
          TextButton.icon(
            onPressed: _showSortOptions,
            icon: const Icon(Icons.sort, size: 18),
            label: Text(
              'Sort: ${sortBy[0].toUpperCase()}${sortBy.substring(1)}',
              style: const TextStyle(fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTripCard(Map<String, dynamic> trip) {
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
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: AppColors.gray200)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        trip['routeName'] ?? 'N/A',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.text900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        trip['busNumber'] ?? 'N/A',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.text600,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.brandPink.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    trip['busType'] ?? 'N/A',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.brandPink,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Time and Duration
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        trip['startTime'] ?? 'N/A',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.text900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.from,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.text600,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    children: [
                      const Icon(Icons.arrow_forward, size: 20, color: AppColors.text400),
                      const SizedBox(height: 4),
                      Text(
                        trip['duration'] ?? 'N/A',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.text500,
                        ),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        trip['endTime'] ?? 'N/A',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.text900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        widget.to,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.text600,
                        ),
                        textAlign: TextAlign.right,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Amenities
          if (trip['amenities'] != null && (trip['amenities'] as List).isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: (trip['amenities'] as List).map((amenity) {
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.gray100,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      amenity.toString(),
                      style: const TextStyle(
                        fontSize: 10,
                        color: AppColors.text700,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),

          // Footer
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: AppColors.gray200)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          '${trip['rating'] ?? 0}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.text900,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Icon(Icons.event_seat, color: AppColors.text500, size: 16),
                        const SizedBox(width: 4),
                        Text(
                          '${trip['availableSeats']} seats',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.text600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Operator: ${trip['operator'] ?? 'N/A'}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.text500,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₹${trip['fare']}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: AppColors.text900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    ElevatedButton(
                      onPressed: () {
                        // Navigate to seat selection
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => BoardingPointScreen(
                              trip: trip,
                              searchData: {
                                'from': widget.from,
                                'to': widget.to,
                                'date': widget.date.toIso8601String().split('T')[0],
                                'passengers': widget.passengers.toString(),
                              },
                            ),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.brandPink,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Select Seats'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 80,
              color: AppColors.text300,
            ),
            const SizedBox(height: 16),
            const Text(
              'No buses found',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.text900,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Try adjusting your search criteria',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.text600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brandPink,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              ),
              child: const Text('Modify Search'),
            ),
          ],
        ),
      ),
    );
  }

  void _showSortOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Sort By',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.text900,
              ),
            ),
            const SizedBox(height: 16),
            _buildSortOption('Departure Time', 'departure'),
            _buildSortOption('Price (Low to High)', 'price'),
            _buildSortOption('Duration', 'duration'),
            _buildSortOption('Rating', 'rating'),
          ],
        ),
      ),
    );
  }

  Widget _buildSortOption(String label, String value) {
    final isSelected = sortBy == value;
    return ListTile(
      title: Text(label),
      trailing: isSelected
          ? const Icon(Icons.check, color: AppColors.brandPink)
          : null,
      selected: isSelected,
      selectedTileColor: AppColors.brandPink.withOpacity(0.1),
      onTap: () {
        setState(() => sortBy = value);
        _sortTrips();
        Navigator.pop(context);
      },
    );
  }
}
