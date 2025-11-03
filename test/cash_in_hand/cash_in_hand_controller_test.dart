import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:stackfood_multivendor_driver/feature/cash_in_hand/controllers/cash_in_hand_controller.dart';
import 'package:stackfood_multivendor_driver/feature/cash_in_hand/domain/services/cash_in_hand_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/cash_in_hand/domain/models/wallet_payment_model.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';

import 'cash_in_hand_controller_test.mocks.dart';

@GenerateMocks([CashInHandServiceInterface, ProfileController])
void main() {
  group('CashInHandController Tests', () {
    late CashInHandController cashInHandController;
    late MockCashInHandServiceInterface mockCashInHandService;
    late MockProfileController mockProfileController;

    setUpAll(() {
      Get.testMode = true;
    });

    setUp(() {
      mockCashInHandService = MockCashInHandServiceInterface();
      mockProfileController = MockProfileController();
      cashInHandController = CashInHandController(
        cashInHandServiceInterface: mockCashInHandService,
      );

      // Register mock ProfileController
      Get.put<ProfileController>(mockProfileController);
    });

    tearDown(() {
      Get.reset();
    });

    group('Initialization', () {
      test('Should initialize with default values', () {
        expect(cashInHandController.transactions, isNull);
        expect(cashInHandController.isLoading, false);
        expect(cashInHandController.digitalPaymentName, isNull);
        expect(cashInHandController.paymentIndex, 0);
      });
    });

    group('Get Wallet Payment List', () {
      test('Should successfully get wallet payment list', () async {
        // Arrange
        final mockTransactions = [
          Transactions(
            id: 1,
            amount: 100.0,
            method: 'cash',
            createdAt: '2024-01-01T10:00:00.000Z',
            type: 'collect_cash',
          ),
          Transactions(
            id: 2,
            amount: 50.0,
            method: 'digital',
            createdAt: '2024-01-02T10:00:00.000Z',
            type: 'collect_cash',
          ),
        ];
        when(mockCashInHandService.getWalletPaymentList())
            .thenAnswer((_) async => mockTransactions);

        // Act
        await cashInHandController.getWalletPaymentList();

        // Assert
        expect(cashInHandController.transactions, isNotNull);
        expect(cashInHandController.transactions!.length, 2);
        verify(mockCashInHandService.getWalletPaymentList()).called(1);
      });

      test('Should handle null wallet payment list', () async {
        // Arrange
        when(mockCashInHandService.getWalletPaymentList())
            .thenAnswer((_) async => null);

        // Act
        await cashInHandController.getWalletPaymentList();

        // Assert
        expect(cashInHandController.transactions, isNull);
      });

      test('Should handle empty wallet payment list', () async {
        // Arrange
        when(mockCashInHandService.getWalletPaymentList())
            .thenAnswer((_) async => <Transactions>[]);

        // Act
        await cashInHandController.getWalletPaymentList();

        // Assert
        expect(cashInHandController.transactions, isEmpty);
      });
    });

    group('Make Collect Cash Payment', () {
      test('Should successfully make collect cash payment', () async {
        // Arrange
        const amount = 100.0;
        const paymentGateway = 'stripe';
        final mockResponse = ResponseModel(true, 'Payment successful');
        when(mockCashInHandService.makeCollectCashPayment(amount, paymentGateway))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await cashInHandController.makeCollectCashPayment(amount, paymentGateway);

        // Assert
        expect(result.isSuccess, true);
        expect(result.message, 'Payment successful');
        expect(cashInHandController.isLoading, false);
        verify(mockCashInHandService.makeCollectCashPayment(amount, paymentGateway)).called(1);
      });

      test('Should handle collect cash payment failure', () async {
        // Arrange
        const amount = 100.0;
        const paymentGateway = 'stripe';
        final mockResponse = ResponseModel(false, 'Payment failed');
        when(mockCashInHandService.makeCollectCashPayment(amount, paymentGateway))
            .thenAnswer((_) async => mockResponse);

        // Act
        final result = await cashInHandController.makeCollectCashPayment(amount, paymentGateway);

        // Assert
        expect(result.isSuccess, false);
        expect(result.message, 'Payment failed');
        expect(cashInHandController.isLoading, false);
      });

      test('Should set loading state correctly during payment', () async {
        // Arrange
        const amount = 100.0;
        const paymentGateway = 'stripe';
        final mockResponse = ResponseModel(true, 'Payment successful');
        when(mockCashInHandService.makeCollectCashPayment(amount, paymentGateway))
            .thenAnswer((_) async {
          await Future.delayed(const Duration(milliseconds: 10));
          return mockResponse;
        });

        // Act
        final future = cashInHandController.makeCollectCashPayment(amount, paymentGateway);

        // Brief delay to allow the loading state to be set
        await Future.delayed(const Duration(milliseconds: 5));

        // Assert - loading should be true during the call
        expect(cashInHandController.isLoading, true);

        await future;

        // Assert - loading should be false after completion
        expect(cashInHandController.isLoading, false);
      });
    });

    group('Make Wallet Adjustment', () {
      test('Should successfully make wallet adjustment', () async {
        // Arrange
        final mockResponse = ResponseModel(true, 'Wallet adjusted successfully');
        when(mockCashInHandService.makeWalletAdjustment())
            .thenAnswer((_) async => mockResponse);
        when(mockProfileController.getProfile()).thenAnswer((_) async {});

        // Act
        await cashInHandController.makeWalletAdjustment();

        // Assert
        expect(cashInHandController.isLoading, false);
        verify(mockCashInHandService.makeWalletAdjustment()).called(1);
        verify(mockProfileController.getProfile()).called(1);
      });

      test('Should handle wallet adjustment failure', () async {
        // Arrange
        final mockResponse = ResponseModel(false, 'Adjustment failed');
        when(mockCashInHandService.makeWalletAdjustment())
            .thenAnswer((_) async => mockResponse);

        // Act
        await cashInHandController.makeWalletAdjustment();

        // Assert
        expect(cashInHandController.isLoading, false);
        verify(mockCashInHandService.makeWalletAdjustment()).called(1);
        verifyNever(mockProfileController.getProfile());
      });
    });

    group('Set Payment Index', () {
      test('Should set payment index', () {
        // Act
        cashInHandController.setPaymentIndex(1);

        // Assert
        expect(cashInHandController.paymentIndex, 1);
      });

      test('Should update payment index multiple times', () {
        // Act & Assert
        cashInHandController.setPaymentIndex(0);
        expect(cashInHandController.paymentIndex, 0);

        cashInHandController.setPaymentIndex(2);
        expect(cashInHandController.paymentIndex, 2);

        cashInHandController.setPaymentIndex(1);
        expect(cashInHandController.paymentIndex, 1);
      });
    });

    group('Change Digital Payment Name', () {
      test('Should change digital payment name', () {
        // Act
        cashInHandController.changeDigitalPaymentName('stripe', canUpdate: false);

        // Assert
        expect(cashInHandController.digitalPaymentName, 'stripe');
      });

      test('Should change digital payment name with update', () {
        // Act
        cashInHandController.changeDigitalPaymentName('paypal');

        // Assert
        expect(cashInHandController.digitalPaymentName, 'paypal');
      });

      test('Should change digital payment name to null', () {
        // Arrange
        cashInHandController.changeDigitalPaymentName('stripe', canUpdate: false);
        expect(cashInHandController.digitalPaymentName, 'stripe');

        // Act
        cashInHandController.changeDigitalPaymentName(null, canUpdate: false);

        // Assert
        expect(cashInHandController.digitalPaymentName, isNull);
      });
    });
  });
}
