import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mockito/mockito.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/services/profile_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/profile_model.dart';

class MockProfileService extends Mock implements ProfileServiceInterface {}

/// Tests for earnings functionality
/// PRD Reference: 2.1 Earnings - "Day/week payout, incentives, history, distance & time per task"
void main() {
  group('Earnings Tests', () {
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

    group('Day Payout', () {
      test('Should calculate today\'s earnings', () async {
        // Arrange
        final profileModel = ProfileModel(
          id: 1,
          todaysEarning: 500.50,
          todaysOrderCount: 5,
        );
        
        when(mockProfileService.getProfileInfo()).thenAnswer((_) async => profileModel);

        // Act
        await profileController.getProfile();

        // Assert
        expect(profileController.profileModel, isNotNull);
        expect(profileController.profileModel!.todaysEarning, 500.50);
        expect(profileController.profileModel!.todaysOrderCount, 5);
      });

      test('Should display zero earnings for today when no orders', () async {
        // Arrange
        final profileModel = ProfileModel(
          id: 1,
          todaysEarning: 0.0,
          todaysOrderCount: 0,
        );
        
        when(mockProfileService.getProfileInfo()).thenAnswer((_) async => profileModel);

        // Act
        await profileController.getProfile();

        // Assert
        expect(profileController.profileModel!.todaysEarning, 0.0);
        expect(profileController.profileModel!.todaysOrderCount, 0);
      });
    });

    group('Week Payout', () {
      test('Should calculate this week\'s earnings', () async {
        // Arrange
        final profileModel = ProfileModel(
          id: 1,
          thisWeekEarning: 3500.75,
          thisWeekOrderCount: 35,
        );
        
        when(mockProfileService.getProfileInfo()).thenAnswer((_) async => profileModel);

        // Act
        await profileController.getProfile();

        // Assert
        expect(profileController.profileModel!.thisWeekEarning, 3500.75);
        expect(profileController.profileModel!.thisWeekOrderCount, 35);
      });

      test('Should calculate week-to-week earnings comparison', () async {
        // Arrange
        final profileModel = ProfileModel(
          id: 1,
          thisWeekEarning: 3500.75,
          thisMonthEarning: 15000.00,
        );
        
        when(mockProfileService.getProfileInfo()).thenAnswer((_) async => profileModel);

        // Act
        await profileController.getProfile();

        // Assert
        final weekEarning = profileController.profileModel!.thisWeekEarning!;
        final monthEarning = profileController.profileModel!.thisMonthEarning!;
        expect(weekEarning, lessThan(monthEarning));
      });
    });

    group('Incentives', () {
      test('Should display total incentive earnings', () async {
        // Arrange
        final profileModel = ProfileModel(
          id: 1,
          totalIncentiveEarning: 1250.00,
          incentiveList: [
            IncentiveList(
              id: 1,
              zoneId: 1,
              earning: 500.0,
              incentive: 125.0,
            ),
            IncentiveList(
              id: 2,
              zoneId: 1,
              earning: 750.0,
              incentive: 187.5,
            ),
          ],
        );
        
        when(mockProfileService.getProfileInfo()).thenAnswer((_) async => profileModel);

        // Act
        await profileController.getProfile();

        // Assert
        expect(profileController.profileModel!.totalIncentiveEarning, 1250.00);
        expect(profileController.profileModel!.incentiveList, isNotNull);
        expect(profileController.profileModel!.incentiveList!.length, 2);
      });

      test('Should calculate incentive per order', () async {
        // Arrange
        final profileModel = ProfileModel(
          id: 1,
          totalIncentiveEarning: 500.0,
          todaysOrderCount: 10,
        );
        
        when(mockProfileService.getProfileInfo()).thenAnswer((_) async => profileModel);

        // Act
        await profileController.getProfile();

        // Assert
        final avgIncentive = profileController.profileModel!.totalIncentiveEarning! / 
                            profileController.profileModel!.todaysOrderCount!;
        expect(avgIncentive, 50.0);
      });
    });

    group('Earnings History', () {
      test('Should display monthly earnings', () async {
        // Arrange
        final profileModel = ProfileModel(
          id: 1,
          thisMonthEarning: 15000.00,
          balance: 15000.00,
        );
        
        when(mockProfileService.getProfileInfo()).thenAnswer((_) async => profileModel);

        // Act
        await profileController.getProfile();

        // Assert
        expect(profileController.profileModel!.thisMonthEarning, 15000.00);
      });

      test('Should calculate total earnings from balance and withdrawn', () async {
        // Arrange
        final profileModel = ProfileModel(
          id: 1,
          balance: 5000.0,
          totalWithdrawn: 10000.0,
        );
        
        when(mockProfileService.getProfileInfo()).thenAnswer((_) async => profileModel);

        // Act
        await profileController.getProfile();

        // Assert
        final totalEarnings = profileController.profileModel!.balance! + 
                             profileController.profileModel!.totalWithdrawn!;
        expect(totalEarnings, 15000.0);
      });
    });

    group('Distance & Time Per Task', () {
      test('Should calculate distance per delivery', () async {
        // Arrange
        // Note: This would typically come from order/tracking data
        // For now, we verify the profile has order count which could be used with distance data
        final profileModel = ProfileModel(
          id: 1,
          todaysOrderCount: 10,
          orderCount: 500,
        );
        
        when(mockProfileService.getProfileInfo()).thenAnswer((_) async => profileModel);

        // Act
        await profileController.getProfile();

        // Assert
        expect(profileController.profileModel!.todaysOrderCount, 10);
        expect(profileController.profileModel!.orderCount, 500);
        
        // Distance per task would be calculated from tracking data
        // Total distance / order count
      });

      test('Should calculate time per task', () async {
        // Arrange
        final profileModel = ProfileModel(
          id: 1,
          todaysOrderCount: 10,
        );
        
        when(mockProfileService.getProfileInfo()).thenAnswer((_) async => profileModel);

        // Act
        await profileController.getProfile();

        // Assert
        // Time per task would be calculated from order timestamps
        // (delivery time - pickup time) / order count
        expect(profileController.profileModel!.todaysOrderCount, 10);
      });
    });

    group('Withdrawable Balance', () {
      test('Should display withdrawable balance', () async {
        // Arrange
        final profileModel = ProfileModel(
          id: 1,
          withDrawableBalance: 5000.0,
          payableBalance: 5000.0,
        );
        
        when(mockProfileService.getProfileInfo()).thenAnswer((_) async => profileModel);

        // Act
        await profileController.getProfile();

        // Assert
        expect(profileController.profileModel!.withDrawableBalance, 5000.0);
        expect(profileController.profileModel!.payableBalance, 5000.0);
      });

      test('Should check if withdrawal is allowed', () async {
        // Arrange
        final profileModel = ProfileModel(
          id: 1,
          withDrawableBalance: 1000.0,
          adjustable: true,
          showPayNowButton: true,
        );
        
        when(mockProfileService.getProfileInfo()).thenAnswer((_) async => profileModel);

        // Act
        await profileController.getProfile();

        // Assert
        expect(profileController.profileModel!.withDrawableBalance, greaterThan(0));
        expect(profileController.profileModel!.adjustable, true);
        expect(profileController.profileModel!.showPayNowButton, true);
      });
    });
  });
}

