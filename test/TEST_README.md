# Flutter App Test Suite

This directory contains comprehensive test cases for the entire Flutter driver app.

## Test Structure

```
test/
├── auth/                    # Authentication tests
│   ├── auth_test.dart
│   └── auth_integration_test.dart
├── order/                   # Order management tests
│   └── order_controller_test.dart
├── profile/                 # Profile management tests
│   └── profile_controller_test.dart
├── chat/                    # Chat functionality tests
│   └── chat_controller_test.dart
├── cash_in_hand/           # Cash in hand tests
│   └── cash_in_hand_controller_test.dart
├── disbursements/          # Disbursement tests
│   └── disbursement_controller_test.dart
├── notification/           # Notification tests
│   └── notification_controller_test.dart
├── language/               # Localization tests
│   └── localization_controller_test.dart
├── forgot_password/        # Password recovery tests
│   └── forgot_password_controller_test.dart
├── routes/                 # Route optimization tests
│   └── route_controller_test.dart
├── splash/                 # Splash screen tests
│   └── splash_controller_test.dart
├── services/               # Service layer tests
│   ├── order_service_test.dart
│   └── profile_service_test.dart
├── repositories/           # Repository layer tests
│   └── auth_repository_test.dart
├── widgets/                # Widget tests
│   ├── sign_in_screen_test.dart
│   └── dashboard_screen_test.dart
├── integration/            # Integration tests
│   └── app_flow_test.dart
└── all_tests.dart          # Test suite runner
```

## Running Tests

### Run All Tests
```bash
flutter test
```

### Run Specific Test Suite
```bash
flutter test test/auth/auth_test.dart
flutter test test/order/order_controller_test.dart
flutter test test/integration/app_flow_test.dart
```

### Run Tests with Coverage
```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
```

### Run Only Unit Tests
```bash
flutter test test/auth/ test/order/ test/profile/
```

### Run Only Integration Tests
```bash
flutter test test/integration/
```

## Test Categories

### 1. Unit Tests
- **Controllers**: Test business logic in controllers
- **Services**: Test service layer functionality
- **Repositories**: Test data access layer

### 2. Widget Tests
- **Screens**: Test UI components and user interactions
- **Widgets**: Test reusable widget components

### 3. Integration Tests
- **App Flows**: Test complete user journeys
- **API Integration**: Test with actual backend (optional)

## Test Coverage

### Controllers (11 files)
- ✅ AuthController
- ✅ OrderController
- ✅ ProfileController
- ✅ ChatController
- ✅ CashInHandController
- ✅ DisbursementController
- ✅ NotificationController
- ✅ LocalizationController
- ✅ ForgotPasswordController
- ✅ RouteController
- ✅ SplashController

### Services (2 files)
- ✅ OrderService
- ✅ ProfileService

### Repositories (1 file)
- ✅ AuthRepository

### Widgets (2 files)
- ✅ SignInScreen
- ✅ DashboardScreen

### Integration Tests (1 file)
- ✅ App Flow Integration Tests

## Writing New Tests

### Controller Test Template
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mockito/mockito.dart';
import 'package:stackfood_multivendor_driver/feature/[feature]/controllers/[controller].dart';

class Mock[Service] extends Mock implements [Service]Interface {}

void main() {
  group('[Controller] Tests', () {
    late [Controller] controller;
    late Mock[Service] mockService;

    setUp(() {
      mockService = Mock[Service]();
      controller = [Controller](serviceInterface: mockService);
    });

    test('Should [expected behavior]', () {
      // Arrange
      
      // Act
      
      // Assert
    });
  });
}
```

### Widget Test Template
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/feature/[feature]/screens/[screen].dart';

void main() {
  testWidgets('Should display [screen]', (WidgetTester tester) async {
    await tester.pumpWidget(
      GetMaterialApp(home: [Screen]()),
    );

    expect(find.text('[Expected Text]'), findsOneWidget);
  });
}
```

## Mock Data

Tests use mockito for mocking dependencies. To generate mock classes:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

## Test Best Practices

1. **Arrange-Act-Assert Pattern**: Structure tests clearly
2. **Descriptive Test Names**: Use clear, descriptive test names
3. **Isolated Tests**: Each test should be independent
4. **Mock External Dependencies**: Mock API calls, database, etc.
5. **Test Edge Cases**: Include boundary conditions and error cases
6. **Fast Execution**: Keep tests fast (< 1 second per test)

## Continuous Integration

Tests are configured to run on:
- Pull requests
- Code commits
- Pre-deployment checks

## Known Issues

- Some tests may require backend to be running (integration tests)
- Mockito code generation required before running tests
- Platform-specific tests (iOS/Android) may need device/simulator

## Future Improvements

- [ ] Add more widget tests for all screens
- [ ] Add golden tests for UI regression
- [ ] Add performance tests
- [ ] Add accessibility tests
- [ ] Increase code coverage to 80%+

