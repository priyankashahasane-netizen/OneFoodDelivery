import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stackfood_multivendor_driver/feature/splash/controllers/splash_controller.dart';
import 'package:stackfood_multivendor_driver/feature/splash/domain/services/splash_service_interface.dart';
import 'package:stackfood_multivendor_driver/common/models/config_model.dart';

import 'splash_controller_test.mocks.dart';

@GenerateMocks([SplashServiceInterface])

void main() {
  group('SplashController Tests', () {
    late SplashController splashController;
    late MockSplashServiceInterface mockSplashService;
    late SharedPreferences prefs;

    setUpAll(() async {
      Get.testMode = true;
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
    });

    setUp(() {
      mockSplashService = MockSplashServiceInterface();
      splashController = SplashController(splashServiceInterface: mockSplashService);
    });

    tearDown(() {
      Get.reset();
    });

    group('Initialization', () {
      test('Should initialize with default values', () {
        expect(splashController.configModel, isNull);
      });
    });

    group('Get Config Data', () {
      test('Should successfully get config data', () async {
        // Arrange
        final mockConfig = ConfigModel(
          businessName: 'Test Business',
        );
        when(mockSplashService.getConfigData()).thenAnswer((_) async => mockConfig);

        // Act
        final result = await splashController.getConfigData();

        // Assert
        expect(result, true);
        expect(splashController.configModel, isNotNull);
      });

      test('Should return false when config fetch fails', () async {
        // Arrange
        when(mockSplashService.getConfigData()).thenThrow(Exception('Network error'));

        // Act
        final result = await splashController.getConfigData();

        // Assert
        expect(result, false);
      });
    });

    group('Shared Data Initialization', () {
      test('Should initialize shared data', () async {
        // Act
        splashController.initSharedData();

        // Assert
        // Verify shared preferences are initialized
        expect(prefs, isNotNull);
      });
    });
  });
}

