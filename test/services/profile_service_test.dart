import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/services/profile_service.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/repositories/profile_repository_interface.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/profile_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/record_location_body.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockProfileRepository extends Mock implements ProfileRepositoryInterface {}

void main() {
  group('ProfileService Tests', () {
    late ProfileService profileService;
    late MockProfileRepository mockRepository;
    late SharedPreferences prefs;

    setUpAll(() async {
      SharedPreferences.setMockInitialValues({});
      prefs = await SharedPreferences.getInstance();
    });

    setUp(() {
      mockRepository = MockProfileRepository();
      profileService = ProfileService(profileRepositoryInterface: mockRepository);
    });

    group('Get Profile Info', () {
      test('Should return profile from repository', () async {
        // Arrange
        final mockProfile = ProfileModel(
          id: 1,
          fName: 'John',
          lName: 'Doe',
          phone: '+1234567890',
        );
        when(mockRepository.getProfileInfo()).thenAnswer((_) async => mockProfile);

        // Act
        final result = await profileService.getProfileInfo();

        // Assert
        expect(result, isNotNull);
        expect(result!.id, 1);
        verify(mockRepository.getProfileInfo()).called(1);
      });
    });

    group('Update Profile', () {
      test('Should update profile via repository', () async {
        // Arrange
        final profile = ProfileModel(id: 1, fName: 'Jane');
        final mockResponse = ResponseModel(true, 'Profile updated');
        when(mockRepository.updateProfile(profile, null, 'token'))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await profileService.updateProfile(profile, null, 'token');

        // Assert
        expect(result?.isSuccess, true);
        verify(mockRepository.updateProfile(profile, null, 'token')).called(1);
      });
    });

    group('Update Active Status', () {
      test('Should update active status via repository', () async {
        // Arrange
        final mockResponse = ResponseModel(true, 'Status updated');
        when(mockRepository.updateActiveStatus(shiftId: 1))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await profileService.updateActiveStatus(shiftId: 1);

        // Assert
        expect(result?.isSuccess, true);
        verify(mockRepository.updateActiveStatus(shiftId: 1)).called(1);
      });
    });

    group('Notification Settings', () {
      test('Should save and retrieve notification status', () {
        // Arrange
        profileService.setNotificationActive(true);

        // Act
        final result = profileService.isNotificationActive();

        // Assert
        expect(result, true);
      });

      test('Should toggle notification status', () {
        // Arrange
        profileService.setNotificationActive(true);

        // Act
        profileService.setNotificationActive(false);

        // Assert
        expect(profileService.isNotificationActive(), false);
      });
    });
  });
}

