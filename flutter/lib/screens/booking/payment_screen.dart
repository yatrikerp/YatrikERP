import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../utils/colors.dart';

class PaymentScreen extends StatefulWidget {
  final Map<String, dynamic> trip;
  final Map<String, dynamic> searchData;
  final List<String> selectedSeats;
  final double seatPrice;
  final List<Map<String, dynamic>> passengers;
  final Map<String, dynamic> contactDetails;
  final String bookingId;

  const PaymentScreen({
    super.key,
    required this.trip,
    required this.searchData,
    required this.selectedSeats,
    required this.seatPrice,
    required this.passengers,
    required this.contactDetails,
    required this.bookingId,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  String _selectedPaymentMethod = 'upi';
  bool _loading = false;
  String? _error;
  bool _paymentSuccess = false;

  double get totalAmount => widget.selectedSeats.length * widget.seatPrice;

  Future<void> _handlePayment() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // For now, we'll simulate payment success
      // In production, integrate with Razorpay or other payment gateway
      await Future.delayed(const Duration(seconds: 2));

      // Confirm booking
      final apiService = ApiService();
      final response = await apiService.post('/api/booking/confirm', {
        'bookingId': widget.bookingId,
        'paymentId': 'flutter_pay_${DateTime.now().millisecondsSinceEpoch}',
        'orderId': 'flutter_order_${DateTime.now().millisecondsSinceEpoch}',
        'paymentStatus': 'completed',
        'paymentMethod': _selectedPaymentMethod,
      });

      if (response != null) {
        setState(() => _paymentSuccess = true);
        
        // Show success message
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Payment successful! Booking confirmed.'),
              backgroundColor: AppColors.success,
            ),
          );
        }

        // Navigate back to dashboard after delay
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      } else {
        setState(() => _error = 'Payment verification failed. Please contact support.');
      }
    } catch (e) {
      setState(() => _error = 'Payment failed: $e');
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _handleTestMode() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Test mode - skip payment
      final apiService = ApiService();
      final response = await apiService.post('/api/booking/confirm', {
        'bookingId': widget.bookingId,
        'paymentId': 'test_pay_${DateTime.now().millisecondsSinceEpoch}',
        'orderId': 'test_order_${DateTime.now().millisecondsSinceEpoch}',
        'paymentStatus': 'completed',
        'paymentMethod': 'test',
      });

      if (response != null) {
        setState(() => _paymentSuccess = true);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🚀 Test Mode: Booking confirmed successfully!'),
              backgroundColor: AppColors.success,
            ),
          );
        }

        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      } else {
        setState(() => _error = 'Test mode failed. Please try again.');
      }
    } catch (e) {
      setState(() => _error = 'Test mode failed: $e');
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_paymentSuccess) {
      return Scaffold(
        backgroundColor: const Color(0xFFF9FAFB),
        body: Center(
          child: Container(
            margin: const EdgeInsets.all(24),
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 20,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppColors.success.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_circle,
                    size: 50,
                    color: AppColors.success,
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Payment Successful!',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text900,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Your booking has been confirmed.',
                  style: TextStyle(
                    fontSize: 16,
                    color: AppColors.text600,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Redirecting to dashboard...',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppColors.text500,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
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
          'Payment',
          style: TextStyle(color: AppColors.text900, fontWeight: FontWeight.w600),
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'Step 4 of 4',
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
                  // Payment Methods
                  _buildPaymentMethods(),
                  const SizedBox(height: 16),
                  
                  // Security Notice
                  _buildSecurityNotice(),
                  const SizedBox(height: 16),
                  
                  // Booking Summary
                  _buildBookingSummary(),
                  
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
          
          // Bottom Payment Bar
          _buildPaymentBar(),
        ],
      ),
    );
  }

  Widget _buildPaymentMethods() {
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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Choose Payment Method',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text900,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Select your preferred payment option',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.text500,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildPaymentOption(
                  value: 'upi',
                  title: 'UPI',
                  subtitle: 'Pay using UPI apps',
                  icon: Icons.account_balance_wallet,
                  color: Colors.blue,
                ),
                const SizedBox(height: 12),
                _buildPaymentOption(
                  value: 'card',
                  title: 'Credit/Debit Card',
                  subtitle: 'Visa, Mastercard, RuPay',
                  icon: Icons.credit_card,
                  color: Colors.purple,
                ),
                const SizedBox(height: 12),
                _buildPaymentOption(
                  value: 'netbanking',
                  title: 'Net Banking',
                  subtitle: 'All major banks',
                  icon: Icons.account_balance,
                  color: Colors.green,
                ),
                const SizedBox(height: 12),
                _buildPaymentOption(
                  value: 'wallet',
                  title: 'Digital Wallet',
                  subtitle: 'Paytm, PhonePe, Google Pay',
                  icon: Icons.wallet,
                  color: Colors.orange,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentOption({
    required String value,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    final isSelected = _selectedPaymentMethod == value;
    
    return GestureDetector(
      onTap: () => setState(() => _selectedPaymentMethod = value),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? AppColors.brandPink : AppColors.gray200,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(8),
          color: isSelected ? AppColors.brandPink.withOpacity(0.05) : Colors.white,
        ),
        child: Row(
          children: [
            Radio<String>(
              value: value,
              groupValue: _selectedPaymentMethod,
              onChanged: (val) => setState(() => _selectedPaymentMethod = val!),
              activeColor: AppColors.brandPink,
            ),
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppColors.text900,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 13,
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

  Widget _buildSecurityNotice() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.security, color: Colors.blue.shade600, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Secure Payment',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.blue.shade900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Your payment is secured with 256-bit SSL encryption. We never store your payment details.',
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.blue.shade700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookingSummary() {
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
            child: Text(
              'Booking Summary',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.text900,
              ),
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildSummaryRow('Route', '${widget.searchData['from']} → ${widget.searchData['to']}'),
                _buildSummaryRow('Date', widget.trip['serviceDate'] ?? 'N/A'),
                _buildSummaryRow('Time', '${widget.trip['startTime']} - ${widget.trip['endTime']}'),
                _buildSummaryRow('Seats', widget.selectedSeats.join(', ')),
                _buildSummaryRow('Passengers', '${widget.passengers.length}'),
                const Divider(height: 24),
                _buildSummaryRow('Base Fare', '₹${widget.seatPrice.toStringAsFixed(0)} × ${widget.selectedSeats.length}'),
                _buildSummaryRow('Taxes & Fees', '₹0'),
                const Divider(height: 24),
                _buildSummaryRow('Total Amount', '₹${totalAmount.toStringAsFixed(0)}', isBold: true, isTotal: true),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isBold = false, bool isTotal = false}) {
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
              fontSize: isTotal ? 18 : 14,
              color: isTotal ? AppColors.brandPink : AppColors.text900,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentBar() {
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _handlePayment,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brandPink,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  disabledBackgroundColor: AppColors.gray300,
                ),
                child: _loading
                    ? const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          ),
                          SizedBox(width: 12),
                          Text(
                            'Processing...',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Pay ₹${totalAmount.toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(Icons.arrow_forward, size: 16),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _handleTestMode,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.success,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  disabledBackgroundColor: AppColors.gray300,
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('🚀'),
                    SizedBox(width: 8),
                    Text(
                      'Test Mode: Skip Payment',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}