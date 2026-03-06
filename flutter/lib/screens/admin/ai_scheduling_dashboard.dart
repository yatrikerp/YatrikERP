import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/ai_scheduling_provider.dart';
import '../../utils/colors.dart';

class AISchedulingDashboard extends StatefulWidget {
  const AISchedulingDashboard({super.key});

  @override
  State<AISchedulingDashboard> createState() => _AISchedulingDashboardState();
}

class _AISchedulingDashboardState extends State<AISchedulingDashboard> {
  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    final provider = context.read<AISchedulingProvider>();
    await provider.getAnalytics(
      startDate: DateTime.now().subtract(const Duration(days: 30)),
      endDate: DateTime.now(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Scheduling Dashboard'),
        backgroundColor: AppColors.brandPink,
      ),
      body: Consumer<AISchedulingProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(provider.error!),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadAnalytics,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _loadAnalytics,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildAnalyticsOverview(provider),
                  const SizedBox(height: 24),
                  _buildFeatureCards(context),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildAnalyticsOverview(AISchedulingProvider provider) {
    final analytics = provider.analytics;
    
    if (analytics == null) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Text('No analytics data available'),
        ),
      );
    }

    final demand = analytics['demand'] ?? {};
    final fatigue = analytics['fatigue'] ?? {};

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'AI Analytics Overview',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Demand Predictions',
                demand['totalPredictions']?.toString() ?? '0',
                Icons.trending_up,
                Colors.blue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'Avg Confidence',
                '${(demand['avgConfidence'] ?? 0).toStringAsFixed(1)}%',
                Icons.verified,
                Colors.green,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                'Fatigue Records',
                fatigue['totalRecords']?.toString() ?? '0',
                Icons.people,
                Colors.orange,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildStatCard(
                'High Fatigue',
                fatigue['highFatigueCount']?.toString() ?? '0',
                Icons.warning,
                Colors.red,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
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
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureCards(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'AI Features',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        _buildFeatureCard(
          context,
          'Predictive Demand Model',
          'Forecast passenger demand using AI',
          Icons.analytics,
          Colors.blue,
          () => Navigator.pushNamed(context, '/admin/demand-prediction'),
        ),
        const SizedBox(height: 12),
        _buildFeatureCard(
          context,
          'AI Scheduling Engine',
          'Optimize schedules with genetic algorithms',
          Icons.schedule,
          Colors.purple,
          () => Navigator.pushNamed(context, '/admin/genetic-scheduling'),
        ),
        const SizedBox(height: 12),
        _buildFeatureCard(
          context,
          'Crew Fatigue Management',
          'Monitor and manage crew fatigue levels',
          Icons.people_alt,
          Colors.orange,
          () => Navigator.pushNamed(context, '/admin/crew-fatigue'),
        ),
        const SizedBox(height: 12),
        _buildFeatureCard(
          context,
          'Dynamic Fare Optimization',
          'AI-powered fare adjustments',
          Icons.attach_money,
          Colors.green,
          () => Navigator.pushNamed(context, '/admin/fare-optimization'),
        ),
        const SizedBox(height: 12),
        _buildFeatureCard(
          context,
          'Smart Concession Verification',
          'Automated concession validation',
          Icons.verified_user,
          Colors.teal,
          () => Navigator.pushNamed(context, '/admin/concession-verification'),
        ),
      ],
    );
  }

  Widget _buildFeatureCard(
    BuildContext context,
    String title,
    String description,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 32, color: color),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}
