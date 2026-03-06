import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/navigation_provider.dart';
import '../../utils/colors.dart';
import 'tabs/dashboard_tab.dart';
import 'tabs/my_trips_tab.dart';
import 'tabs/search_tab.dart';
import 'tabs/profile_tab.dart';

class PassengerDashboardTabs extends StatefulWidget {
  const PassengerDashboardTabs({super.key});

  @override
  State<PassengerDashboardTabs> createState() => _PassengerDashboardTabsState();
}

class _PassengerDashboardTabsState extends State<PassengerDashboardTabs> {
  final List<Widget> _tabs = [
    const DashboardTab(),
    const MyTripsTab(),
    const SearchTab(),
    const ProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final navigationProvider = Provider.of<NavigationProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.directions_bus, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 8),
            const Text(
              'YATRIK',
              style: TextStyle(
                color: AppColors.text900,
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
          ],
        ),
        actions: [
          // Notification button
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined, color: AppColors.text700),
                onPressed: () {
                  // TODO: Navigate to notifications
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Notifications coming soon!')),
                  );
                },
              ),
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
          // Profile button
          IconButton(
            icon: const Icon(Icons.person_outline, color: AppColors.text700),
            onPressed: () {
              navigationProvider.navigateToProfile();
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: navigationProvider.currentTabIndex,
        children: _tabs,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: navigationProvider.currentTabIndex,
        onTap: (index) => navigationProvider.setTabIndex(index),
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.brandPink,
        unselectedItemColor: AppColors.text500,
        selectedFontSize: 12,
        unselectedFontSize: 12,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.confirmation_number_outlined),
            activeIcon: Icon(Icons.confirmation_number),
            label: 'My Trips',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.search),
            activeIcon: Icon(Icons.search),
            label: 'Search',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
