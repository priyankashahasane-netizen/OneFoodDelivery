import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mockito/mockito.dart';
import 'package:stackfood_multivendor_driver/feature/routes/controllers/route_controller.dart';
import 'package:stackfood_multivendor_driver/feature/routes/domain/services/route_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/routes/domain/models/route_plan_model.dart';

class MockRouteService extends Mock implements RouteServiceInterface {}

void main() {
  group('RouteController Tests', () {
    late RouteController routeController;
    late MockRouteService mockRouteService;

    setUpAll(() {
      Get.testMode = true;
    });

    setUp(() {
      mockRouteService = MockRouteService();
      routeController = RouteController(routeServiceInterface: mockRouteService);
    });

    tearDown(() {
      Get.reset();
    });

    group('Initialization', () {
      test('Should initialize with default values', () {
        expect(routeController.currentRoute, isNull);
        expect(routeController.isOptimizing, false);
      });
    });

    group('Optimize Route', () {
      test('Should successfully optimize route', () async {
        // Arrange
        const driverId = 'driver-1';
        final stops = [
          OptimizeStop(lat: 40.7128, lng: -74.0060, orderId: '1'),
          OptimizeStop(lat: 40.7580, lng: -73.9855, orderId: '2'),
        ];
        final mockRoutePlan = RoutePlanModel(
          id: 'route-1',
          driverId: driverId,
          totalDistanceKm: 10.5,
        );
        when(mockRouteService.optimizeRoute(driverId, stops))
            .thenAnswer((_) async => mockRoutePlan);

        // Act
        final result = await routeController.optimizeRoute(driverId, stops);

        // Assert
        expect(result, isNotNull);
        expect(routeController.currentRoute, isNotNull);
      });

      test('Should handle route optimization error', () async {
        // Arrange
        const driverId = 'driver-1';
        final stops = [
          OptimizeStop(lat: 40.7128, lng: -74.0060, orderId: '1'),
        ];
        when(mockRouteService.optimizeRoute(driverId, stops))
            .thenThrow(Exception('Optimization failed'));

        // Act
        final result = await routeController.optimizeRoute(driverId, stops);

        // Assert
        expect(result, isNull);
      });
    });

    group('Refresh Latest Route', () {
      test('Should successfully refresh latest route', () async {
        // Arrange
        const driverId = 'driver-1';
        final mockRoutePlan = RoutePlanModel(
          id: 'route-1',
          driverId: driverId,
          totalDistanceKm: 5.0,
        );
        when(mockRouteService.getLatestRoute(driverId))
            .thenAnswer((_) async => mockRoutePlan);

        // Act
        await routeController.refreshLatestRoute(driverId);

        // Assert
        expect(routeController.currentRoute, isNotNull);
        expect(routeController.currentRoute!.id, 'route-1');
      });
    });
  });
}

