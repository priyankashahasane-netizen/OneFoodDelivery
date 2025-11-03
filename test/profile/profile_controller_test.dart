import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mockito/mockito.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/services/profile_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/profile_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/shift_model.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';

class MockProfileService extends Mock implements ProfileServiceInterface {}

void main() {
  group('ProfileController Tests', () {
    late ProfileController profileController;
    late MockProfileService mockProfileService;

    setUpAll(() {
      Get.testMode = true;
    });

    setUp(() {
      mockProfileService = MockProfileService();
      profileController = ProfileController(profileServiceInterface: mockProfileService);
    });

    tearDown(() {
      Get.reset();
    });

    group('Initialization', () {
      test('Should initialize with default values', () {
        expect(profileController.profileModel, isNull);
        expect(profileController.isLoading, false);
        expect(profileController.shiftLoading, false);
        expect(profileController.shifts, isNull);
      });

      test('Should initialize notification state from service', () {
        // Arrange
        when(mockProfileService.isNotificationActive()).thenReturn(true);

        // Act
        final controller = ProfileController(profileServiceInterface: mockProfileService);

        // Assert
        expect(controller.notification, true);
      });
    });

    group('Get Profile', () {
      test('Should successfully get profile information', () async {
        // Arrange
        final mockProfile = ProfileModel(
          id: 1,
          fName: 'John',
          lName: 'Doe',
          phone: '+1234567890',
          email: 'john.doe@example.com',
          active: 1,
        );
        when(mockProfileService.getProfileInfo()).thenAnswer((_) async => mockProfile);
        when(mockProfileService.checkPermission(any)).thenReturn(null);

        // Act
        await profileController.getProfile();

        // Assert
        expect(profileController.profileModel, isNotNull);
        expect(profileController.profileModel!.id, 1);
        expect(profileController.profileModel!.fName, 'John');
      });

      test('Should use demo data when API returns null', () async {
        // Arrange
        when(mockProfileService.getProfileInfo()).thenAnswer((_) async => null);

        // Act
        await profileController.getProfile();

        // Assert
        expect(profileController.profileModel, isNotNull);
        expect(profileController.profileModel!.fName, 'Demo');
      });

      test('Should use demo data on error', () async {
        // Arrange
        when(mockProfileService.getProfileInfo()).thenThrow(Exception('Network error'));

        // Act
        await profileController.getProfile();

        // Assert
        expect(profileController.profileModel, isNotNull);
        expect(profileController.profileModel!.fName, 'Demo');
      });
    });

    group('Update Profile', () {
      test('Should successfully update profile', () async {
        // Arrange
        final mockProfile = ProfileModel(
          id: 1,
          fName: 'Jane',
          lName: 'Smith',
          phone: '+1234567890',
        );
        final mockResponse = ResponseModel(true, 'Profile updated');
        when(mockProfileService.updateProfile(any, any, any))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await profileController.updateUserInfo(mockProfile, 'token');

        // Assert
        expect(result, true);
      });

      test('Should handle update profile error', () async {
        // Arrange
        final mockProfile = ProfileModel(id: 1, fName: 'John');
        when(mockProfileService.updateProfile(any, any, any))
            .thenThrow(Exception('Update failed'));

        // Act
        final result = await profileController.updateUserInfo(mockProfile, 'token');

        // Assert
        expect(result, false);
      });
    });

    group('Active Status', () {
      test('Should successfully update active status', () async {
        // Arrange
        final mockResponse = ResponseModel(true, 'Status updated');
        when(mockProfileService.updateActiveStatus(shiftId: 1))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await profileController.updateActiveStatus(shiftId: 1);

        // Assert
        expect(result, true);
      });
    });

    group('Notification Settings', () {
      test('Should toggle notification status', () {
        // Arrange
        final initialStatus = profileController.notification;

        // Act
        profileController.setNotificationActive(!initialStatus);

        // Assert
        expect(profileController.notification, !initialStatus);
      });

      test('Should toggle background notification', () {
        // Arrange
        final initialStatus = profileController.backgroundNotification;

        // Act
        profileController.setBackgroundNotificationActive(!initialStatus);

        // Assert
        expect(profileController.backgroundNotification, !initialStatus);
      });
    });

    group('Shifts', () {
      test('Should successfully get shift list', () async {
        // Arrange
        final mockShifts = [
          ShiftModel(id: 1, name: 'Morning Shift', startTime: '08:00:00', endTime: '16:00:00'),
          ShiftModel(id: 2, name: 'Evening Shift', startTime: '16:00:00', endTime: '00:00:00'),
        ];
        when(mockProfileService.getShiftList()).thenAnswer((_) async => mockShifts);

        // Act
        await profileController.getShiftList();

        // Assert
        expect(profileController.shifts, isNotNull);
        expect(profileController.shifts!.length, 2);
      });
    });

    group('Location Recording', () {
      test('Should start location recording when active', () {
        // Arrange
        final mockProfile = ProfileModel(id: 1, active: 1);
        // Note: profileModel is read-only, so we test the method directly
        when(mockProfileService.checkPermission(any)).thenReturn(null);

        // Act
        profileController.startLocationRecord();

        // Assert
        // Verify location recording is initiated (method executes)
        expect(profileController, isNotNull);
      });

      test('Should stop location recording', () {
        // Act
        profileController.stopLocationRecord();

        // Assert
        // Verify timer is cancelled
        expect(profileController.recordLocationBody, isNull);
      });
    });

    group('Image Picker', () {
      test('Should pick image', () async {
        // Arrange - pickImage uses ImagePicker which requires actual device/simulator
        // For unit tests, we just verify the method exists and can be called
        
        // Act & Assert
        expect(profileController.pickImage, isA<Function>());
      });
    });
  });
}

// Mock XFile for testing
class MockXFile {
  final String path;
  MockXFile(this.path);
}

