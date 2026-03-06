import 'package:flutter/material.dart';

class NavigationProvider extends ChangeNotifier {
  int _currentTabIndex = 0;
  Map<String, dynamic>? _searchPreFillData;

  int get currentTabIndex => _currentTabIndex;
  Map<String, dynamic>? get searchPreFillData => _searchPreFillData;

  void setTabIndex(int index) {
    _currentTabIndex = index;
    notifyListeners();
  }

  void navigateToSearch({Map<String, dynamic>? preFillData}) {
    _searchPreFillData = preFillData;
    _currentTabIndex = 2; // Search tab index
    notifyListeners();
  }

  void navigateToMyTrips() {
    _currentTabIndex = 1; // My trips tab index
    notifyListeners();
  }

  void navigateToProfile() {
    _currentTabIndex = 3; // Profile tab index
    notifyListeners();
  }

  void clearSearchPreFillData() {
    _searchPreFillData = null;
    notifyListeners();
  }
}