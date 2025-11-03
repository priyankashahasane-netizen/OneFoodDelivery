import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mockito/mockito.dart';
import 'package:stackfood_multivendor_driver/feature/forgot_password/controllers/forgot_password_controller.dart';
import 'package:stackfood_multivendor_driver/feature/forgot_password/domain/services/forgot_password_service_interface.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/profile_model.dart';

class MockForgotPasswordService extends Mock implements ForgotPasswordServiceInterface {}

void main() {
  group('ForgotPasswordController Tests', () {
    late ForgotPasswordController forgotPasswordController;
    late MockForgotPasswordService mockForgotPasswordService;

    setUpAll(() {
      Get.testMode = true;
    });

    setUp(() {
      mockForgotPasswordService = MockForgotPasswordService();
      forgotPasswordController = ForgotPasswordController(
        forgotPasswordServiceInterface: mockForgotPasswordService,
      );
    });

    tearDown(() {
      Get.reset();
    });

    group('Initialization', () {
      test('Should initialize with default values', () {
        expect(forgotPasswordController.isLoading, false);
        expect(forgotPasswordController.verificationCode, '');
      });
    });

    group('Change Password', () {
      test('Should successfully change password', () async {
        // Arrange
        final profileModel = ProfileModel(
          id: 1,
          fName: 'John',
          lName: 'Doe',
          phone: '+1234567890',
        );
        const password = 'NewPass123!';
        final mockResponse = ResponseModel(true, 'Password changed successfully');
        when(mockForgotPasswordService.changePassword(profileModel, password))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await forgotPasswordController.changePassword(profileModel, password);

        // Assert
        expect(result, true);
        expect(forgotPasswordController.isLoading, false);
      });

      test('Should handle change password failure', () async {
        // Arrange
        final profileModel = ProfileModel(
          id: 1,
          fName: 'John',
          lName: 'Doe',
          phone: '+1234567890',
        );
        const password = 'NewPass123!';
        final mockResponse = ResponseModel(false, 'Password change failed');
        when(mockForgotPasswordService.changePassword(profileModel, password))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await forgotPasswordController.changePassword(profileModel, password);

        // Assert
        expect(result, false);
        expect(forgotPasswordController.isLoading, false);
      });
    });

    group('Forgot Password', () {
      test('Should successfully send forgot password request', () async {
        // Arrange
        const email = 'test@example.com';
        final mockResponse = ResponseModel(true, 'Reset email sent');
        when(mockForgotPasswordService.forgotPassword(email))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await forgotPasswordController.forgotPassword(email);

        // Assert
        expect(result.isSuccess, true);
        expect(forgotPasswordController.isLoading, false);
      });

      test('Should handle forgot password failure', () async {
        // Arrange
        const email = 'invalid@example.com';
        final mockResponse = ResponseModel(false, 'Email not found');
        when(mockForgotPasswordService.forgotPassword(email))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await forgotPasswordController.forgotPassword(email);

        // Assert
        expect(result.isSuccess, false);
        expect(forgotPasswordController.isLoading, false);
      });
    });

    group('Reset Password', () {
      test('Should successfully reset password', () async {
        // Arrange
        const resetToken = 'token123';
        const phone = '+1234567890';
        const password = 'NewPass123!';
        const confirmPassword = 'NewPass123!';
        final mockResponse = ResponseModel(true, 'Password reset successfully');
        when(mockForgotPasswordService.resetPassword(resetToken, phone, password, confirmPassword))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await forgotPasswordController.resetPassword(resetToken, phone, password, confirmPassword);

        // Assert
        expect(result.isSuccess, true);
        expect(forgotPasswordController.isLoading, false);
      });

      test('Should handle reset password failure', () async {
        // Arrange
        const resetToken = 'invalid_token';
        const phone = '+1234567890';
        const password = 'NewPass123!';
        const confirmPassword = 'NewPass123!';
        final mockResponse = ResponseModel(false, 'Invalid reset token');
        when(mockForgotPasswordService.resetPassword(resetToken, phone, password, confirmPassword))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await forgotPasswordController.resetPassword(resetToken, phone, password, confirmPassword);

        // Assert
        expect(result.isSuccess, false);
        expect(forgotPasswordController.isLoading, false);
      });
    });

    group('Verify Token', () {
      test('Should successfully verify token', () async {
        // Arrange
        const phone = '+1234567890';
        const verificationCode = '123456';
        forgotPasswordController.updateVerificationCode(verificationCode, canUpdate: false);
        final mockResponse = ResponseModel(true, 'Token verified');
        when(mockForgotPasswordService.verifyToken(phone, verificationCode))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await forgotPasswordController.verifyToken(phone);

        // Assert
        expect(result.isSuccess, true);
        expect(forgotPasswordController.isLoading, false);
      });

      test('Should handle verify token failure', () async {
        // Arrange
        const phone = '+1234567890';
        const verificationCode = '000000';
        forgotPasswordController.updateVerificationCode(verificationCode, canUpdate: false);
        final mockResponse = ResponseModel(false, 'Invalid verification code');
        when(mockForgotPasswordService.verifyToken(phone, verificationCode))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await forgotPasswordController.verifyToken(phone);

        // Assert
        expect(result.isSuccess, false);
        expect(forgotPasswordController.isLoading, false);
      });
    });

    group('Update Verification Code', () {
      test('Should update verification code', () {
        // Arrange
        const code = '123456';

        // Act
        forgotPasswordController.updateVerificationCode(code, canUpdate: false);

        // Assert
        expect(forgotPasswordController.verificationCode, code);
      });

      test('Should update verification code with update', () {
        // Arrange
        const code = '654321';

        // Act
        forgotPasswordController.updateVerificationCode(code);

        // Assert
        expect(forgotPasswordController.verificationCode, code);
      });
    });

    group('Verify Firebase OTP', () {
      test('Should successfully verify Firebase OTP', () async {
        // Arrange
        const phoneNumber = '+1234567890';
        const session = 'session123';
        const otp = '123456';
        final mockResponse = ResponseModel(true, 'OTP verified');
        when(mockForgotPasswordService.verifyFirebaseOtp(
          phoneNumber: phoneNumber,
          session: session,
          otp: otp,
        )).thenAnswer((_) async => mockResponse);

        // Act
        final result = await forgotPasswordController.verifyFirebaseOtp(
          phoneNumber: phoneNumber,
          session: session,
          otp: otp,
        );

        // Assert
        expect(result.isSuccess, true);
        expect(forgotPasswordController.isLoading, false);
      });

      test('Should handle Firebase OTP verification failure', () async {
        // Arrange
        const phoneNumber = '+1234567890';
        const session = 'session123';
        const otp = '000000';
        final mockResponse = ResponseModel(false, 'Invalid OTP');
        when(mockForgotPasswordService.verifyFirebaseOtp(
          phoneNumber: phoneNumber,
          session: session,
          otp: otp,
        )).thenAnswer((_) async => mockResponse);

        // Act
        final result = await forgotPasswordController.verifyFirebaseOtp(
          phoneNumber: phoneNumber,
          session: session,
          otp: otp,
        );

        // Assert
        expect(result.isSuccess, false);
        expect(forgotPasswordController.isLoading, false);
      });
    });
  });
}
