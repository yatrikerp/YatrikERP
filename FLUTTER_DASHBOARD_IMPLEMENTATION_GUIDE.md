# Flutter Passenger Dashboard - Complete Implementation Guide

## ✅ What I've Created

### 1. Main Tabs Screen
**File**: `flutter/lib/screens/passenger/passenger_dashboard_tabs.dart`

This is the main container with:
- ✅ App bar with YATRIK logo
- ✅ Notification button with red badge
- ✅ Profile button
- ✅ Bottom navigation with 4 tabs
- ✅ IndexedStack for tab switching

## 📁 Files You Need to Create

### Step 1: Create Tabs Directory
```bash
cd flutter/lib/screens/passenger
mkdir tabs
```

### Step 2: Create Tab Files

#### A. Dashboard Tab
**File**: `flutter/lib/screens/passenger/tabs/dashboard_tab.dart`

Copy the content from your current `passenger_home_screen.dart` and enhance it with:
- Quick search suggestions
- Numbered popular routes (1, 2, 3)
- Book buttons on routes

#### B. My Trips Tab
**File**: `flutter/lib/screens/passenger/tabs/my_trips_tab.dart`

```dart
import 'package:flutter/material.dart';
// Show list of upcoming and past trips
// Filter options
// Trip cards with details
```

#### C. Search Tab
**File**: `flutter/lib/screens/passenger/tabs/search_tab.dart`

```dart
import 'package:flutter/material.dart';
// Search form (From/To/Date)
// Popular routes list
// Popular buses list
// Search button
```

#### D. Profile Tab
**File**: `flutter/lib/screens/passenger/tabs/profile_tab.dart`

```dart
import 'package:flutter/material.dart';
// User info card
// My Tickets button
// Wallet button
// Settings options
// Logout button
```

## 🔧 Quick Implementation Steps

### Option 1: Use Current Screen as Dashboard Tab

1. **Rename** `passenger_home_screen.dart` to `dashboard_tab.dart`
2. **Move** it to `tabs/` directory
3. **Update** class name to `DashboardTab`
4. **Remove** Scaffold (tabs screen provides it)
5. **Return** just the body content

### Option 2: Create New Files

I'll create all the tab files for you in the next steps.

## 🎯 What Each Tab Should Have

### Dashboard Tab:
```dart
- Welcome card (gradient, pink)
- 2 Quick stat cards (Upcoming, Wallet)
- Quick search card (tap to search)
- Quick search suggestions (3-4 routes)
- Upcoming trips list (if any)
- Popular routes (numbered 1-3 with book button)
```

### My Trips Tab:
```dart
- Filter chips (Upcoming / Past)
- Trip cards list:
  * Route (From → To)
  * Date & Time
  * Bus type
  * Seat number
  * Status badge
  * Fare amount
- Empty state if no trips
- Pull to refresh
```

### Search Tab:
```dart
- Search form:
  * From TextField
  * To TextField
  * Date Picker
  * Search button
- Popular routes section (6 routes)
- Popular buses section (if available)
- Quick search buttons
```

### Profile Tab:
```dart
- User avatar and info
- Quick action buttons:
  * My Tickets
  * Wallet
- Settings list:
  * Edit Profile
  * Change Password
  * Notifications
  * Help & Support
- Logout button (red)
```

## 🔗 Update Main.dart

Change the route from:
```dart
'/home': (context) => const PassengerHomeScreen(),
```

To:
```dart
'/home': (context) => const PassengerDashboardTabs(),
```

And add import:
```dart
import 'screens/passenger/passenger_dashboard_tabs.dart';
```

## 📱 Expected User Experience

1. **Login** → See Dashboard tab
2. **Tap My Trips** → See all bookings
3. **Tap Search** → Search form ready
4. **Tap Profile** → User settings
5. **Tap notification** → See notifications
6. **Pull down** → Refresh data

## ✅ Testing Checklist

- [ ] App launches to Dashboard tab
- [ ] Can switch between all 4 tabs
- [ ] Dashboard shows welcome and stats
- [ ] My Trips shows bookings
- [ ] Search form works
- [ ] Profile shows user info
- [ ] Notification button shows badge
- [ ] Bottom nav highlights active tab
- [ ] Pull to refresh works
- [ ] Navigation is smooth

## 🚀 Next Steps

1. Create the `tabs/` directory
2. Create all 4 tab files
3. Update `main.dart` routing
4. Test the app
5. Add any missing features

## 📝 Quick Copy-Paste Templates

### Dashboard Tab Template:
```dart
import 'package:flutter/material.dart';
import '../../../utils/colors.dart';

class DashboardTab extends StatefulWidget {
  const DashboardTab({super.key});

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          // Welcome card
          // Stats cards
          // Quick search
          // Upcoming trips
          // Popular routes
        ],
      ),
    );
  }
}
```

### My Trips Tab Template:
```dart
import 'package:flutter/material.dart';
import '../../../utils/colors.dart';

class MyTripsTab extends StatefulWidget {
  const MyTripsTab({super.key});

  @override
  State<MyTripsTab> createState() => _MyTripsTabState();
}

class _MyTripsTabState extends State<MyTripsTab> {
  String _filter = 'upcoming'; // or 'past'
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Filter chips
        // Trip list
      ],
    );
  }
}
```

### Search Tab Template:
```dart
import 'package:flutter/material.dart';
import '../../../utils/colors.dart';

class SearchTab extends StatefulWidget {
  const SearchTab({super.key});

  @override
  State<SearchTab> createState() => _SearchTabState();
}

class _SearchTabState extends State<SearchTab> {
  final _fromController = TextEditingController();
  final _toController = TextEditingController();
  DateTime? _selectedDate;
  
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Search form
            // Popular routes
          ],
        ),
      ),
    );
  }
}
```

### Profile Tab Template:
```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../utils/colors.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;
    
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // User card
            // Quick actions
            // Settings list
            // Logout button
          ],
        ),
      ),
    );
  }
}
```

---

**Status**: Main tabs screen created ✅
**Next**: Create individual tab files
**Priority**: HIGH
**Time**: 2-3 hours for all tabs
