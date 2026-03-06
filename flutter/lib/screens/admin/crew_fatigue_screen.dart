import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/ai_scheduling_provider.dart';
import '../../utils/colors.dart';

class CrewFatigueScreen extends StatefulWidget {
  const CrewFatigueScreen({super.key});

  @override
  State<CrewFatigueScreen> createState() => _CrewFatigueScreenState();
}

class _CrewFatigueScreenState extends State<CrewFatigueScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedDepotId;
  DateTime _selectedDate = DateTime.now();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Crew Fatigue Management'),
        backgroundColor: AppColors.brandPink,
      ),
      body: Consumer<AISchedulingProvider>(
        builder: (context, provider, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildFatigueForm(provider),
                const SizedBox(height: 24),
                if (provider.fatigueReport != null)
                  _buildFatigueReport(provider.fatigueReport!),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildFatigueForm(AISchedulingProvider provider) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Generate Fatigue Report',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              TextFormField(
                decoration: const InputDecoration(
                  labelText: 'Depot ID',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.business),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter depot ID';
                  }
                  return null;
                },
                onSaved: (value) => _selectedDepotId = value,
              ),
              const SizedBox(height: 16),
              ListTile(
                title: const Text('Report Date'),
                subtitle: Text(_selectedDate.toString().split(' ')[0]),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime.now().subtract(const Duration(days: 365)),
                    lastDate: DateTime.now(),
                  );
                  if (date != null) {
                    setState(() => _selectedDate = date);
                  }
                },
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: provider.isLoading ? null : _generateReport,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brandPink,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: provider.isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Generate Report'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFatigueReport(Map<String, dynamic> report) {
    final stats = report['stats'] ?? {};
    final data = report['data'] as List? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Fatigue Statistics',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Total Records',
                stats['totalRecords']?.toString() ?? '0',
                Icons.people,
                Colors.blue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Avg Score',
                stats['avgFatigueScore']?.toString() ?? '0',
                Icons.analytics,
                Colors.orange,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'High Fatigue',
                stats['highFatigueCount']?.toString() ?? '0',
                Icons.warning,
                Colors.red,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Ineligible',
                stats['ineligibleCount']?.toString() ?? '0',
                Icons.block,
                Colors.grey,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        const Text(
          'Crew Details',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        ...data.take(10).map((crew) => _buildCrewCard(crew)).toList(),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCrewCard(Map<String, dynamic> crew) {
    final fatigueScore = crew['fatigueScore'] ?? 0;
    final crewInfo = crew['crewId'] ?? {};
    final name = crewInfo['name'] ?? 'Unknown';
    
    Color scoreColor = Colors.green;
    if (fatigueScore >= 70) scoreColor = Colors.red;
    else if (fatigueScore >= 50) scoreColor = Colors.orange;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: scoreColor.withOpacity(0.2),
          child: Text(
            fatigueScore.toString(),
            style: TextStyle(
              color: scoreColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(name),
        subtitle: Text('Employee: ${crewInfo['employeeCode'] ?? 'N/A'}'),
        trailing: Icon(
          fatigueScore >= 50 ? Icons.warning : Icons.check_circle,
          color: scoreColor,
        ),
      ),
    );
  }

  Future<void> _generateReport() async {
    if (_formKey.currentState!.validate()) {
      _formKey.currentState!.save();
      
      final provider = context.read<AISchedulingProvider>();
      await provider.getFatigueReport(
        depotId: _selectedDepotId!,
        startDate: _selectedDate.subtract(const Duration(days: 7)),
        endDate: _selectedDate,
      );
      
      if (provider.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.error!)),
        );
      }
    }
  }
}
