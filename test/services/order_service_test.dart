import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/services/order_service.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/repositories/order_repository_interface.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/order_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/models/update_status_body.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:image_picker/image_picker.dart';

class MockOrderRepository extends Mock implements OrderRepositoryInterface {}

void main() {
  group('OrderService Tests', () {
    late OrderService orderService;
    late MockOrderRepository mockRepository;

    setUp(() {
      mockRepository = MockOrderRepository();
      orderService = OrderService(orderRepositoryInterface: mockRepository);
    });

    group('Get Latest Orders', () {
      test('Should return latest orders from repository', () async {
        // Arrange
        final mockOrders = [
          OrderModel(id: 1, orderStatus: 'pending'),
          OrderModel(id: 2, orderStatus: 'accepted'),
        ];
        when(mockRepository.getLatestOrders()).thenAnswer((_) async => mockOrders);

        // Act
        final result = await orderService.getLatestOrders();

        // Assert
        expect(result, isNotNull);
        verify(mockRepository.getLatestOrders()).called(1);
      });
    });

    group('Get Current Orders', () {
      test('Should return current orders with status filter', () async {
        // Arrange
        final mockOrders = [
          OrderModel(id: 1, orderStatus: 'accepted'),
        ];
        when(mockRepository.getCurrentOrders(status: 'accepted'))
            .thenAnswer((_) async => mockOrders);

        // Act
        final result = await orderService.getCurrentOrders(status: 'accepted');

        // Assert
        expect(result, isNotNull);
        verify(mockRepository.getCurrentOrders(status: 'accepted')).called(1);
      });
    });

    group('Accept Order', () {
      test('Should accept order via repository', () async {
        // Arrange
        final orderId = 1;
        final mockResponse = ResponseModel(true, 'Order accepted');
        when(mockRepository.acceptOrder(orderId))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await orderService.acceptOrder(orderId);

        // Assert
        expect(result.isSuccess, true);
        verify(mockRepository.acceptOrder(orderId)).called(1);
      });
    });

    group('Update Order Status', () {
      test('Should update order status via repository', () async {
        // Arrange
        final updateStatusBody = UpdateStatusBody(orderId: 1, status: 'picked_up');
        final attachments = <MultipartBody>[];
        final mockResponse = ResponseModel(true, 'Status updated');
        when(mockRepository.updateOrderStatus(updateStatusBody, attachments))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await orderService.updateOrderStatus(updateStatusBody, attachments);

        // Assert
        expect(result.isSuccess, true);
        verify(mockRepository.updateOrderStatus(updateStatusBody, attachments)).called(1);
      });
    });

    group('Process Latest Orders', () {
      test('Should filter out ignored orders', () {
        // Arrange
        final latestOrders = [
          OrderModel(id: 1, orderStatus: 'pending'),
          OrderModel(id: 2, orderStatus: 'pending'),
          OrderModel(id: 3, orderStatus: 'pending'),
        ];
        final ignoredIds = [2];

        // Act
        final result = orderService.processLatestOrders(latestOrders, ignoredIds);

        // Assert
        expect(result.length, 2);
        expect(result.any((order) => order.id == 2), false);
      });
    });
  });
}

