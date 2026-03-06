import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../utils/colors.dart';
import 'passenger_details_screen.dart';

class SeatSelectionScreen extends StatefulWidget {
  final Map<String, dynamic> trip;
  final Map<String, dynamic> searchData;

  const SeatSelectionScreen({
    super.key,
    required this.trip,
    required this.searchData,
  });

  @override
  State<SeatSelectionScreen> createState() => _SeatSelectionScreenState();
}

class _SeatSelectionScreenState extends State<SeatSelectionScreen> {
  List<Map<String, dynamic>> seats = [];
  List<String> selectedSeats = [];
  bool loading = true;
  String? error;
  double seatPrice = 499;

  @override
  void initState() {
    super.initState();
    fetchSeats();
  }

  Future<void> fetchSeats() async {
    try {
      setState(() {
        loading = true;
        error = null;
      });

      final tripDate = widget.trip['serviceDate'] ?? 
                      widget.trip['date'] ?? 
                      DateTime.now().toIso8601String().split('T')[0];
      final tripId = widget.trip['id'] ?? widget.trip['_id'];

      final apiService = ApiService();
      final response = await apiService.get(
        '/api/seats/trip/$tripId?date=$tripDate',
      );

      if (response['seats'] != null) {
        setState(() {
          seats = List<Map<String, dynamic>>.from(response['seats']);
          seatPrice = (response['seatPrice'] ?? widget.trip['fare'] ?? 499).toDouble();
          loading = false;
        });
      } else {
        setState(() {
          error = 'Failed to load seats';
          loading = false;
        });
      }
    } catch (e) {
      setState(() {
        error = 'Error loading seats: $e';
        loading = false;
      });
    }
  }

  void toggleSeat(Map<String, dynamic> seat) {
    final seatNumber = seat['seatNumber'].toString();
    final status = seat['status'];

    if (status == 'available' || 
        status == 'available_male' || 
        status == 'available_female') {
      setState(() {
        if (selectedSeats.contains(seatNumber)) {
          selectedSeats.remove(seatNumber);
        } else {
          selectedSeats.add(seatNumber);
        }
      });
    }
  }

  Color getSeatColor(Map<String, dynamic> seat) {
    final seatNumber = seat['seatNumber'].toString();
    final status = seat['status'];

    if (selectedSeats.contains(seatNumber)) {
      return AppColors.brandPink;
    }

    switch (status) {
      case 'available':
        return AppColors.success;
      case 'available_male':
        return Colors.blue;
      case 'available_female':
        return Colors.pink.shade300;
      case 'booked':
      case 'booked_male':
      case 'booked_female':
        return AppColors.gray300;
      default:
        return AppColors.gray200;
    }
  }

  bool isSeatBooked(Map<String, dynamic> seat) {
    final status = seat['status'];
    return status == 'booked' || 
           status == 'booked_male' || 
           status == 'booked_female';
  }

  void handleContinue() {
    if (selectedSeats.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one seat')),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PassengerDetailsScreen(
          trip: widget.trip,
          searchData: widget.searchData,
          selectedSeats: selectedSeats,
          seatPrice: seatPrice,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Select Seats'),
          backgroundColor: Colors.white,
        ),
        body: const Center(
          child: CircularProgressIndicator(
            color: AppColors.brandPink,
          ),
        ),
      );
    }

    if (error != null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Select Seats'),
          backgroundColor: Colors.white,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(error!, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: fetchSeats,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    final seatsPerRow = seats.length <= 35 ? 5 : 4;
    final rows = <List<Map<String, dynamic>>>[];
    for (int i = 0; i < seats.length; i += seatsPerRow) {
      rows.add(seats.sublist(i, (i + seatsPerRow).clamp(0, seats.length)));
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.text900),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Select Seats',
          style: TextStyle(color: AppColors.text900, fontWeight: FontWeight.w600),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Trip Summary
                  _buildTripSummary(),
                  const SizedBox(height: 16),
                  
                  // Seat Legend
                  _buildSeatLegend(),
                  const SizedBox(height: 16),
                  
                  // Bus Layout
                  _buildBusLayout(rows, seatsPerRow),
                ],
              ),
            ),
          ),
          
          // Bottom Bar
          _buildBottomBar(),
        ],
      ),
    );
  }

  Widget _buildTripSummary() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${widget.searchData['from']} → ${widget.searchData['to']}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${widget.trip['startTime']} - ${widget.trip['endTime']}',
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.text600,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '₹${seatPrice.toStringAsFixed(0)}',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.text900,
                ),
              ),
              const Text(
                'per seat',
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.text500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSeatLegend() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
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
          const Text(
            'Seat Types',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.text900,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 16,
            runSpacing: 12,
            children: [
              _buildLegendItem(AppColors.success, 'Available'),
              _buildLegendItem(Colors.blue, 'Male'),
              _buildLegendItem(Colors.pink.shade300, 'Female'),
              _buildLegendItem(AppColors.gray300, 'Booked'),
              _buildLegendItem(AppColors.brandPink, 'Selected'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: color.withOpacity(0.5), width: 2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            color: AppColors.text700,
          ),
        ),
      ],
    );
  }

  Widget _buildBusLayout(List<List<Map<String, dynamic>>> rows, int seatsPerRow) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Driver area
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.drive_eta, color: AppColors.text400, size: 24),
              const SizedBox(width: 8),
              const Text(
                'Front of Bus',
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.text500,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Seats
          ...rows.map((rowSeats) => _buildSeatRow(rowSeats, seatsPerRow)),
        ],
      ),
    );
  }

  Widget _buildSeatRow(List<Map<String, dynamic>> rowSeats, int seatsPerRow) {
    final leftSeats = seatsPerRow == 5 ? rowSeats.sublist(0, 3.clamp(0, rowSeats.length)) : rowSeats.sublist(0, 2.clamp(0, rowSeats.length));
    final rightSeats = seatsPerRow == 5 
        ? (rowSeats.length > 3 ? rowSeats.sublist(3) : <Map<String, dynamic>>[])
        : (rowSeats.length > 2 ? rowSeats.sublist(2) : <Map<String, dynamic>>[]);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Left seats
          ...leftSeats.map((seat) => _buildSeat(seat)),
          
          // Aisle
          const SizedBox(width: 32),
          
          // Right seats
          ...rightSeats.map((seat) => _buildSeat(seat)),
        ],
      ),
    );
  }

  Widget _buildSeat(Map<String, dynamic> seat) {
    final seatNumber = seat['seatNumber'].toString();
    final isBooked = isSeatBooked(seat);
    final color = getSeatColor(seat);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: GestureDetector(
        onTap: isBooked ? null : () => toggleSeat(seat),
        child: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: color.withOpacity(0.5),
              width: 2,
            ),
          ),
          child: Center(
            child: Text(
              seatNumber,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: isBooked ? AppColors.text500 : Colors.white,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomBar() {
    final totalAmount = selectedSeats.length * seatPrice;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    selectedSeats.isEmpty 
                        ? 'No seats selected' 
                        : 'Seats: ${selectedSeats.join(', ')}',
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.text600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₹${totalAmount.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppColors.text900,
                    ),
                  ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: selectedSeats.isEmpty ? null : handleContinue,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brandPink,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                disabledBackgroundColor: AppColors.gray300,
              ),
              child: const Text(
                'Continue',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
