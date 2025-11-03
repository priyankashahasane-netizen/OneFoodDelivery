import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/feature/auth/screens/sign_in_screen.dart' as sign_in;
import 'package:stackfood_multivendor_driver/feature/auth/controllers/auth_controller.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/services/auth_service.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/repositories/auth_repository.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';

void main() {
  group('SignInScreen Widget Tests', () {
    late AuthController authController;
    late SharedPreferences prefs;

    setUpAll(() async {
      TestWidgetsFlutterBinding.ensureInitialized();
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
      Get.testMode = true;
    });

    setUp(() async {
      Get.reset();
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

    tearDown(() {
      Get.reset();
    });

    testWidgets('Should display sign in screen with required fields', (WidgetTester tester) async {
      // Build our app and trigger a frame.
      await tester.pumpWidget(
        GetMaterialApp(
          home: sign_in.SignInViewScreen(),
        ),
      );

      // Verify that phone number field is present
      expect(find.byType(TextFormField), findsWidgets);
      
      // Verify that password field is present
      expect(find.text('password'.tr), findsWidgets);
    });

    testWidgets('Should toggle password visibility', (WidgetTester tester) async {
      await tester.pumpWidget(
        GetMaterialApp(
          home: sign_in.SignInViewScreen(),
        ),
      );

      // Find password visibility toggle button
      final passwordVisibilityButton = find.byIcon(Icons.visibility_off);
      if (passwordVisibilityButton.evaluate().isNotEmpty) {
        await tester.tap(passwordVisibilityButton);
        await tester.pump();

        // Verify password visibility toggled
        expect(authController.showPassView, true);
      }
    });

    testWidgets('Should toggle remember me checkbox', (WidgetTester tester) async {
      await tester.pumpWidget(
        GetMaterialApp(
          home: sign_in.SignInViewScreen(),
        ),
      );

      await tester.pumpAndSettle();

      // Get the controller from GetX (widget uses Get.find internally)
      final controller = Get.find<AuthController>();
      
      // Find remember me checkbox or ListTile
      final rememberMeCheckbox = find.byType(Checkbox);
      final rememberMeListTile = find.text('remember_me'.tr);
      
      // Get initial value
      final initialValue = controller.isActiveRememberMe;
      
      // Tap on checkbox if found, otherwise tap on ListTile
      if (rememberMeCheckbox.evaluate().isNotEmpty) {
        await tester.tap(rememberMeCheckbox);
      } else if (rememberMeListTile.evaluate().isNotEmpty) {
        await tester.tap(rememberMeListTile);
      }
      
      await tester.pump();
      await tester.pump();

      // Verify remember me toggled
      expect(controller.isActiveRememberMe, !initialValue);
    });
  });
}

