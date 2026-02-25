import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/booking_provider.dart';

class BookingConfirmationScreen extends StatefulWidget {
  final String bookingId;
  final double fare;

  const BookingConfirmationScreen({
    super.key,
    required this.bookingId,
    required this.fare,
  });

  @override
  State<BookingConfirmationScreen> createState() => _BookingConfirmationScreenState();
}

class _BookingConfirmationScreenState extends State<BookingConfirmationScreen> {
  bool _isProcessing = false;

  Future<void> _confirmPayment() async {
    setState(() {
      _isProcessing = true;
    });

    final bookingProvider = Provider.of<BookingProvider>(context, listen: false);
    
    // Simulate payment processing
    await Future.delayed(const Duration(seconds: 2));
    
    final success = await bookingProvider.confirmBooking(
      widget.bookingId,
      paymentId: 'PAY${DateTime.now().millisecondsSinceEpoch}',
    );

    if (mounted) {
      setState(() {
        _isProcessing = false;
      });

      if (success) {
        _showSuccessDialog();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(bookingProvider.error ?? 'Payment failed'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green, size: 32),
            SizedBox(width: 12),
            Text('Booking Confirmed!'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Your ticket has been booked successfully.'),
            const SizedBox(height: 16),
            Text(
              'Booking ID: ${widget.bookingId}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop(); // Close dialog
              Navigator.of(context).pushNamedAndRemoveUntil(
                '/home',
                (route) => false,
              );
            },
            child: const Text('Go to Home'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(
              Icons.payment,
              size: 80,
              color: Colors.blue,
            ),
            const SizedBox(height: 24),
            const Text(
              'Complete Payment',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Booking ID:'),
                        Text(
                          widget.bookingId,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Amount:',
                          style: TextStyle(fontSize: 18),
                        ),
                        Text(
                          '₹${widget.fare.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Payment Methods',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _PaymentMethodTile(
              icon: Icons.account_balance_wallet,
              title: 'UPI',
              subtitle: 'Pay using UPI apps',
              onTap: _confirmPayment,
            ),
            _PaymentMethodTile(
              icon: Icons.credit_card,
              title: 'Card',
              subtitle: 'Credit/Debit card',
              onTap: _confirmPayment,
            ),
            _PaymentMethodTile(
              icon: Icons.account_balance,
              title: 'Net Banking',
              subtitle: 'Pay via net banking',
              onTap: _confirmPayment,
            ),
            const Spacer(),
            if (_isProcessing)
              const Center(
                child: Column(
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Processing payment...'),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _PaymentMethodTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _PaymentMethodTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, color: Colors.blue),
        title: Text(title),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }
}
