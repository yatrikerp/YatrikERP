import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final user = authProvider.user;

          return SingleChildScrollView(
            child: Column(
              children: [
                const SizedBox(height: 24),
                // Profile Avatar
                CircleAvatar(
                  radius: 50,
                  backgroundColor: Theme.of(context).primaryColor,
                  child: Text(
                    user?['name']?.substring(0, 1).toUpperCase() ?? 'U',
                    style: const TextStyle(
                      fontSize: 36,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  user?['name'] ?? 'User',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  user?['email'] ?? '',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 32),
                // Profile Options
                _ProfileOption(
                  icon: Icons.person,
                  title: 'Edit Profile',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Edit profile coming soon')),
                    );
                  },
                ),
                _ProfileOption(
                  icon: Icons.history,
                  title: 'Booking History',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('View booking history')),
                    );
                  },
                ),
                _ProfileOption(
                  icon: Icons.notifications,
                  title: 'Notifications',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Notifications coming soon')),
                    );
                  },
                ),
                _ProfileOption(
                  icon: Icons.help,
                  title: 'Help & Support',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Help & support coming soon')),
                    );
                  },
                ),
                _ProfileOption(
                  icon: Icons.info,
                  title: 'About',
                  onTap: () {
                    showAboutDialog(
                      context: context,
                      applicationName: 'YATRIK',
                      applicationVersion: '1.0.0',
                      applicationIcon: const Icon(Icons.directions_bus, size: 48),
                      children: [
                        const Text('Bus booking made easy'),
                      ],
                    );
                  },
                ),
                const Divider(height: 32),
                _ProfileOption(
                  icon: Icons.logout,
                  title: 'Logout',
                  textColor: Colors.red,
                  onTap: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Logout'),
                        content: const Text('Are you sure you want to logout?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: const Text('Cancel'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(context, true),
                            child: const Text('Logout'),
                          ),
                        ],
                      ),
                    );

                    if (confirm == true && context.mounted) {
                      await authProvider.logout();
                      if (context.mounted) {
                        Navigator.pushReplacementNamed(context, '/login');
                      }
                    }
                  },
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _ProfileOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Color? textColor;

  const _ProfileOption({
    required this.icon,
    required this.title,
    required this.onTap,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: textColor),
      title: Text(
        title,
        style: TextStyle(color: textColor),
      ),
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: onTap,
    );
  }
}
