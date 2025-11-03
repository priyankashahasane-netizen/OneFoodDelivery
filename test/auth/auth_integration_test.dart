import 'package:flutter_test/flutter_test.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/auth_controller.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/services/auth_service.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/repositories/auth_repository.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';

/// Integration tests that require a running backend server
/// Run these tests only when backend is available at http://localhost:3000
void main() {
  group('Auth Integration Tests (Requires Backend)', () {
    late AuthController authController;
    late SharedPreferences prefs;
    bool backendAvailable = false;

    setUpAll(() async {
      TestWidgetsFlutterBinding.ensureInitialized();
      prefs = await SharedPreferences.getInstance();
      Get.testMode = true;

      // Check if backend is available
      try {
        final client = ApiClient(
          appBaseUrl: AppConstants.baseUrl,
          sharedPreferences: prefs,
        );
        final response = await client.getData('/api/health', handleError: false);
        backendAvailable = response.statusCode == 200;
      } catch (e) {
        backendAvailable = false;
      }
    });

    setUp(() async {
      if (!backendAvailable) {
        return; // Skip setup if backend unavailable
      }

      await prefs.clear();
      
      final apiClient = ApiClient(
        appBaseUrl: AppConstants.baseUrl,
        sharedPreferences: prefs,
      );
      Get.lazyPut(() => apiClient);
      
      final authRepository = AuthRepository(
        apiClient: apiClient,
        sharedPreferences: prefs,
      );
      Get.lazyPut(() => authRepository);
      
      final authService = AuthService(authRepositoryInterface: authRepository);
      Get.lazyPut(() => authService);
      
      authController = AuthController(authServiceInterface: authService);
      Get.lazyPut(() => authController);
    });

    tearDown(() async {
      await prefs.clear();
      Get.reset();
    });

    test('Demo User Login Integration Test', () async {
      if (!backendAvailable) {
        print('⚠️  Backend not available. Skipping integration test.');
        return;
      }

      // Demo user credentials
      const phone = '+919975008124';
      const password = 'Pri@0110';

      // Act
      final result = await authController.login(phone, password);

      // Assert
      expect(result.isSuccess, true, 
        reason: 'Demo user login should succeed. Ensure backend is running and demo user exists.');

      expect(authController.isLoggedIn(), true);
      
      final token = authController.getUserToken();
      expect(token.isNotEmpty, true);
      expect(token.length, greaterThan(50), 
        reason: 'Should receive valid JWT token from backend');

      print('✅ Demo user login successful!');
      print('   Token: ${token.substring(0, 20)}...');
    }, skip: !backendAvailable);

    test('Auto-create driver with default password', () async {
      if (!backendAvailable) {
        print('⚠️  Backend not available. Skipping integration test.');
        return;
      }

      // Use a unique phone number that doesn't exist
      final uniquePhone = '+9198765432${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
      const defaultPassword = '123456';

      // Act - First login should auto-create the driver
      final result = await authController.login(uniquePhone, defaultPassword);

      // Assert
      expect(result.isSuccess, true, 
        reason: 'Backend should auto-create driver with default password 123456');
      
      expect(authController.isLoggedIn(), true);
      expect(authController.getUserToken().isNotEmpty, true);

      print('✅ Auto-create driver test successful!');
    }, skip: !backendAvailable);
  });
}

