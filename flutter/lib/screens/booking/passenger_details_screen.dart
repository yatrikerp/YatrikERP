import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../utils/colors.dart';
import 'payment_screen.dart';

class PassengerDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> trip;
  final Map<String, dynamic> searchData;
  final List<String> selectedSeats;
  final double seatPrice;

  const PassengerDetailsScreen({
    super.key,
    required this.trip,
    required this.searchData,
    required this.selectedSeats,
    required this.seatPrice,
  });

  @override
  State<PassengerDetailsScreen> createState() => _PassengerDetailsScreenState();
}

class _PassengerDetailsScreenState extends State<PassengerDetailsScreen> {
  final _formKey = GlobalKey<FormState>();
  
  // Contact details
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  String _countryCode = '+91';
  
  // Passenger details
  List<Map<String, TextEditingController>> passengerControllers = [];
  List<String> passengerGenders = [];
  
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializePassengers();
  }

  void _initializePassengers() {
    for (int i = 0; i < widget.selectedSeats.length; i++) {
      passengerControllers.add({
        'name': TextEditingController(),
        'age': TextEditingController(),
      });
      passengerGenders.add('male');
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _emailController.dispose();
    for (var controllers in passengerControllers) {
      controllers['name']?.dispose();
      controllers['age']?.dispose();
    }
    super.dispose();
  }

  double _calculateTotal() {
    return widget.selectedSeats.length * widget.seatPrice;
  }

  Future<void> _handleContinue() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    // Validate all passengers have details
    for (int i = 0; i < passengerControllers.length; i++) {
      if (passengerControllers[i]['name']!.text.isEmpty ||
          passengerControllers[i]['age']!.text.isEmpty) {
        setState(() {
          _error = 'Please fill in all passenger details';
        });
        return;
      }
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Prepare booking data
      final bookingData = {
        'tripId': widget.trip['id'] ?? widget.trip['_id'],
        'routeId': widget.trip['id'] ?? widget.trip['_id'],
        'busId': widget.trip['id'] ?? widget.trip['_id'],
        'depotId': widget.trip['id'] ?? widget.trip['_id'],
        'customer': {
          'name': passengerControllers[0]['name']!.text,
          'email': _emailController.text,
          'phone': _phoneController.text,
          'age': int.parse(passengerControllers[0]['age']!.text),
          'gender': passengerGenders[0],
        },
        'journey': {
          'from': widget.searchData['from'] ?? 'Origin',
          'to': widget.searchData['to'] ?? 'Destination',
          'departureDate': widget.trip['serviceDate'] ?? DateTime.now().toIso8601String(),
          'departureTime': widget.trip['startTime'] ?? '08:00',
          'arrivalDate': widget.trip['serviceDate'] ?? DateTime.now().toIso8601String(),
          'arrivalTime': widget.trip['endTime'] ?? '12:00',
          'duration': 240,
          'boardingPoint': 'Central Bus Stand',
          'droppingPoint': 'Central Bus Stand',
        },
        'seats': List.generate(widget.selectedSeats.length, (i) => {
          'seatNumber': widget.selectedSeats[i],
          'seatType': 'seater',
          'seatPosition': 'window',
          'price': widget.seatPrice,
          'passengerName': passengerControllers[i]['name']!.text,
          'passengerAge': int.parse(passengerControllers[i]['age']!.text),
          'passengerGender': passengerGenders[i],
        }),
        'pricing': {
          'baseFare': widget.seatPrice,
          'seatFare': widget.seatPrice * (widget.selectedSeats.length - 1),
          'taxes': {'gst': 0, 'serviceTax': 0, 'other': 0},
          'discounts': {'earlyBird': 0, 'loyalty': 0, 'promo': 0, 'other': 0},
          'totalAmount': _calculateTotal(),
          'paidAmount': 0,
          'refundAmount': 0,
        },
        'payment': {
          'method': 'upi',
          'paymentStatus': 'pending',
        },
        'status': 'pending',
        'source': 'mobile',
      };

      final response = await ApiService().post('/api/booking', bookingData);

      if (response != null) {
        final bookingId = response['data']?['bookingId'] ?? 
                         response['bookingId'] ?? 
                         response['_id'] ?? 
                         'BK${DateTime.now().millisecondsSinceEpoch}';

        if (!mounted) return;
        
        // Navigate to payment screen
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => PaymentScreen(
              trip: widget.trip,
              searchData: widget.searchData,
              selectedSeats: widget.selectedSeats,
              seatPrice: widget.seatPrice,
              passengers: List.generate(widget.selectedSeats.length, (i) => {
                'name': passengerControllers[i]['name']!.text,
                'age': passengerControllers[i]['age']!.text,
                'gender': passengerGenders[i],
                'seat': widget.selectedSeats[i],
              }),
              contactDetails: {
                'phone': _phoneController.text,
                'email': _emailController.text,
                'countryCode': _countryCode,
              },
              bookingId: bookingId,
            ),
          ),
        );
      } else {
        setState(() {
          _error = 'Failed to create booking. Please try again.';
        });
      }
    } catch (e) {
      setState(() {
        _error = 'An error occurred: $e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
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
        title: const Text(
          'Passenger Details',
          style: TextStyle(color: AppColors.text900, fontWeight: FontWeight.w600),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Contact Details
                    _buildContactDetails(),
                    const SizedBox(height: 16),
                    
                    // Passenger Details
                    _buildPassengerDetails(),
                    const SizedBox(height: 16),
                    
                    // Trip Summary
                    _buildTripSummary(),
                    
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Text(
                          _error!,
                          style: const TextStyle(color: Colors.red),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
          
          // Bottom Bar
          _buildBottomBar(),
        ],
      ),
    );
  }

  Widget _buildContactDetails() {
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
            'Contact Details',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.text900,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'We\'ll use this to send you booking confirmation',
            style: TextStyle(
              fontSize: 13,
              color: AppColors.text500,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              SizedBox(
                width: 100,
                child: DropdownButtonFormField<String>(
                  value: _countryCode,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                  ),
                  items: const [
                    DropdownMenuItem(value: '+91', child: Text('+91')),
                    DropdownMenuItem(value: '+1', child: Text('+1')),
                    DropdownMenuItem(value: '+44', child: Text('+44')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _countryCode = value!;
                    });
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: 'Phone Number',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    prefixIcon: const Icon(Icons.phone),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Required';
                    }
                    return null;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(
              labelText: 'Email',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              prefixIcon: const Icon(Icons.email),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Required';
              }
              if (!value.contains('@')) {
                return 'Invalid email';
              }
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPassengerDetails() {
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
            'Passenger Details',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.text900,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Enter details for all passengers',
            style: TextStyle(
              fontSize: 13,
              color: AppColors.text500,
            ),
          ),
          const SizedBox(height: 16),
          ...List.generate(widget.selectedSeats.length, (index) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _buildPassengerForm(index),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildPassengerForm(int index) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.gray200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Passenger ${index + 1}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text900,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.gray100,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Seat ${widget.selectedSeats[index]}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.text600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: passengerControllers[index]['name'],
            decoration: InputDecoration(
              labelText: 'Full Name',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              prefixIcon: const Icon(Icons.person),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Required';
              }
              return null;
            },
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: passengerControllers[index]['age'],
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Age',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Required';
                    }
                    final age = int.tryParse(value);
                    if (age == null || age < 1 || age > 120) {
                      return 'Invalid';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Gender',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.text600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: RadioListTile<String>(
                            title: const Text('Male', style: TextStyle(fontSize: 13)),
                            value: 'male',
                            groupValue: passengerGenders[index],
                            onChanged: (value) {
                              setState(() {
                                passengerGenders[index] = value!;
                              });
                            },
                            contentPadding: EdgeInsets.zero,
                            dense: true,
                          ),
                        ),
                        Expanded(
                          child: RadioListTile<String>(
                            title: const Text('Female', style: TextStyle(fontSize: 13)),
                            value: 'female',
                            groupValue: passengerGenders[index],
                            onChanged: (value) {
                              setState(() {
                                passengerGenders[index] = value!;
                              });
                            },
                            contentPadding: EdgeInsets.zero,
                            dense: true,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Trip Summary',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.text900,
            ),
          ),
          const SizedBox(height: 12),
          _buildSummaryRow('Route', '${widget.searchData['from']} → ${widget.searchData['to']}'),
          _buildSummaryRow('Date', widget.trip['serviceDate'] ?? 'N/A'),
          _buildSummaryRow('Time', '${widget.trip['startTime']} - ${widget.trip['endTime']}'),
          _buildSummaryRow('Seats', widget.selectedSeats.join(', ')),
          const Divider(height: 24),
          _buildSummaryRow('Base Fare', '₹${widget.seatPrice.toStringAsFixed(0)} × ${widget.selectedSeats.length}'),
          _buildSummaryRow('Total', '₹${_calculateTotal().toStringAsFixed(0)}', isBold: true),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.text600,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.text900,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
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
                  const Text(
                    'Total Amount',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppColors.text600,
                    ),
                  ),
                  Text(
                    '₹${_calculateTotal().toStringAsFixed(0)}',
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
              onPressed: _loading ? null : _handleContinue,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brandPink,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                disabledBackgroundColor: AppColors.gray300,
              ),
              child: _loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text(
                      'Continue to Payment',
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
