import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/navigation_provider.dart';
import '../../../services/api_service.dart';
import '../../../utils/colors.dart';
import '../../search/search_results_screen.dart';

class SearchTab extends StatefulWidget {
  const SearchTab({super.key});

  @override
  State<SearchTab> createState() => _SearchTabState();
}

class _SearchTabState extends State<SearchTab> {
  final _formKey = GlobalKey<FormState>();
  final _fromController = TextEditingController();
  final _toController = TextEditingController();
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  int _passengers = 1;
  bool _isSearching = false;
  List<Map<String, dynamic>> _popularRoutes = [];
  bool _loadingRoutes = true;

  @override
  void initState() {
    super.initState();
    _loadPopularRoutes();
    
    // Listen for pre-fill data after the widget is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkForPreFillData();
    });
  }

  void _checkForPreFillData() {
    final navigationProvider = Provider.of<NavigationProvider>(context, listen: false);
    final preFillData = navigationProvider.searchPreFillData;
    
    if (preFillData != null) {
      setState(() {
        _fromController.text = preFillData['from'] ?? '';
        _toController.text = preFillData['to'] ?? '';
      });
      
      // Clear the pre-fill data after using it
      navigationProvider.clearSearchPreFillData();
      
      // Show a confirmation message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Route selected: ${preFillData['from']} → ${preFillData['to']}'),
          duration: const Duration(seconds: 2),
          backgroundColor: AppColors.brandPink,
        ),
      );
    }
  }

  @override
  void dispose() {
    _fromController.dispose();
    _toController.dispose();
    super.dispose();
  }

  Future<void> _loadPopularRoutes() async {
    setState(() => _loadingRoutes = true);
    try {
      final apiService = ApiService();
      final response = await apiService.get('/api/routes/popular?limit=8');
      
      if (response['success'] == true) {
        setState(() {
          _popularRoutes = (response['data'] as List? ?? [])
              .map((e) => Map<String, dynamic>.from(e))
              .toList();
        });
      }
    } catch (e) {
      print('Error loading popular routes: $e');
      // Set default routes
      setState(() {
        _popularRoutes = [
          {'from': 'Kochi', 'to': 'Thiruvananthapuram', 'minFare': 450},
          {'from': 'Kochi', 'to': 'Kozhikode', 'minFare': 350},
          {'from': 'Kochi', 'to': 'Bangalore', 'minFare': 850},
          {'from': 'Kochi', 'to': 'Chennai', 'minFare': 750},
        ];
      });
    } finally {
      setState(() => _loadingRoutes = false);
    }
  }

  Future<void> _handleSearch() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSearching = true);
    try {
      // Navigate to search results
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => SearchResultsScreen(
            from: _fromController.text,
            to: _toController.text,
            date: _selectedDate,
            passengers: _passengers,
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Search failed: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _isSearching = false);
      }
    }
  }

  void _swapLocations() {
    final temp = _fromController.text;
    _fromController.text = _toController.text;
    _toController.text = temp;
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.brandPink,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            const Text(
              'Search Buses',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.text900,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Find your perfect journey',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.text600,
              ),
            ),
            const SizedBox(height: 24),

            // Search Form
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.gray200),
              ),
              child: Column(
                children: [
                  // From Location
                  TextFormField(
                    controller: _fromController,
                    decoration: InputDecoration(
                      labelText: 'From',
                      hintText: 'Enter departure city',
                      prefixIcon: const Icon(Icons.location_on, color: AppColors.brandPink),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.brandPink, width: 2),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter departure city';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Swap Button
                  Center(
                    child: IconButton(
                      onPressed: _swapLocations,
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.gray100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.swap_vert,
                          color: AppColors.brandPink,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // To Location
                  TextFormField(
                    controller: _toController,
                    decoration: InputDecoration(
                      labelText: 'To',
                      hintText: 'Enter destination city',
                      prefixIcon: const Icon(Icons.location_on, color: AppColors.brandPink),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.brandPink, width: 2),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Please enter destination city';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Date Picker
                  InkWell(
                    onTap: _selectDate,
                    child: InputDecorator(
                      decoration: InputDecoration(
                        labelText: 'Travel Date',
                        prefixIcon: const Icon(Icons.calendar_today, color: AppColors.brandPink),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Passengers
                  DropdownButtonFormField<int>(
                    value: _passengers,
                    decoration: InputDecoration(
                      labelText: 'Passengers',
                      prefixIcon: const Icon(Icons.people, color: AppColors.brandPink),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.brandPink, width: 2),
                      ),
                    ),
                    items: List.generate(10, (index) => index + 1)
                        .map((num) => DropdownMenuItem(
                              value: num,
                              child: Text('$num Passenger${num > 1 ? 's' : ''}'),
                            ))
                        .toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setState(() => _passengers = value);
                      }
                    },
                  ),
                  const SizedBox(height: 24),

                  // Search Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isSearching ? null : _handleSearch,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.brandPink,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isSearching
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.search),
                                SizedBox(width: 8),
                                Text(
                                  'Search Buses',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Popular Routes
            Row(
              children: [
                const Icon(Icons.star, color: Colors.amber, size: 20),
                const SizedBox(width: 8),
                const Text(
                  'Popular Routes',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.text900,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (_loadingRoutes)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_popularRoutes.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: Text('No popular routes available'),
                ),
              )
            else
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.3,
                ),
                itemCount: _popularRoutes.length,
                itemBuilder: (context, index) {
                  final route = _popularRoutes[index];
                  return _buildRouteCard(route);
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildRouteCard(Map<String, dynamic> route) {
    return InkWell(
      onTap: () {
        _fromController.text = route['from'] ?? '';
        _toController.text = route['to'] ?? '';
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.gray200),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Icon(Icons.directions_bus, size: 16, color: AppColors.brandPink),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    '${route['from']} → ${route['to']}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.text900,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            if (route['minFare'] != null)
              Text(
                'From ₹${route['minFare']}',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.brandPink,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
