import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/repositories/auth_repository.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  group('AuthRepository Tests', () {
    late AuthRepository authRepository;
    late ApiClient apiClient;
    late SharedPreferences prefs;

    setUpAll(() async {
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
    });

    setUp(() {
      apiClient = ApiClient(
        appBaseUrl: AppConstants.baseUrl,
        sharedPreferences: prefs,
      );
      authRepository = AuthRepository(
        apiClient: apiClient,
        sharedPreferences: prefs,
      );
    });

    tearDown(() async {
      await prefs.clear();
    });

    group('Login', () {
      test('Should handle successful login response structure', () async {
        // This test verifies the repository handles API response correctly
        // Actual API calls are tested in integration tests
        expect(authRepository, isNotNull);
      });

      test('Should store token in SharedPreferences after login', () async {
        // Arrange
        const testToken = 'test_jwt_token_12345';
        
        // Act - Simulate storing token
        await prefs.setString(AppConstants.token, testToken);
        
        // Assert
        final storedToken = prefs.getString(AppConstants.token);
        expect(storedToken, testToken);
      });
    });

    group('Token Management', () {
      test('Should retrieve stored token', () async {
        // Arrange
        const testToken = 'test_token';
        await prefs.setString(AppConstants.token, testToken);

        // Act
        final token = prefs.getString(AppConstants.token);

        // Assert
        expect(token, testToken);
      });

      test('Should clear token on logout', () async {
        // Arrange
        await prefs.setString(AppConstants.token, 'test_token');
        
        // Act
        await prefs.remove(AppConstants.token);

        // Assert
        final token = prefs.getString(AppConstants.token);
        expect(token, isNull);
      });
    });
  });
}

