import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/ai_scheduling_provider.dart';
import '../../utils/colors.dart';

class DemandPredictionScreen extends StatefulWidget {
  const DemandPredictionScreen({super.key});

  @override
  State<DemandPredictionScreen> createState() => _DemandPredictionScreenState();
}

class _DemandPredictionScreenState extends State<DemandPredictionScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedRouteId;
  DateTime _selectedDate = DateTime.now();
  String _selectedTimeSlot = '09:00';
  
  final List<String> _timeSlots = [
    '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Demand Prediction'),
        backgroundColor: AppColors.brandPink,
      ),
      body: Consumer<AISchedulingProvider>(
        builder: (context, provider, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildPredictionForm(provider),
                const SizedBox(height: 24),
                if (provider.demandPrediction != null)
                  _buildPredictionResult(provider.demandPrediction!),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildPredictionForm(AISchedulingProvider provider) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Predict Passenger Demand',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Route ID',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.route),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter route ID';
                  }
                  return null;
                },
                onSaved: (value) => _selectedRouteId = value,
              ),
              const SizedBox(height: 16),
              ListTile(
                title: const Text('Prediction Date'),
                subtitle: Text(_selectedDate.toString().split(' ')[0]),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (date != null) {
                    setState(() => _selectedDate = date);
                  }
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedTimeSlot,
                decoration: const InputDecoration(
                  labelText: 'Time Slot',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.access_time),
                ),
                items: _timeSlots.map((slot) {
                  return DropdownMenuItem(value: slot, child: Text(slot));
                }).toList(),
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _selectedTimeSlot = value);
                  }
                },
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: provider.isLoading ? null : _predictDemand,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brandPink,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: provider.isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Predict Demand'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPredictionResult(Map<String, dynamic> prediction) {
    final predictedPassengers = prediction['predictedPassengers'] ?? 0;
    final confidenceScore = prediction['confidenceScore'] ?? 0;
    final demandLevel = prediction['demandLevel'] ?? 'unknown';
    
    Color demandColor = Colors.grey;
    if (demandLevel == 'very_high') demandColor = Colors.red;
    else if (demandLevel == 'high') demandColor = Colors.orange;
    else if (demandLevel == 'medium') demandColor = Colors.blue;
    else if (demandLevel == 'low') demandColor = Colors.green;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Prediction Result',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildResultCard(
                  'Predicted Passengers',
                  predictedPassengers.toString(),
                  Icons.people,
                  Colors.blue,
                ),
                _buildResultCard(
                  'Confidence',
                  '${confidenceScore.toStringAsFixed(1)}%',
                  Icons.verified,
                  Colors.green,
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: demandColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: demandColor),
              ),
              child: Row(
                children: [
                  Icon(Icons.trending_up, color: demandColor),
                  const SizedBox(width: 8),
                  Text(
                    'Demand Level: ${demandLevel.toUpperCase()}',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: demandColor,
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

  Widget _buildResultCard(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, size: 40, color: color),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Colors.grey),
        ),
      ],
    );
  }

  Future<void> _predictDemand() async {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      
      final provider = context.read<AISchedulingProvider>();
      await provider.predictDemand(
        routeId: _selectedRouteId!,
        predictionDate: _selectedDate,
        timeSlot: _selectedTimeSlot,
      );
      
      if (provider.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.error!)),
        );
      }
    }
  }
}
