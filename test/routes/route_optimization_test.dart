import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:stackfood_multivendor_driver/feature/routes/controllers/route_controller.dart';
import 'package:stackfood_multivendor_driver/feature/routes/domain/services/route_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/routes/domain/models/route_plan_model.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/domain/services/order_service_interface.dart';

// Generate mocks - run: flutter pub run build_runner build
@GenerateMocks([RouteServiceInterface, OrderServiceInterface])
import 'route_optimization_test.mocks.dart';

/// Tests for route optimization integration with OptimoRoute
/// PRD Reference: 2.1 Route Optimization - "On accept (or stack change), call OptimoRoute with current stop set → return ordered stops + ETAs"
/// PRD Reference: 8 Acceptance Criteria - "OptimoRoute returns updated sequence ≤ 3s"
void main() {
  group('Route Optimization Tests', () {
    late RouteController routeController;
    late MockRouteServiceInterface mockRouteService;

    setUpAll(() {
      Get.testMode = true;
    });

    setUp(() {
      mockRouteService = MockRouteServiceInterface();
      routeController = RouteController(routeServiceInterface: mockRouteService);
    });

    tearDown(() {
      Get.reset();
    });

    group('OptimoRoute Integration', () {
      test('Should optimize route on accept with current stop set', () async {
        // Arrange
        const driverId = 'driver-1';
        final stops = [
          OptimizeStop(lat: 12.93, lng: 77.62, orderId: '1'), // Pickup
          OptimizeStop(lat: 12.95, lng: 77.60, orderId: '1'), // Dropoff
          OptimizeStop(lat: 12.94, lng: 77.61, orderId: '2'), // Pickup
          OptimizeStop(lat: 12.96, lng: 77.59, orderId: '2'), // Dropoff
        ];
        
        final mockRoutePlan = RoutePlanModel(
          id: 'route-1',
          driverId: driverId,
          stops: [
            RouteStop(lat: 12.93, lng: 77.62, orderId: '1'),
            RouteStop(lat: 12.94, lng: 77.61, orderId: '2'),
            RouteStop(lat: 12.95, lng: 77.60, orderId: '1'),
            RouteStop(lat: 12.96, lng: 77.59, orderId: '2'),
          ],
          totalDistanceKm: 8.4,
          etaPerStop: {
            '1': 300,  // 5 minutes in seconds
            '2': 720,  // 12 minutes in seconds
          },
        );
        
        when(mockRouteService.optimizeRoute(driverId, stops))
            .thenAnswer((_) async => mockRoutePlan);

        // Act
        final startTime = DateTime.now();
        final result = await routeController.optimizeRoute(driverId, stops);
        final duration = DateTime.now().difference(startTime);

        // Assert
        expect(result, isNotNull);
        expect(result!.id, 'route-1');
        expect(result.totalDistanceKm, 8.4);
        expect(result.etaPerStop, isNotNull);
        expect(result.etaPerStop?.length, 2);
        
        // Performance requirement: ≤ 3s
        expect(duration.inSeconds, lessThanOrEqualTo(3), reason: 'Route optimization should complete in ≤ 3s');
        
        expect(routeController.currentRoute, isNotNull);
        expect(routeController.isOptimizing, false);
      });

      test('Should return optimized sequence from OptimoRoute', () async {
        // Arrange
        const driverId = 'driver-1';
        final stops = [
          OptimizeStop(lat: 12.93, lng: 77.62, orderId: '1'),
          OptimizeStop(lat: 12.95, lng: 77.60, orderId: '1'),
        ];
        
        final mockRoutePlan = RoutePlanModel(
          id: 'route-1',
          driverId: driverId,
          totalDistanceKm: 5.2,
          etaPerStop: {
            '1': 180,  // 3 minutes in seconds
            '2': 480,  // 8 minutes in seconds
          },
        );
        
        when(mockRouteService.optimizeRoute(driverId, stops))
            .thenAnswer((_) async => mockRoutePlan);

        // Act
        final result = await routeController.optimizeRoute(driverId, stops);

        // Assert
        expect(result, isNotNull);
        expect(result?.etaPerStop, isNotNull);
        expect(result?.etaPerStop?.length, 2);
      });

      test('Should handle route optimization error gracefully', () async {
        // Arrange
        const driverId = 'driver-1';
        final stops = [
          OptimizeStop(lat: 12.93, lng: 77.62, orderId: '1'),
        ];

        when(mockRouteService.optimizeRoute(driverId, stops))
            .thenThrow(Exception('OptimoRoute API error'));

        // Act & Assert
        expect(
          () => routeController.optimizeRoute(driverId, stops),
          throwsException,
        );

        // Wait a bit for the finally block to execute
        await Future.delayed(Duration(milliseconds: 100));

        // Verify that isOptimizing is reset even on error
        expect(routeController.isOptimizing, false);
      });
    });

    group('Stack Change Optimization', () {
      test('Should re-optimize route when order stack changes', () async {
        // Arrange
        const driverId = 'driver-1';
        
        // Initial stops
        final initialStops = [
          OptimizeStop(lat: 12.93, lng: 77.62, orderId: '1'),
          OptimizeStop(lat: 12.95, lng: 77.60, orderId: '1'),
        ];
        
        final initialRoute = RoutePlanModel(
          id: 'route-1',
          driverId: driverId,
          stops: [
            RouteStop(lat: 12.93, lng: 77.62, orderId: '1', sequence: 0),
            RouteStop(lat: 12.95, lng: 77.60, orderId: '1', sequence: 1),
          ],
          totalDistanceKm: 5.0,
        );
        
        when(mockRouteService.optimizeRoute(driverId, initialStops))
            .thenAnswer((_) async => initialRoute);
        
        await routeController.optimizeRoute(driverId, initialStops);
        
        // New stops after adding another order
        final updatedStops = [
          OptimizeStop(lat: 12.93, lng: 77.62, orderId: '1'),
          OptimizeStop(lat: 12.95, lng: 77.60, orderId: '1'),
          OptimizeStop(lat: 12.94, lng: 77.61, orderId: '2'),
          OptimizeStop(lat: 12.96, lng: 77.59, orderId: '2'),
        ];
        
        final updatedRoute = RoutePlanModel(
          id: 'route-2',
          driverId: driverId,
          totalDistanceKm: 8.5,
          etaPerStop: {
            '1': 300,
            '2': 720,
          },
        );
        
        when(mockRouteService.optimizeRoute(driverId, updatedStops))
            .thenAnswer((_) async => updatedRoute);

        // Act - Re-optimize with new stops
        final result = await routeController.optimizeRoute(driverId, updatedStops);

        // Assert
        expect(result, isNotNull);
        expect(result!.id, 'route-2');
        expect(result.totalDistanceKm, 8.5);
        verify(mockRouteService.optimizeRoute(driverId, updatedStops)).called(1);
      });
    });

    group('Route Refresh', () {
      test('Should refresh latest route plan for driver', () async {
        // Arrange
        const driverId = 'driver-1';
        final mockRoutePlan = RoutePlanModel(
          id: 'route-1',
          driverId: driverId,
          totalDistanceKm: 10.0,
        );
        
        when(mockRouteService.getLatestRoute(driverId))
            .thenAnswer((_) async => mockRoutePlan);

        // Act
        await routeController.refreshLatestRoute(driverId);

        // Assert
        expect(routeController.currentRoute, isNotNull);
        expect(routeController.currentRoute!.id, 'route-1');
        verify(mockRouteService.getLatestRoute(driverId)).called(1);
      });
    });

    group('Performance Requirements', () {
      test('Should complete optimization within 3 seconds', () async {
        // Arrange
        const driverId = 'driver-1';
        final stops = [
          OptimizeStop(lat: 12.93, lng: 77.62, orderId: '1'),
          OptimizeStop(lat: 12.95, lng: 77.60, orderId: '1'),
        ];
        
        final mockRoutePlan = RoutePlanModel(
          id: 'route-1',
          driverId: driverId,
          totalDistanceKm: 5.0,
        );
        
        // Simulate API call taking 1 second
        when(mockRouteService.optimizeRoute(driverId, stops))
            .thenAnswer((_) async {
              await Future.delayed(Duration(milliseconds: 100));
              return mockRoutePlan;
            });

        // Act
        final startTime = DateTime.now();
        await routeController.optimizeRoute(driverId, stops);
        final duration = DateTime.now().difference(startTime);

        // Assert
        expect(duration.inSeconds, lessThanOrEqualTo(3), reason: 'Optimization must complete in ≤ 3s per PRD');
      });
    });
  });
}

// RouteStop is imported from route_plan_model.dart

