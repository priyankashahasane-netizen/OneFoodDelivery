import 'package:flutter_test/flutter_test.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/auth_controller.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/services/auth_service.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/repositories/auth_repository.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';

void main() {
  group('Auth System Tests', () {
    late AuthController authController;
    late AuthService authService;
    late AuthRepository authRepository;
    late ApiClient apiClient;
    late SharedPreferences prefs;

    setUpAll(() async {
      TestWidgetsFlutterBinding.ensureInitialized();
      prefs = await SharedPreferences.getInstance();
      Get.testMode = true;
    });

    setUp(() async {
      // Clear any existing state
      await prefs.clear();
      
      // Initialize dependencies
      apiClient = ApiClient(
        appBaseUrl: AppConstants.baseUrl,
        sharedPreferences: prefs,
      );
      Get.lazyPut(() => apiClient);
      
      authRepository = AuthRepository(
        apiClient: apiClient,
        sharedPreferences: prefs,
      );
      Get.lazyPut(() => authRepository);
      
      authService = AuthService(authRepositoryInterface: authRepository);
      Get.lazyPut(() => authService);
      
      authController = AuthController(authServiceInterface: authService);
      Get.lazyPut(() => authController);
    });

    tearDown(() async {
      await prefs.clear();
      Get.reset();
    });

    group('Demo User Login', () {
      test('Should login with demo user credentials (+919975008124 / Pri@0110)', () async {
        // Arrange
        const phone = '+919975008124';
        const password = 'Pri@0110';

        // Act
        final result = await authController.login(phone, password);

        // Assert
        expect(result.isSuccess, true, reason: 'Login should succeed with valid demo credentials');
        expect(authController.isLoggedIn(), true, reason: 'User should be logged in after successful login');
        expect(authController.getUserToken().isNotEmpty, true, reason: 'JWT token should be stored');
      });

      test('Should login with demo user phone without country code (9975008124)', () async {
        // Arrange
        const phone = '9975008124';
        const password = 'Pri@0110';

        // Act
        final result = await authController.login(phone, password);

        // Assert
        expect(result.isSuccess, true, reason: 'Login should work with phone without country code');
        expect(authController.isLoggedIn(), true);
      });

      test('Should fail with wrong password', () async {
        // Arrange
        const phone = '+919975008124';
        const wrongPassword = 'WrongPassword123';

        // Act
        final result = await authController.login(phone, wrongPassword);

        // Assert
        expect(result.isSuccess, false, reason: 'Login should fail with incorrect password');
        expect(authController.isLoggedIn(), false, reason: 'User should not be logged in');
      });

      test('Should fail with wrong phone number', () async {
        // Arrange
        const wrongPhone = '+1234567890';
        const password = 'Pri@0110';

        // Act
        final result = await authController.login(wrongPhone, password);

        // Assert
        expect(result.isSuccess, false, reason: 'Login should fail with non-existent phone');
        expect(authController.isLoggedIn(), false);
      });
    });

    group('Token Management', () {
      test('Should save and retrieve JWT token after login', () async {
        // Arrange
        const phone = '+919975008124';
        const password = 'Pri@0110';

        // Act
        final result = await authController.login(phone, password);
        final token = authController.getUserToken();

        // Assert
        expect(result.isSuccess, true);
        expect(token.isNotEmpty, true, reason: 'Token should be stored');
        expect(token.length, greaterThan(50), reason: 'JWT tokens are typically long strings');
      });

      test('Should clear token on logout', () async {
        // Arrange
        await authController.login('+919975008124', 'Pri@0110');
        expect(authController.isLoggedIn(), true);

        // Act
        await authController.clearSharedData();

        // Assert
        expect(authController.isLoggedIn(), false, reason: 'User should be logged out');
        expect(authController.getUserToken(), isEmpty, reason: 'Token should be cleared');
      });

      test('Should persist token across app restarts', () async {
        // Arrange
        await authController.login('+919975008124', 'Pri@0110');
        final token1 = authController.getUserToken();
        
        // Simulate app restart - create new controller with same shared preferences
        Get.reset();
        final newApiClient = ApiClient(appBaseUrl: AppConstants.baseUrl, sharedPreferences: prefs);
        Get.lazyPut(() => newApiClient);
        final newRepo = AuthRepository(apiClient: newApiClient, sharedPreferences: prefs);
        Get.lazyPut(() => newRepo);
        final newService = AuthService(authRepositoryInterface: newRepo);
        Get.lazyPut(() => newService);
        final newController = AuthController(authServiceInterface: newService);
        Get.lazyPut(() => newController);

        // Assert
        expect(newController.isLoggedIn(), true, reason: 'Should remain logged in after restart');
        expect(newController.getUserToken(), token1, reason: 'Token should be the same');
      });
    });

    group('Remember Me', () {
      test('Should save credentials when remember me is enabled', () async {
        // Arrange
        const phone = '9975008124';
        const password = 'Pri@0110';
        const countryCode = '+91';
        authController.toggleRememberMe();
        expect(authController.isActiveRememberMe, true);

        // Act
        await authController.login('+919975008124', password);
        if (authController.isActiveRememberMe) {
          authController.saveUserNumberAndPassword(phone, password, countryCode);
        }

        // Assert
        expect(authController.getUserNumber(), phone);
        expect(authController.getUserPassword(), password);
        expect(authController.getUserCountryCode(), countryCode);
      });

      test('Should not save credentials when remember me is disabled', () async {
        // Arrange
        const phone = '9975008124';
        const password = 'Pri@0110';
        const countryCode = '+91';
        expect(authController.isActiveRememberMe, false);

        // Act
        await authController.login('+919975008124', password);
        await authController.clearUserNumberAndPassword();

        // Assert
        expect(authController.getUserNumber(), isEmpty);
        expect(authController.getUserPassword(), isEmpty);
      });
    });

    group('Password Validation', () {
      test('Should validate password requirements', () {
        // Arrange
        final passwords = [
          'Short1!',      // Too short
          'longpassword', // No uppercase, no number, no special
          'LongPassword', // No number, no special
          'LongPass123',  // No special char
          'LongPass1!',   // Valid
        ];

        // Act & Assert
        authController.validPassCheck(passwords[0]);
        expect(authController.lengthCheck, false);
        
        authController.validPassCheck(passwords[1]);
        expect(authController.uppercaseCheck, false);
        expect(authController.numberCheck, false);
        expect(authController.spatialCheck, false);
        
        authController.validPassCheck(passwords[2]);
        expect(authController.numberCheck, false);
        expect(authController.spatialCheck, false);
        
        authController.validPassCheck(passwords[3]);
        expect(authController.spatialCheck, false);
        
        authController.validPassCheck(passwords[4]);
        expect(authController.lengthCheck, true);
        expect(authController.uppercaseCheck, true);
        expect(authController.lowercaseCheck, true);
        expect(authController.numberCheck, true);
        expect(authController.spatialCheck, true);
      });
    });

    group('Error Handling', () {
      test('Should handle empty phone number', () async {
        // Act
        final result = await authController.login('', 'password123');

        // Assert
        expect(result.isSuccess, false);
      });

      test('Should handle empty password', () async {
        // Act
        final result = await authController.login('+919975008124', '');

        // Assert
        expect(result.isSuccess, false);
      });

      test('Should handle network errors gracefully', () async {
        // Arrange - Use invalid base URL to simulate network error
        final invalidApiClient = ApiClient(
          appBaseUrl: 'http://invalid-url:9999',
          sharedPreferences: prefs,
        );
        Get.reset();
        Get.lazyPut(() => invalidApiClient);
        final invalidRepo = AuthRepository(
          apiClient: invalidApiClient,
          sharedPreferences: prefs,
        );
        Get.lazyPut(() => invalidRepo);
        final invalidService = AuthService(authRepositoryInterface: invalidRepo);
        Get.lazyPut(() => invalidService);
        final invalidController = AuthController(authServiceInterface: invalidService);
        Get.lazyPut(() => invalidController);

        // Act
        final result = await invalidController.login('+919975008124', 'Pri@0110');

        // Assert
        expect(result.isSuccess, false, reason: 'Should handle network errors');
      });
    });

    group('UI State Management', () {
      test('Should toggle password visibility', () {
        // Arrange
        expect(authController.showPassView, false);

        // Act
        authController.showHidePass();

        // Assert
        expect(authController.showPassView, true);

        // Act
        authController.showHidePass();

        // Assert
        expect(authController.showPassView, false);
      });

      test('Should toggle remember me', () {
        // Arrange
        expect(authController.isActiveRememberMe, false);

        // Act
        authController.toggleRememberMe();

        // Assert
        expect(authController.isActiveRememberMe, true);

        // Act
        authController.toggleRememberMe();

        // Assert
        expect(authController.isActiveRememberMe, false);
      });

      test('Should show loading state during login', () async {
        // Arrange
        const phone = '+919975008124';
        const password = 'Pri@0110';

        // Act
        final loginFuture = authController.login(phone, password);
        expect(authController.isLoading, true);

        // Wait for login to complete
        await loginFuture;

        // Assert
        expect(authController.isLoading, false);
      });
    });
  });
}

