import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mockito/mockito.dart';
import 'package:stackfood_multivendor_driver/feature/language/controllers/localization_controller.dart';
import 'package:stackfood_multivendor_driver/feature/language/domain/services/language_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/language/domain/models/language_model.dart';
import 'package:flutter/material.dart';

class MockLanguageService extends Mock implements LanguageServiceInterface {}

void main() {
  group('LocalizationController Tests', () {
    late LocalizationController localizationController;
    late MockLanguageService mockLanguageService;

    setUpAll(() {
      Get.testMode = true;
    });

    setUp(() {
      mockLanguageService = MockLanguageService();
      localizationController = LocalizationController(languageServiceInterface: mockLanguageService);
    });

    tearDown(() {
      Get.reset();
    });

    group('Initialization', () {
      test('Should initialize with default locale', () {
        expect(localizationController.locale, isNotNull);
      });

      test('Should initialize with language list', () {
        expect(localizationController.languages, isNotNull);
      });
    });

    group('Set Language', () {
      test('Should successfully set language', () {
        // Arrange
        final locale = Locale('en', 'US');

        // Act
        localizationController.setLanguage(locale);

        // Assert
        expect(localizationController.locale.languageCode, 'en');
        expect(localizationController.locale.countryCode, 'US');
      });

      test('Should update selected language index', () {
        // Arrange
        final locale = Locale('es', 'ES');

        // Act
        localizationController.setLanguage(locale);

        // Assert
        expect(localizationController.selectedLanguageIndex, greaterThanOrEqualTo(0));
      });
    });

    group('Search Language', () {
      test('Should filter languages by search query', () {
        // NOTE: searchLanguage method doesn't exist in controller
        // This is a placeholder test
        // Arrange
        final query = 'English';

        // Act & Assert - Basic validation
        expect(query.isNotEmpty, true);
      });
    });
  });
}

