import 'package:flutter/material.dart';

class AppColors {
  // Brand Colors matching web app
  static const Color brandPink = Color(0xFFE91E63);
  static const Color brandPinkDark = Color(0xFFC2185B);
  static const Color brandPinkHover = Color(0xFFEC407A);
  static const Color brandGreen = Color(0xFF2E7D32);
  static const Color brandTeal = Color(0xFF00ACC1);
  static const Color brandTealDark = Color(0xFF00838F);
  
  // Text Colors
  static const Color text900 = Color(0xFF0f172a);
  static const Color text700 = Color(0xFF334155);
  static const Color text500 = Color(0xFF64748b);
  
  // Background Colors
  static const Color bgStart = Color(0xFFE8F3FF);
  static const Color bgEnd = Color(0xFFFFFFFF);
  static const Color card = Color(0xFFFFFFFF);
  
  // Utility Colors
  static const Color border = Color(0xFFE2E8F0);
  static const Color success = Color(0xFF10b981);
  static const Color warning = Color(0xFFf59e0b);
  static const Color error = Color(0xFFef4444);
  static const Color info = Color(0xFF3b82f6);
  
  // Gradients
  static LinearGradient primaryGradient = const LinearGradient(
    colors: [brandPink, brandGreen],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );
  
  static LinearGradient pinkGradient = const LinearGradient(
    colors: [brandPink, brandPinkDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
