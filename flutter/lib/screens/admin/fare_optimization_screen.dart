import 'package:flutter/material.dart';
import '../../utils/colors.dart';

class FareOptimizationScreen extends StatelessWidget {
  const FareOptimizationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dynamic Fare Optimization'),
        backgroundColor: AppColors.brandPink,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.attach_money, size: 80, color: Colors.green.shade400),
              const SizedBox(height: 24),
              const Text(
                'Dynamic Fare Optimization',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              const Text(
                'AI-powered fare adjustments based on demand, time, and route popularity.',
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
