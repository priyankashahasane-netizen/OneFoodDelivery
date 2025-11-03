import 'package:flutter_test/flutter_test.dart';

// Auth Tests
import 'auth/auth_test.dart' as auth_test;
import 'auth/auth_integration_test.dart' as auth_integration_test;
import 'auth/otp_login_test.dart' as otp_login_test;

// Controller Tests
import 'order/order_controller_test.dart' as order_controller_test;
import 'order/multi_order_stacking_test.dart' as multi_order_stacking_test;
import 'order/pod_complete_test.dart' as pod_complete_test;
import 'profile/profile_controller_test.dart' as profile_controller_test;
import 'profile/earnings_test.dart' as earnings_test;
import 'splash/splash_controller_test.dart' as splash_controller_test;
import 'chat/chat_controller_test.dart' as chat_controller_test;
import 'cash_in_hand/cash_in_hand_controller_test.dart' as cash_in_hand_controller_test;
import 'disbursements/disbursement_controller_test.dart' as disbursement_controller_test;
import 'notification/notification_controller_test.dart' as notification_controller_test;
import 'language/localization_controller_test.dart' as localization_controller_test;
import 'forgot_password/forgot_password_controller_test.dart' as forgot_password_controller_test;
import 'routes/route_controller_test.dart' as route_controller_test;
import 'routes/route_optimization_test.dart' as route_optimization_test;

// Service Tests
import 'services/order_service_test.dart' as order_service_test;
import 'services/profile_service_test.dart' as profile_service_test;

// Repository Tests
import 'repositories/auth_repository_test.dart' as auth_repository_test;

// Widget Tests
import 'widgets/sign_in_screen_test.dart' as sign_in_screen_test;
import 'widgets/dashboard_screen_test.dart' as dashboard_screen_test;

// Integration Tests
import 'integration/app_flow_test.dart' as app_flow_test;
import 'integration/openstreetmap_verification_test.dart' as openstreetmap_verification_test;

// Tracking Tests
import 'tracking/tracking_link_test.dart' as tracking_link_test;
import 'tracking/live_tracking_test.dart' as live_tracking_test;

// Integration Failure Tests
import 'integration_failures/optimoroute_failures_test.dart' as optimoroute_failures_test;
import 'integration_failures/ipstack_failures_test.dart' as ipstack_failures_test;
import 'integration_failures/nominatim_failures_test.dart' as nominatim_failures_test;
import 'integration_failures/openstreetmap_config_verification_test.dart' as openstreetmap_config_verification_test;

// Network Failure Tests
import 'network_failures/connectivity_failures_test.dart' as connectivity_failures_test;

// Performance Failure Tests
import 'performance_failures/timeout_failures_test.dart' as timeout_failures_test;

// Location Failure Tests
import 'location_failures/gps_tracking_failures_test.dart' as gps_tracking_failures_test;

// Realtime Failure Tests
import 'realtime_failures/websocket_sse_failures_test.dart' as websocket_sse_failures_test;

// Race Condition Tests
import 'race_conditions/concurrency_failures_test.dart' as concurrency_failures_test;

// Data Validation Tests
import 'data_validation/edge_cases_test.dart' as edge_cases_test;

// Authentication Failure Tests
import 'auth_failures/authentication_failures_test.dart' as authentication_failures_test;

// POD Failure Tests
import 'pod_failures/proof_of_delivery_failures_test.dart' as proof_of_delivery_failures_test;

/// Main test suite runner
/// Run all tests with: flutter test test/all_tests.dart
void main() {
  group('Complete Test Suite', () {
    group('Auth Tests', () {
      auth_test.main();
      auth_integration_test.main();
      otp_login_test.main();
    });

    group('Controller Tests', () {
      order_controller_test.main();
      multi_order_stacking_test.main();
      pod_complete_test.main();
      profile_controller_test.main();
      earnings_test.main();
      splash_controller_test.main();
      chat_controller_test.main();
      cash_in_hand_controller_test.main();
      disbursement_controller_test.main();
      notification_controller_test.main();
      localization_controller_test.main();
      forgot_password_controller_test.main();
      route_controller_test.main();
      route_optimization_test.main();
    });

    group('Service Tests', () {
      order_service_test.main();
      profile_service_test.main();
    });

    group('Repository Tests', () {
      auth_repository_test.main();
    });

    group('Widget Tests', () {
      sign_in_screen_test.main();
      dashboard_screen_test.main();
    });

    group('Integration Tests', () {
      app_flow_test.main();
      openstreetmap_verification_test.main();
    });

    group('Tracking Tests', () {
      tracking_link_test.main();
      live_tracking_test.main();
    });

    // Failure Scenario Tests
    group('Integration Failure Tests', () {
      optimoroute_failures_test.main();
      ipstack_failures_test.main();
      nominatim_failures_test.main();
      openstreetmap_config_verification_test.main();
    });

    group('Network Failure Tests', () {
      connectivity_failures_test.main();
    });

    group('Performance Failure Tests', () {
      timeout_failures_test.main();
    });

    group('Location Failure Tests', () {
      gps_tracking_failures_test.main();
    });

    group('Realtime Failure Tests', () {
      websocket_sse_failures_test.main();
    });

    group('Race Condition Tests', () {
      concurrency_failures_test.main();
    });

    group('Data Validation Tests', () {
      edge_cases_test.main();
    });

    group('Authentication Failure Tests', () {
      authentication_failures_test.main();
    });

    group('POD Failure Tests', () {
      proof_of_delivery_failures_test.main();
    });
  });
}

