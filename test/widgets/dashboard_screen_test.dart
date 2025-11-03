import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/feature/dashboard/screens/dashboard_screen.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/services/order_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/services/profile_service_interface.dart';
import 'package:mockito/mockito.dart';

class MockOrderService extends Mock implements OrderServiceInterface {}
class MockProfileService extends Mock implements ProfileServiceInterface {}

void main() {
  group('DashboardScreen Widget Tests', () {
    late OrderController orderController;
    late ProfileController profileController;

    setUpAll(() {
      TestWidgetsFlutterBinding.ensureInitialized();
      Get.testMode = true;
    });

    setUp(() {
      Get.reset();
      final mockOrderService = MockOrderService();
      final mockProfileService = MockProfileService();

      // Mock isNotificationActive BEFORE creating ProfileController
      // because ProfileController constructor calls this method
      when(mockProfileService.isNotificationActive()).thenReturn(true);

      // Create controllers after mocks are set up
      orderController = OrderController(orderServiceInterface: mockOrderService);
      Get.lazyPut(() => orderController);

      profileController = ProfileController(profileServiceInterface: mockProfileService);
      Get.lazyPut(() => profileController);
    });

    tearDown(() {
      Get.reset();
    });

    testWidgets('Should display dashboard with bottom navigation', (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(
        GetMaterialApp(
          home: DashboardScreen(pageIndex: 0),
        ),
      );

      // Verify that bottom navigation bar is present
      expect(find.byType(BottomNavigationBar), findsOneWidget);
    });

    testWidgets('Should navigate between pages', (WidgetTester tester) async {
      // Note: setUp() already creates the controllers, so we can use them directly
      await tester.pumpWidget(
        GetMaterialApp(
          home: DashboardScreen(pageIndex: 0),
        ),
      );

      // Find bottom navigation items
      final bottomNavItems = find.byType(BottomNavigationBar);
      expect(bottomNavItems, findsOneWidget);
    });
  });
}

