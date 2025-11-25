import 'package:stackfood_multivendor_driver/feature/disbursements/domain/services/disbursement_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/domain/models/disbursement_method_model.dart' as disburse;
import 'package:stackfood_multivendor_driver/feature/disbursements/domain/models/withdraw_method_model.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/domain/models/disbursement_report_model.dart' as report;
import 'package:stackfood_multivendor_driver/common/widgets/custom_dropdown_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class DisbursementController extends GetxController implements GetxService {
  final DisbursementServiceInterface disbursementServiceInterface;
  DisbursementController({required this.disbursementServiceInterface});

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  bool _isDeleteLoading = false;
  bool get isDeleteLoading => _isDeleteLoading;

  int? _selectedMethodIndex = 0;
  int? get selectedMethodIndex => _selectedMethodIndex;

  List<DropdownItem<int>> _methodList = [];
  List<DropdownItem<int>> get methodList => _methodList;

  List<TextEditingController> _textControllerList = [];
  List<TextEditingController> get textControllerList => _textControllerList;

  List<MethodFields> _methodFields = [];
  List<MethodFields> get methodFields => _methodFields;

  List<FocusNode> _focusList = [];
  List<FocusNode> get focusList => _focusList;

  List<WidthDrawMethodModel>? _widthDrawMethods;
  List<WidthDrawMethodModel>? get widthDrawMethods => _widthDrawMethods;

  disburse.DisbursementMethodBody? _disbursementMethodBody;
  disburse.DisbursementMethodBody? get disbursementMethodBody => _disbursementMethodBody;

  report.DisbursementReportModel? _disbursementReportModel;
  report.DisbursementReportModel? get disbursementReportModel => _disbursementReportModel;

  int? _index = -1;
  int? get index =>_index;


  void setMethodId(int? id, {bool canUpdate = true}) {
    _selectedMethodIndex = id;
    if(canUpdate){
      update();
    }
  }

  Future<void> setMethod({bool isUpdate = true}) async {
    if(_widthDrawMethods == null) {
      _widthDrawMethods = await getWithdrawMethodList();
    } else {
      _widthDrawMethods = widthDrawMethods;
    }
    _methodList = disbursementServiceInterface.processMethodList(_widthDrawMethods);
    _methodFields = disbursementServiceInterface.generateMethodFields(_widthDrawMethods, _selectedMethodIndex);
    _textControllerList = disbursementServiceInterface.generateTextControllerList(_widthDrawMethods, _selectedMethodIndex);
    _focusList = disbursementServiceInterface.generateFocusList(_widthDrawMethods, _selectedMethodIndex);

    if(isUpdate) {
      update();
    }
  }

  Future<void> addWithdrawMethod(Map<String?, String> data) async {
    _isLoading = true;
    update();
    try {
      bool isSuccess = await disbursementServiceInterface.addWithdraw(data);
      if(isSuccess) {
        _isLoading = false;
        update();
        // Clear any form errors by resetting the form
        _clearFormErrors();
        // Refresh bank details first
        await getBankDetails();
        // Go back to bank details page (which will show the updated list)
        Get.back();
        showCustomSnackBar('add_successfully'.tr, isError: false);
      } else {
        _isLoading = false;
        update();
        // Show error message if operation failed
        showCustomSnackBar('Failed to add bank account. Please try again.', isError: true);
      }
    } catch (e) {
      _isLoading = false;
      update();
      _clearFormErrors();
      // Error message will be shown by API client, but ensure form is cleared
    }
  }

  void _clearFormErrors() {
    // Clear any validation errors by unfocusing all fields
    // This will clear any error states in the form fields
    for (var focusNode in _focusList) {
      focusNode.unfocus();
    }
    // Reset form state by updating
    update();
  }

  Future<bool> getDisbursementMethodList() async {
    bool success = false;
    disburse.DisbursementMethodBody? disbursementMethodBody = await disbursementServiceInterface.getDisbursementMethodList();
    if(disbursementMethodBody != null) {
      success = true;
      _disbursementMethodBody = disbursementMethodBody;
    }
    update();
    return success;
  }

  Future<void> makeDefaultMethod(Map<String, String> data, int index) async {
    _index = index;
    _isLoading = true;
    update();
    try {
      bool isSuccess = await disbursementServiceInterface.makeDefaultMethod(data);
      if(isSuccess) {
        _index = -1;
        _isLoading = false;
        update();
        // Refresh bank details to get updated default status
        // This will update _disbursementMethodBody and call update() internally
        await getBankDetails();
        // Ensure UI is updated after refresh
        update();
        showCustomSnackBar('set_default_method_successful'.tr, isError: false);
      } else {
        _index = -1;
        _isLoading = false;
        update();
        showCustomSnackBar('Failed to set default method. Please try again.', isError: true);
      }
    } catch (e) {
      _index = -1;
      _isLoading = false;
      update();
      showCustomSnackBar('Failed to set default method: ${e.toString()}', isError: true);
    }
  }

  Future<void> deleteMethod(String bankAccountId) async {
    _isDeleteLoading = true;
    update();
    try {
      bool isSuccess = await disbursementServiceInterface.deleteMethod(bankAccountId);
      if(isSuccess) {
        // Close dialog FIRST before updating state to prevent GetBuilder from interfering
        Get.back();
        // Reset loading state after dialog is closed
        _isDeleteLoading = false;
        update();
        // Small delay to ensure dialog is fully closed and UI is ready
        await Future.delayed(const Duration(milliseconds: 200));
        // Refresh bank details to get updated list
        // This will update _disbursementMethodBody and call update() internally
        await getBankDetails();
        showCustomSnackBar('method_delete_successfully'.tr, isError: false);
      } else {
        // Close dialog even on failure
        Get.back();
        _isDeleteLoading = false;
        update();
        // Small delay to ensure dialog is fully closed
        await Future.delayed(const Duration(milliseconds: 200));
        // Refresh the list to get current state
        await getBankDetails();
        // Show error message for actual failures (not 404s which are handled as success)
        showCustomSnackBar('Failed to delete bank account. Please try again.', isError: true);
      }
    } catch (e) {
      // Close dialog even on error
      Get.back();
      _isDeleteLoading = false;
      update();
      showCustomSnackBar('Failed to delete bank account: ${e.toString()}', isError: true);
      // Refresh the list to get current state
      await getBankDetails();
    }
  }

  Future<void> getDisbursementReport(int offset) async {
    report.DisbursementReportModel? disbursementReportModel = await disbursementServiceInterface.getDisbursementReport(offset);
    if(disbursementReportModel != null) {
      _disbursementReportModel = disbursementReportModel;
    }
    update();
  }

  Future<List<WidthDrawMethodModel>?> getWithdrawMethodList() async {
    List<WidthDrawMethodModel>? widthDrawMethodList = await disbursementServiceInterface.getWithdrawMethodList();
    if(widthDrawMethodList != null) {
      _widthDrawMethods = [];
      _widthDrawMethods!.addAll(widthDrawMethodList);
      
      // Convert to DisbursementMethodBody format for the screen
      if (widthDrawMethodList.isNotEmpty) {
        List<disburse.Methods> methods = widthDrawMethodList.map((widthDrawMethod) {
          // Convert MethodFields from withdraw_method_model to disbursement_method_model format
          List<disburse.MethodFields>? convertedFields = widthDrawMethod.methodFields?.map((field) {
            // Format input name: replace underscores with spaces and capitalize first letter
            String formattedInput = field.inputName?.replaceAll('_', ' ') ?? '';
            if (formattedInput.isNotEmpty) {
              formattedInput = formattedInput[0].toUpperCase() + formattedInput.substring(1);
            }
            return disburse.MethodFields(
              userInput: formattedInput,
              userData: field.value ?? '',
            );
          }).toList();
          
          return disburse.Methods(
            id: widthDrawMethod.id,
            methodName: widthDrawMethod.methodName,
            methodFields: convertedFields,
            isDefault: widthDrawMethod.isDefault,
            createdAt: widthDrawMethod.createdAt,
            updatedAt: widthDrawMethod.updatedAt,
          );
        }).toList();
        
        _disbursementMethodBody = disburse.DisbursementMethodBody(
          totalSize: widthDrawMethodList.length,
          limit: '10',
          offset: '1',
          methods: methods,
        );
      } else {
        _disbursementMethodBody = disburse.DisbursementMethodBody(
          totalSize: 0,
          limit: '10',
          offset: '1',
          methods: [],
        );
      }
    } else {
      _disbursementMethodBody = disburse.DisbursementMethodBody(
        totalSize: 0,
        limit: '10',
        offset: '1',
        methods: [],
      );
    }
    update();
    return _widthDrawMethods;
  }

  Future<List<WidthDrawMethodModel>?> getBankDetails() async {
    List<WidthDrawMethodModel>? bankDetailsList = await disbursementServiceInterface.getBankDetails();
    if(bankDetailsList != null) {
      _widthDrawMethods = [];
      _widthDrawMethods!.addAll(bankDetailsList);
      
      // Convert to DisbursementMethodBody format for the screen
      if (bankDetailsList.isNotEmpty) {
        List<disburse.Methods> methods = bankDetailsList.map((bankDetail) {
          // Convert MethodFields from withdraw_method_model to disbursement_method_model format
          List<disburse.MethodFields>? convertedFields = bankDetail.methodFields?.map((field) {
            // Format input name: replace underscores with spaces and capitalize first letter
            String formattedInput = field.inputName?.replaceAll('_', ' ') ?? '';
            if (formattedInput.isNotEmpty) {
              formattedInput = formattedInput[0].toUpperCase() + formattedInput.substring(1);
            }
            return disburse.MethodFields(
              userInput: formattedInput,
              userData: field.value ?? '',
            );
          }).toList();
          
          return disburse.Methods(
            id: bankDetail.id,
            bankAccountId: bankDetail.bankAccountId,
            methodName: bankDetail.methodName,
            methodFields: convertedFields,
            isDefault: bankDetail.isDefault,
            createdAt: bankDetail.createdAt,
            updatedAt: bankDetail.updatedAt,
          );
        }).toList();
        
        _disbursementMethodBody = disburse.DisbursementMethodBody(
          totalSize: bankDetailsList.length,
          limit: '10',
          offset: '1',
          methods: methods,
        );
      } else {
        _disbursementMethodBody = disburse.DisbursementMethodBody(
          totalSize: 0,
          limit: '10',
          offset: '1',
          methods: [],
        );
      }
    } else {
      _disbursementMethodBody = disburse.DisbursementMethodBody(
        totalSize: 0,
        limit: '10',
        offset: '1',
        methods: [],
      );
    }
    // Trigger UI update after refreshing bank details - ensure GetBuilder rebuilds
    update();
    return _widthDrawMethods;
  }
  
}