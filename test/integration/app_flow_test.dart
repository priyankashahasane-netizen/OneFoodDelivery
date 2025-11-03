import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/auth_controller.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/services/auth_service.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/repositories/auth_repository.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/services/order_service.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/repositories/order_repository.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/services/profile_service.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/repositories/profile_repository.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/profile_model.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:mockito/mockito.dart';

/// Integration tests for complete user flows
/// These tests verify that controllers, services, and repositories work together
void main() {
  group('App Flow Integration Tests', () {
    late SharedPreferences prefs;
    late ApiClient apiClient;
    late AuthController authController;
    late OrderController orderController;
    late ProfileController profileController;

    setUpAll(() async {
      TestWidgetsFlutterBinding.ensureInitialized();
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
      Get.testMode = true;
    });

    setUp(() {
      Get.reset();
      
      // Initialize API client
      apiClient = ApiClient(
        appBaseUrl: AppConstants.baseUrl,
        sharedPreferences: prefs,
      );
      Get.lazyPut(() => apiClient);

      // Initialize Auth
      final authRepo = AuthRepository(
        apiClient: apiClient,
        sharedPreferences: prefs,
      );
      Get.lazyPut(() => authRepo);
      
      final authService = AuthService(authRepositoryInterface: authRepo);
      Get.lazyPut(() => authService);
      
      authController = AuthController(authServiceInterface: authService);
      Get.lazyPut(() => authController);

      // Initialize Order
      final orderRepo = OrderRepository(apiClient: apiClient);
      Get.lazyPut(() => orderRepo);
      
      final orderService = OrderService(orderRepositoryInterface: orderRepo);
      Get.lazyPut(() => orderService);
      
      orderController = OrderController(orderServiceInterface: orderService);
      Get.lazyPut(() => orderController);

      // Initialize Profile
      final profileRepo = ProfileRepository(apiClient: apiClient, sharedPreferences: prefs);
      Get.lazyPut(() => profileRepo);
      
      final profileService = ProfileService(profileRepositoryInterface: profileRepo);
      Get.lazyPut(() => profileService);
      
      profileController = ProfileController(profileServiceInterface: profileService);
      Get.lazyPut(() => profileController);
    });

    tearDown(() async {
      await prefs.clear();
      Get.reset();
    });

    group('Complete Login Flow', () {
      test('Should complete login flow and initialize app state', () async {
        // Arrange
        const phone = '+919975008124';
        const password = 'Pri@0110';

        // Act - Login
        final loginResult = await authController.login(phone, password);

        // Assert - Verify login succeeded
        expect(loginResult.isSuccess, true, reason: 'Login should succeed');
        expect(authController.isLoggedIn(), true, reason: 'Should be logged in');

        // Act - Get profile after login
        await profileController.getProfile();

        // Assert - Profile should be loaded
        expect(profileController.profileModel, isNotNull, reason: 'Profile should be loaded');

        // Act - Get orders after login
        await orderController.getLatestOrders();

        // Assert - Orders should be loaded
        expect(orderController.latestOrderList, isNotNull, reason: 'Orders should be loaded');
      });
    });

    group('Order Acceptance Flow', () {
      test('Should accept order and update order lists', () async {
        // Arrange
        const phone = '+919975008124';
        const password = 'Pri@0110';
        await authController.login(phone, password);
        await orderController.getLatestOrders();

        // Act - Accept an order
        if (orderController.latestOrderList != null && 
            orderController.latestOrderList!.isNotEmpty) {
          final orderId = orderController.latestOrderList!.first.id;
          final acceptResult = await orderController.acceptOrder(orderId);

          // Assert
          expect(acceptResult.isSuccess, true, reason: 'Order should be accepted');
        }
      });
    });

    group('Profile Update Flow', () {
      test('Should update profile and refresh data', () async {
        // Arrange
        const phone = '+919975008124';
        const password = 'Pri@0110';
        await authController.login(phone, password);
        await profileController.getProfile();

        // Act - Update profile
        if (profileController.profileModel != null) {
          final currentProfile = profileController.profileModel!;
          final updatedProfile = ProfileModel(
            id: currentProfile.id,
            fName: 'Updated Name',
            lName: currentProfile.lName,
            phone: currentProfile.phone,
            email: currentProfile.email,
          );
          final updateResult = await profileController.updateUserInfo(
            updatedProfile,
            authController.getUserToken(),
          );

          // Assert
          expect(updateResult, true, reason: 'Profile should be updated');
        }
      });
    });
  });
}

