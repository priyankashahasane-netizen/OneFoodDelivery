import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mockito/mockito.dart';
import 'package:stackfood_multivendor_driver/feature/notification/controllers/notification_controller.dart';
import 'package:stackfood_multivendor_driver/feature/notification/domain/services/notification_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/notification/domain/models/notification_model.dart';

class MockNotificationService extends Mock implements NotificationServiceInterface {}

void main() {
  group('NotificationController Tests', () {
    late NotificationController notificationController;
    late MockNotificationService mockNotificationService;

    setUpAll(() {
      Get.testMode = true;
    });

    setUp(() {
      mockNotificationService = MockNotificationService();
      notificationController = NotificationController(
        notificationServiceInterface: mockNotificationService,
      );
    });

    tearDown(() {
      Get.reset();
    });

    group('Initialization', () {
      test('Should initialize with empty notification list', () {
        expect(notificationController.notificationList, isNull);
        expect(notificationController.hideNotificationButton, false);
      });
    });

    group('Get Notifications', () {
      test('Should successfully get notification list', () async {
        // Arrange
        final mockNotifications = [
          NotificationModel(
            id: 1,
            title: 'New Order',
            description: 'You have a new order',
            createdAt: '2024-01-01T10:00:00.000Z',
            updatedAt: '2024-01-01T10:00:00.000Z',
          ),
          NotificationModel(
            id: 2,
            title: 'Order Completed',
            description: 'Order #123 has been completed',
            createdAt: '2024-01-01T11:00:00.000Z',
            updatedAt: '2024-01-01T11:00:00.000Z',
          ),
        ];
        when(mockNotificationService.getNotificationList())
            .thenAnswer((_) async => mockNotifications);

        // Act
        await notificationController.getNotificationList();

        // Assert
        expect(notificationController.notificationList, isNotNull);
        expect(notificationController.notificationList!.length, 2);
        verify(mockNotificationService.getNotificationList()).called(1);
      });

      test('Should handle null notification list', () async {
        // Arrange
        when(mockNotificationService.getNotificationList())
            .thenAnswer((_) async => null);

        // Act
        await notificationController.getNotificationList();

        // Assert
        expect(notificationController.notificationList, isNull);
      });

      test('Should handle empty notification list', () async {
        // Arrange
        when(mockNotificationService.getNotificationList())
            .thenAnswer((_) async => <NotificationModel>[]);

        // Act
        await notificationController.getNotificationList();

        // Assert
        expect(notificationController.notificationList, isEmpty);
      });

      test('Should sort notifications by updatedAt in descending order', () async {
        // Arrange
        final mockNotifications = [
          NotificationModel(
            id: 1,
            title: 'Oldest',
            description: 'Oldest notification',
            createdAt: '2024-01-01T08:00:00.000Z',
            updatedAt: '2024-01-01T08:00:00.000Z',
          ),
          NotificationModel(
            id: 2,
            title: 'Newest',
            description: 'Newest notification',
            createdAt: '2024-01-01T12:00:00.000Z',
            updatedAt: '2024-01-01T12:00:00.000Z',
          ),
          NotificationModel(
            id: 3,
            title: 'Middle',
            description: 'Middle notification',
            createdAt: '2024-01-01T10:00:00.000Z',
            updatedAt: '2024-01-01T10:00:00.000Z',
          ),
        ];
        when(mockNotificationService.getNotificationList())
            .thenAnswer((_) async => mockNotifications);

        // Act
        await notificationController.getNotificationList();

        // Assert
        expect(notificationController.notificationList, isNotNull);
        expect(notificationController.notificationList!.length, 3);
        // Should be sorted in descending order (newest first)
        expect(notificationController.notificationList![0].id, 2);
        expect(notificationController.notificationList![1].id, 3);
        expect(notificationController.notificationList![2].id, 1);
      });
    });

    group('Send Delivered Notification', () {
      test('Should successfully send delivered notification', () async {
        // Arrange
        const orderId = 123;
        when(mockNotificationService.sendDeliveredNotification(orderId))
            .thenAnswer((_) async => true);

        // Act
        final result = await notificationController.sendDeliveredNotification(orderId);

        // Assert
        expect(result, true);
        expect(notificationController.hideNotificationButton, false);
        verify(mockNotificationService.sendDeliveredNotification(orderId)).called(1);
      });

      test('Should handle send delivered notification failure', () async {
        // Arrange
        const orderId = 123;
        when(mockNotificationService.sendDeliveredNotification(orderId))
            .thenAnswer((_) async => false);

        // Act
        final result = await notificationController.sendDeliveredNotification(orderId);

        // Assert
        expect(result, false);
        expect(notificationController.hideNotificationButton, false);
      });

      test('Should set hideNotificationButton during operation', () async {
        // Arrange
        const orderId = 123;
        when(mockNotificationService.sendDeliveredNotification(orderId))
            .thenAnswer((_) async {
          await Future.delayed(const Duration(milliseconds: 10));
          return true;
        });

        // Act
        final future = notificationController.sendDeliveredNotification(orderId);

        // Brief delay to allow the loading state to be set
        await Future.delayed(const Duration(milliseconds: 5));

        // Assert - hideNotificationButton should be true during the call
        expect(notificationController.hideNotificationButton, true);

        await future;

        // Assert - hideNotificationButton should be false after completion
        expect(notificationController.hideNotificationButton, false);
      });
    });

    group('Save Seen Notification Count', () {
      test('Should save seen notification count', () {
        // Arrange
        const count = 5;

        // Act
        notificationController.saveSeenNotificationCount(count);

        // Assert
        verify(mockNotificationService.saveSeenNotificationCount(count)).called(1);
      });

      test('Should save different notification counts', () {
        // Act
        notificationController.saveSeenNotificationCount(0);
        notificationController.saveSeenNotificationCount(10);
        notificationController.saveSeenNotificationCount(100);

        // Assert
        verify(mockNotificationService.saveSeenNotificationCount(0)).called(1);
        verify(mockNotificationService.saveSeenNotificationCount(10)).called(1);
        verify(mockNotificationService.saveSeenNotificationCount(100)).called(1);
      });
    });

    group('Get Seen Notification Count', () {
      test('Should get seen notification count', () {
        // Arrange
        const expectedCount = 5;
        when(mockNotificationService.getSeenNotificationCount())
            .thenReturn(expectedCount);

        // Act
        final result = notificationController.getSeenNotificationCount();

        // Assert
        expect(result, expectedCount);
        verify(mockNotificationService.getSeenNotificationCount()).called(1);
      });

      test('Should handle null seen notification count', () {
        // Arrange
        when(mockNotificationService.getSeenNotificationCount())
            .thenReturn(null);

        // Act
        final result = notificationController.getSeenNotificationCount();

        // Assert
        expect(result, isNull);
      });

      test('Should handle zero seen notification count', () {
        // Arrange
        when(mockNotificationService.getSeenNotificationCount())
            .thenReturn(0);

        // Act
        final result = notificationController.getSeenNotificationCount();

        // Assert
        expect(result, 0);
      });
    });

    group('Add Seen Notification ID', () {
      test('Should add seen notification ID', () {
        // Arrange
        const notificationId = 123;
        when(mockNotificationService.getNotificationIdList())
            .thenReturn([]);

        // Act
        notificationController.addSeenNotificationId(notificationId);

        // Assert
        verify(mockNotificationService.getNotificationIdList()).called(1);
        verify(mockNotificationService.addSeenNotificationIdList([notificationId])).called(1);
      });

      test('Should add multiple seen notification IDs', () {
        // Arrange
        const firstId = 123;
        const secondId = 456;

        // First call returns empty list, second call returns list with firstId
        var callCount = 0;
        when(mockNotificationService.getNotificationIdList()).thenAnswer((_) {
          callCount++;
          return callCount == 1 ? [] : [firstId];
        });

        // Act
        notificationController.addSeenNotificationId(firstId);
        notificationController.addSeenNotificationId(secondId);

        // Assert
        verify(mockNotificationService.addSeenNotificationIdList([firstId])).called(1);
        verify(mockNotificationService.addSeenNotificationIdList([firstId, secondId])).called(1);
      });

      test('Should preserve existing IDs when adding new one', () {
        // Arrange
        const newId = 789;
        const existingIds = [123, 456];
        when(mockNotificationService.getNotificationIdList())
            .thenReturn(existingIds);

        // Act
        notificationController.addSeenNotificationId(newId);

        // Assert
        verify(mockNotificationService.addSeenNotificationIdList([123, 456, 789])).called(1);
      });
    });

    group('Get Seen Notification ID List', () {
      test('Should get seen notification ID list', () {
        // Arrange
        const expectedIds = [123, 456, 789];
        when(mockNotificationService.getNotificationIdList())
            .thenReturn(expectedIds);

        // Act
        final result = notificationController.getSeenNotificationIdList();

        // Assert
        expect(result, expectedIds);
        verify(mockNotificationService.getNotificationIdList()).called(1);
      });

      test('Should handle empty ID list', () {
        // Arrange
        when(mockNotificationService.getNotificationIdList())
            .thenReturn([]);

        // Act
        final result = notificationController.getSeenNotificationIdList();

        // Assert
        expect(result, isEmpty);
      });

      test('Should handle null ID list', () {
        // Arrange
        when(mockNotificationService.getNotificationIdList())
            .thenReturn(<int>[]);

        // Act
        final result = notificationController.getSeenNotificationIdList();

        // Assert
        expect(result, isEmpty);
      });
    });
  });
}
