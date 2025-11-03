import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mockito/mockito.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/controllers/disbursement_controller.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/domain/services/disbursement_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/domain/models/disbursement_method_model.dart' as disburse;
import 'package:stackfood_multivendor_driver/feature/disbursements/domain/models/withdraw_method_model.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/domain/models/disbursement_report_model.dart' as report;
import 'package:stackfood_multivendor_driver/common/widgets/custom_dropdown_widget.dart';

class MockDisbursementService extends Mock implements DisbursementServiceInterface {}

void main() {
  group('DisbursementController Tests', () {
    late DisbursementController disbursementController;
    late MockDisbursementService mockDisbursementService;

    setUpAll(() {
      Get.testMode = true;
    });

    setUp(() {
      mockDisbursementService = MockDisbursementService();
      disbursementController = DisbursementController(
        disbursementServiceInterface: mockDisbursementService,
      );
    });

    tearDown(() {
      Get.reset();
    });

    group('Initialization', () {
      test('Should initialize with default values', () {
        expect(disbursementController.isLoading, false);
        expect(disbursementController.isDeleteLoading, false);
        expect(disbursementController.selectedMethodIndex, 0);
        expect(disbursementController.widthDrawMethods, isNull);
        expect(disbursementController.disbursementMethodBody, isNull);
        expect(disbursementController.disbursementReportModel, isNull);
      });
    });

    group('Set Method ID', () {
      test('Should set selected method index', () {
        // Act
        disbursementController.setMethodId(2, canUpdate: false);

        // Assert
        expect(disbursementController.selectedMethodIndex, 2);
      });

      test('Should set selected method index with update', () {
        // Act
        disbursementController.setMethodId(3);

        // Assert
        expect(disbursementController.selectedMethodIndex, 3);
      });
    });

    group('Get Withdraw Method List', () {
      test('Should successfully get withdraw method list', () async {
        // Arrange
        final mockMethods = [
          WidthDrawMethodModel(
            id: 1,
            methodName: 'Bank Transfer',
            methodFields: [
              MethodFields(inputName: 'account_number', inputType: 'text', placeholder: 'Account Number'),
              MethodFields(inputName: 'bank_name', inputType: 'text', placeholder: 'Bank Name'),
            ],
          ),
          WidthDrawMethodModel(
            id: 2,
            methodName: 'Mobile Money',
            methodFields: [
              MethodFields(inputName: 'phone_number', inputType: 'text', placeholder: 'Phone Number'),
            ],
          ),
        ];
        when(mockDisbursementService.getWithdrawMethodList())
            .thenAnswer((_) async => mockMethods);

        // Act
        final result = await disbursementController.getWithdrawMethodList();

        // Assert
        expect(result, isNotNull);
        expect(result!.length, 2);
        expect(disbursementController.widthDrawMethods, isNotNull);
        expect(disbursementController.widthDrawMethods!.length, 2);
      });

      test('Should handle null withdraw method list', () async {
        // Arrange
        when(mockDisbursementService.getWithdrawMethodList())
            .thenAnswer((_) async => null);

        // Act
        final result = await disbursementController.getWithdrawMethodList();

        // Assert
        expect(result, isNull);
      });
    });

    group('Get Disbursement Method List', () {
      test('Should successfully get disbursement method list', () async {
        // Arrange
        final mockDisbursementMethods = disburse.DisbursementMethodBody(
          totalSize: 2,
          methods: [
            disburse.Methods(
              id: 1,
              methodName: 'Bank Transfer',
              isDefault: 1,
            ),
            disburse.Methods(
              id: 2,
              methodName: 'Mobile Money',
              isDefault: 0,
            ),
          ],
        );
        when(mockDisbursementService.getDisbursementMethodList())
            .thenAnswer((_) async => mockDisbursementMethods);

        // Act
        final result = await disbursementController.getDisbursementMethodList();

        // Assert
        expect(result, true);
        expect(disbursementController.disbursementMethodBody, isNotNull);
        expect(disbursementController.disbursementMethodBody!.methods!.length, 2);
      });

      test('Should handle null disbursement method list', () async {
        // Arrange
        when(mockDisbursementService.getDisbursementMethodList())
            .thenAnswer((_) async => null);

        // Act
        final result = await disbursementController.getDisbursementMethodList();

        // Assert
        expect(result, false);
        expect(disbursementController.disbursementMethodBody, isNull);
      });
    });

    group('Add Withdraw Method', () {
      test('Should successfully add withdraw method', () async {
        // Arrange
        final methodData = {
          'method_id': '1',
          'account_number': '1234567890',
          'bank_name': 'Test Bank',
        };
        when(mockDisbursementService.addWithdraw(methodData))
            .thenAnswer((_) async => true);
        when(mockDisbursementService.getDisbursementMethodList())
            .thenAnswer((_) async => disburse.DisbursementMethodBody(methods: []));

        // Act
        await disbursementController.addWithdrawMethod(methodData);

        // Assert
        expect(disbursementController.isLoading, false);
        verify(mockDisbursementService.addWithdraw(methodData)).called(1);
      });

      test('Should handle add withdraw method failure', () async {
        // Arrange
        final methodData = {
          'method_id': '1',
          'account_number': '1234567890',
        };
        when(mockDisbursementService.addWithdraw(methodData))
            .thenAnswer((_) async => false);

        // Act
        await disbursementController.addWithdrawMethod(methodData);

        // Assert
        expect(disbursementController.isLoading, false);
      });
    });

    group('Make Default Method', () {
      test('Should successfully make method default', () async {
        // Arrange
        final methodData = {'id': '1'};
        const index = 0;
        when(mockDisbursementService.makeDefaultMethod(methodData))
            .thenAnswer((_) async => true);
        when(mockDisbursementService.getDisbursementMethodList())
            .thenAnswer((_) async => disburse.DisbursementMethodBody(methods: []));

        // Act
        await disbursementController.makeDefaultMethod(methodData, index);

        // Assert
        expect(disbursementController.isLoading, false);
        expect(disbursementController.index, -1);
        verify(mockDisbursementService.makeDefaultMethod(methodData)).called(1);
      });

      test('Should handle make default method failure', () async {
        // Arrange
        final methodData = {'id': '1'};
        const index = 0;
        when(mockDisbursementService.makeDefaultMethod(methodData))
            .thenAnswer((_) async => false);

        // Act
        await disbursementController.makeDefaultMethod(methodData, index);

        // Assert
        expect(disbursementController.isLoading, false);
      });
    });

    group('Delete Method', () {
      test('Should successfully delete method', () async {
        // Arrange
        const methodId = 1;
        when(mockDisbursementService.deleteMethod(methodId))
            .thenAnswer((_) async => true);
        when(mockDisbursementService.getDisbursementMethodList())
            .thenAnswer((_) async => disburse.DisbursementMethodBody(methods: []));

        // Act
        await disbursementController.deleteMethod(methodId);

        // Assert
        expect(disbursementController.isDeleteLoading, false);
        verify(mockDisbursementService.deleteMethod(methodId)).called(1);
      });

      test('Should handle delete method failure', () async {
        // Arrange
        const methodId = 1;
        when(mockDisbursementService.deleteMethod(methodId))
            .thenAnswer((_) async => false);

        // Act
        await disbursementController.deleteMethod(methodId);

        // Assert
        expect(disbursementController.isDeleteLoading, false);
      });
    });

    group('Get Disbursement Report', () {
      test('Should successfully get disbursement report', () async {
        // Arrange
        const offset = 1;
        final mockReport = report.DisbursementReportModel(
          totalSize: 10,
          limit: '10',
          offset: '1',
          disbursements: [],
        );
        when(mockDisbursementService.getDisbursementReport(offset))
            .thenAnswer((_) async => mockReport);

        // Act
        await disbursementController.getDisbursementReport(offset);

        // Assert
        expect(disbursementController.disbursementReportModel, isNotNull);
        verify(mockDisbursementService.getDisbursementReport(offset)).called(1);
      });

      test('Should handle null disbursement report', () async {
        // Arrange
        const offset = 1;
        when(mockDisbursementService.getDisbursementReport(offset))
            .thenAnswer((_) async => null);

        // Act
        await disbursementController.getDisbursementReport(offset);

        // Assert
        expect(disbursementController.disbursementReportModel, isNull);
      });
    });

    group('Set Method', () {
      test('Should set method with existing withdraw methods', () async {
        // Arrange
        final mockMethods = [
          WidthDrawMethodModel(
            id: 1,
            methodName: 'Bank Transfer',
            methodFields: [
              MethodFields(inputName: 'account_number', inputType: 'text', placeholder: 'Account Number'),
            ],
          ),
        ];
        when(mockDisbursementService.getWithdrawMethodList())
            .thenAnswer((_) async => mockMethods);
        when(mockDisbursementService.processMethodList(any))
            .thenReturn([DropdownItem<int>(id: 1, value: 'Bank Transfer')]);
        when(mockDisbursementService.generateMethodFields(any, any))
            .thenReturn([MethodFields(inputName: 'account_number', inputType: 'text', placeholder: 'Account Number')]);
        when(mockDisbursementService.generateTextControllerList(any, any))
            .thenReturn([]);
        when(mockDisbursementService.generateFocusList(any, any))
            .thenReturn([]);

        // Act
        await disbursementController.setMethod();

        // Assert
        expect(disbursementController.widthDrawMethods, isNotNull);
        expect(disbursementController.methodList, isNotEmpty);
      });
    });
  });
}
