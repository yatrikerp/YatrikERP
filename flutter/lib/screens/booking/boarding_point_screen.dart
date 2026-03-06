import 'package:flutter/material.dart';
import '../../utils/colors.dart';
import 'seat_selection_screen.dart';

class BoardingPointScreen extends StatefulWidget {
  final Map<String, dynamic> trip;
  final Map<String, dynamic> searchData;

  const BoardingPointScreen({
    super.key,
    required this.trip,
    required this.searchData,
  });

  @override
  State<BoardingPointScreen> createState() => _BoardingPointScreenState();
}

class _BoardingPointScreenState extends State<BoardingPointScreen> {
  Map<String, dynamic>? selectedBoardingPoint;
  Map<String, dynamic>? selectedDroppingPoint;

  // Sample boarding and dropping points
  final List<Map<String, dynamic>> boardingPoints = [
    {
      'id': 'bp1',
      'title': 'Central Bus Stand',
      'address': 'Main Road, City Center',
      'time': '06:00 AM',
      'landmark': 'Near Railway Station',
    },
    {
      'id': 'bp2',
      'title': 'Airport Junction',
      'address': 'Airport Road, Terminal 1',
      'time': '06:15 AM',
      'landmark': 'Opposite Airport Gate',
    },
    {
      'id': 'bp3',
      'title': 'Mall Road',
      'address': 'Shopping Complex Area',
      'time': '06:30 AM',
      'landmark': 'Near Big Mall',
    },
    {
      'id': 'bp4',
      'title': 'IT Park',
      'address': 'Tech City, Phase 1',
      'time': '06:45 AM',
      'landmark': 'Main Gate',
    },
  ];

  final List<Map<String, dynamic>> droppingPoints = [
    {
      'id': 'dp1',
      'title': 'Main Bus Terminal',
      'address': 'Central Terminal, Platform 5',
      'time': '10:00 AM',
      'landmark': 'Near Ticket Counter',
    },
    {
      'id': 'dp2',
      'title': 'City Center',
      'address': 'Downtown Area',
      'time': '10:15 AM',
      'landmark': 'Near Metro Station',
    },
    {
      'id': 'dp3',
      'title': 'University Gate',
      'address': 'Education District',
      'time': '10:30 AM',
      'landmark': 'Main University Entrance',
    },
    {
      'id': 'dp4',
      'title': 'Hospital Junction',
      'address': 'Medical College Road',
      'time': '10:45 AM',
      'landmark': 'Government Hospital',
    },
  ];

  void _handleContinue() {
    if (selectedBoardingPoint == null || selectedDroppingPoint == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select both boarding and dropping points'),
        ),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SeatSelectionScreen(
          trip: widget.trip,
          searchData: widget.searchData,
        ),
      ),
    );
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
          'Boarding & Dropping Points',
          style: TextStyle(color: AppColors.text900, fontWeight: FontWeight.w600),
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Step 2 of 4',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.text600,
              ),
            ),
          ),
        ],
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
                  
                  // Boarding Points
                  _buildBoardingPoints(),
                  const SizedBox(height: 16),
                  
                  // Dropping Points
                  _buildDroppingPoints(),
                ],
              ),
            ),
          ),
          
          // Continue Button
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
                '₹${widget.trip['fare'] ?? 499}',
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

  Widget _buildBoardingPoints() {
    return Container(
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
          const Padding(
            padding: EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(Icons.location_on, color: AppColors.success, size: 20),
                SizedBox(width: 8),
                Text(
                  'Select Boarding Point',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text900,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          ...boardingPoints.map((point) => _buildPointTile(
            point: point,
            isSelected: selectedBoardingPoint?['id'] == point['id'],
            onTap: () => setState(() => selectedBoardingPoint = point),
            type: 'boarding',
          )),
        ],
      ),
    );
  }

  Widget _buildDroppingPoints() {
    return Container(
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
          const Padding(
            padding: EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(Icons.location_off, color: AppColors.error, size: 20),
                SizedBox(width: 8),
                Text(
                  'Select Dropping Point',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text900,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          ...droppingPoints.map((point) => _buildPointTile(
            point: point,
            isSelected: selectedDroppingPoint?['id'] == point['id'],
            onTap: () => setState(() => selectedDroppingPoint = point),
            type: 'dropping',
          )),
        ],
      ),
    );
  }

  Widget _buildPointTile({
    required Map<String, dynamic> point,
    required bool isSelected,
    required VoidCallback onTap,
    required String type,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.brandPink.withOpacity(0.05) : Colors.white,
          border: Border(
            bottom: BorderSide(color: AppColors.gray200.withOpacity(0.5)),
          ),
        ),
        child: Row(
          children: [
            Radio<bool>(
              value: true,
              groupValue: isSelected,
              onChanged: (_) => onTap(),
              activeColor: AppColors.brandPink,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          point['title'],
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppColors.text900,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: type == 'boarding' 
                              ? AppColors.success.withOpacity(0.1)
                              : AppColors.error.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          point['time'],
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: type == 'boarding' ? AppColors.success : AppColors.error,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    point['address'],
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.text600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    point['landmark'],
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.text500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
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
                  Text(
                    selectedBoardingPoint != null && selectedDroppingPoint != null
                        ? 'Points Selected'
                        : 'Select boarding & dropping points',
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.text600,
                    ),
                  ),
                  if (selectedBoardingPoint != null && selectedDroppingPoint != null)
                    Text(
                      '${selectedBoardingPoint!['title']} → ${selectedDroppingPoint!['title']}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.text900,
                      ),
                    ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: (selectedBoardingPoint != null && selectedDroppingPoint != null) 
                  ? _handleContinue 
                  : null,
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
                'Continue to Seat Selection',
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