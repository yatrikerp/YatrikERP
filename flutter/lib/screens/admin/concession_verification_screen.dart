import 'package:flutter/material.dart';
import '../../utils/colors.dart';

class ConcessionVerificationScreen extends StatelessWidget {
  const ConcessionVerificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Smart Concession Verification'),
        backgroundColor: AppColors.brandPink,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.verified_user, size: 80, color: Colors.teal.shade400),
              const SizedBox(height: 24),
              const Text(
                'Smart Concession Verification',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              const Text(
                'Automated validation of student, senior citizen, and other concession passes using AI.',
                style: TextStyle(fontSize: 16, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              const Text(
                'This feature is working perfectly in the web admin dashboard.',
                style: TextStyle(fontSize: 14, fontStyle: FontStyle.italic),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
