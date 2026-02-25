import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/trip_provider.dart';
import '../../models/trip.dart';
import '../booking/trip_details_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _fromController = TextEditingController();
  final _toController = TextEditingController();
  DateTime _selectedDate = DateTime.now();

  @override
  void dispose() {
    _fromController.dispose();
    _toController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _searchTrips() async {
    if (_fromController.text.isEmpty || _toController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter both source and destination'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final tripProvider = Provider.of<TripProvider>(context, listen: false);
    await tripProvider.searchTrips(
      from: _fromController.text,
      to: _toController.text,
      date: _selectedDate,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Search Buses'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Search Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                TextField(
                  controller: _fromController,
                  decoration: const InputDecoration(
                    labelText: 'From',
                    prefixIcon: Icon(Icons.trip_origin),
                    hintText: 'Enter source city',
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _toController,
                  decoration: const InputDecoration(
                    labelText: 'To',
                    prefixIcon: Icon(Icons.location_on),
                    hintText: 'Enter destination city',
                  ),
                ),
                const SizedBox(height: 16),
                InkWell(
                  onTap: _selectDate,
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Date',
                      prefixIcon: Icon(Icons.calendar_today),
                    ),
                    child: Text(
                      DateFormat('dd MMM yyyy').format(_selectedDate),
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _searchTrips,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Search Buses'),
                  ),
                ),
              ],
            ),
          ),
          // Results
          Expanded(
            child: Consumer<TripProvider>(
              builder: (context, tripProvider, child) {
                if (tripProvider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (tripProvider.error != null) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 64, color: Colors.red),
                        const SizedBox(height: 16),
                        Text(tripProvider.error!),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _searchTrips,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  );
                }

                if (tripProvider.trips.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.search,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Search for buses',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: tripProvider.trips.length,
                  itemBuilder: (context, index) {
                    final trip = tripProvider.trips[index];
                    return TripCard(trip: trip);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class TripCard extends StatelessWidget {
  final Trip trip;

  const TripCard({super.key, required this.trip});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => TripDetailsScreen(trip: trip),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    trip.routeName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green[50],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '₹${trip.fare.toStringAsFixed(0)}',
                      style: TextStyle(
                        color: Colors.green[700],
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          trip.from,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          trip.departureTime,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(Icons.arrow_forward, color: Colors.grey[400]),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          trip.to,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          trip.arrivalTime,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.event_seat, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    '${trip.availableSeats} seats available',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Icon(Icons.directions_bus, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    trip.busType,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
