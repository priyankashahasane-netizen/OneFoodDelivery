import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/domain/models/withdraw_method_model.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/domain/repositories/disbursement_repository_interface.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/domain/models/disbursement_method_model.dart' as disburse;
import 'package:stackfood_multivendor_driver/feature/disbursements/domain/models/disbursement_report_model.dart' as report;
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DisbursementRepository implements DisbursementRepositoryInterface {
  final ApiClient apiClient;
  final SharedPreferences sharedPreferences;
  DisbursementRepository({required this.apiClient, required this.sharedPreferences});

  @override
  Future<bool> addWithdraw(Map<String?, String> data) async {
    // Use handleError: false to prevent automatic error display
    // We'll handle errors manually based on response body
    Response response = await apiClient.postData(
      '${AppConstants.addWithdrawMethodUri}?token=${_getUserToken()}', 
      data,
      handleError: false,
    );
    
    // Check both status code and response body for success
    // Accept both 200 (OK) and 201 (Created) as success status codes
    if (response.statusCode == 200 || response.statusCode == 201) {
      // Check if response body indicates success
      if (response.body != null && response.body is Map) {
        // If response has a 'success' field, check it
        if (response.body['success'] != null) {
          return response.body['success'] == true;
        }
        // If response has a 'message' field with success message, consider it successful
        if (response.body['message'] != null) {
          String message = response.body['message'].toString().toLowerCase();
          if (message.contains('success') || message.contains('added successfully')) {
            return true;
          }
          // If message contains error keywords, it's a failure
          if (message.contains('error') || message.contains('failed') || message.contains('invalid')) {
            return false;
          }
        }
      }
      // If status is 200/201 and no explicit error, consider it successful
      return true;
    }
    return false;
  }

  @override
  Future<disburse.DisbursementMethodBody?> getList() async{
    disburse.DisbursementMethodBody? disbursementMethodBody;
    Response response = await apiClient.getData('${AppConstants.disbursementMethodListUri}?limit=10&offset=1&token=${_getUserToken()}');
    if(response.statusCode == 200) {
      disbursementMethodBody = disburse.DisbursementMethodBody.fromJson(response.body);
    }
    return disbursementMethodBody;
  }

  @override
  Future<bool> makeDefaultMethod(Map<String?, String> data) async {
    // Use handleError: false to prevent automatic error display
    // We'll handle errors manually based on response body
    Response response = await apiClient.postData(
      '${AppConstants.makeDefaultDisbursementMethodUri}?token=${_getUserToken()}', 
      data,
      handleError: false,
    );
    
    // Check both status code and response body for success
    // Accept 200 (OK) and 201 (Created) as success status codes
    if (response.statusCode == 200 || response.statusCode == 201) {
      // Check if response body indicates success
      if (response.body != null) {
        // Handle both Map and String response bodies
        Map<String, dynamic>? bodyMap;
        if (response.body is Map) {
          bodyMap = response.body as Map<String, dynamic>;
        } else if (response.body is String) {
          try {
            bodyMap = jsonDecode(response.body as String) as Map<String, dynamic>;
          } catch (e) {
            debugPrint('⚠️ Could not parse response body as JSON: $e');
          }
        }
        
        if (bodyMap != null) {
          // If response has a 'success' field, check it
          if (bodyMap['success'] != null) {
            bool success = bodyMap['success'] == true || bodyMap['success'] == 1 || bodyMap['success'].toString().toLowerCase() == 'true';
            return success;
          }
          // If response has a 'message' field with success message, consider it successful
          if (bodyMap['message'] != null) {
            String message = bodyMap['message'].toString().toLowerCase();
            if (message.contains('success') || message.contains('default')) {
              return true;
            }
            // If message contains error keywords, it's a failure
            if (message.contains('error') || message.contains('failed') || message.contains('invalid')) {
              return false;
            }
          }
        }
      }
      // If status is 200/201 and no explicit error, consider it successful
      return true;
    }
    
    // For error status codes, log and return false
    String errorMessage = 'Unknown error';
    if (response.body != null) {
      Map<String, dynamic>? bodyMap;
      if (response.body is Map) {
        bodyMap = response.body as Map<String, dynamic>;
      } else if (response.body is String) {
        try {
          bodyMap = jsonDecode(response.body as String) as Map<String, dynamic>;
        } catch (e) {
          // Ignore parse errors
        }
      }
      if (bodyMap != null && bodyMap['message'] != null) {
        errorMessage = bodyMap['message'].toString();
      }
    } else if (response.statusText != null) {
      errorMessage = response.statusText!;
    }
    debugPrint('❌ Make default method failed (${response.statusCode}): $errorMessage');
    return false;
  }

  @override
  Future<bool> delete(int id) async {
    // This method is required by RepositoryInterface but we use deleteBankAccount instead
    throw UnimplementedError('Use deleteBankAccount instead');
  }

  @override
  Future<bool> deleteBankAccount(String bankAccountId) async{
    // Use handleError: false to prevent automatic error display
    // We'll handle errors manually based on response body
    Response response = await apiClient.postData(
      '${AppConstants.deleteDisbursementMethodUri}?token=${_getUserToken()}', 
      {'bank_account_id': bankAccountId},
      handleError: false,
    );
    
    // Debug logging
    debugPrint('🔍 Delete bank account response:');
    debugPrint('   Status Code: ${response.statusCode}');
    debugPrint('   Status Text: ${response.statusText}');
    debugPrint('   Body: ${response.body}');
    debugPrint('   Body Type: ${response.body.runtimeType}');
    
    // Check both status code and response body for success
    // Accept 200 (OK), 201 (Created), and 204 (No Content) as success status codes
    if (response.statusCode == 200 || response.statusCode == 201 || response.statusCode == 204) {
      // Check if response body indicates success
      if (response.body != null) {
        // Handle both Map and String response bodies
        Map<String, dynamic>? bodyMap;
        if (response.body is Map) {
          bodyMap = response.body as Map<String, dynamic>;
        } else if (response.body is String) {
          try {
            bodyMap = jsonDecode(response.body as String) as Map<String, dynamic>;
          } catch (e) {
            debugPrint('⚠️ Could not parse response body as JSON: $e');
          }
        }
        
        if (bodyMap != null) {
          // If response has a 'success' field, check it
          if (bodyMap['success'] != null) {
            bool success = bodyMap['success'] == true || bodyMap['success'] == 1 || bodyMap['success'].toString().toLowerCase() == 'true';
            debugPrint('   Success field: ${bodyMap['success']} -> $success');
            return success;
          }
          // If response has a 'message' field with success message, consider it successful
          if (bodyMap['message'] != null) {
            String message = bodyMap['message'].toString().toLowerCase();
            debugPrint('   Message: $message');
            if (message.contains('success') || message.contains('deleted successfully')) {
              return true;
            }
            // If message contains error keywords, it's a failure
            if (message.contains('error') || message.contains('failed') || message.contains('invalid')) {
              return false;
            }
          }
        }
      }
      // If status is 200/201/204 and no explicit error, consider it successful
      // 204 (No Content) typically means success with no response body
      debugPrint('✅ Delete successful (status ${response.statusCode})');
      return true;
    }
    
    // For 404 errors, treat as "already deleted" - return true to refresh list silently
    if (response.statusCode == 404) {
      // Log for debugging but treat as success (account already deleted)
      debugPrint('ℹ️ Bank account not found (404) - treating as already deleted: $bankAccountId');
      // Return true so the UI refreshes without showing an error
      return true;
    }
    
    // For other error status codes, log and return false
    String errorMessage = 'Unknown error';
    if (response.body != null && response.body is Map && response.body['message'] != null) {
      errorMessage = response.body['message'].toString();
    } else if (response.statusText != null) {
      errorMessage = response.statusText!;
    }
    debugPrint('❌ Delete bank account failed (${response.statusCode}): $errorMessage');
    debugPrint('   Bank Account ID: $bankAccountId');
    return false;
  }

  @override
  Future<report.DisbursementReportModel?> getDisbursementReport(int offset) async {
    report.DisbursementReportModel? disbursementReportModel;
    Response response = await apiClient.getData('${AppConstants.getDisbursementReportUri}?limit=10&offset=$offset&token=${_getUserToken()}');
    if(response.statusCode == 200) {
      disbursementReportModel = report.DisbursementReportModel.fromJson(response.body);
    }
    return disbursementReportModel;
  }

  @override
  Future<List<WidthDrawMethodModel>?> getWithdrawMethodList() async {
    List<WidthDrawMethodModel>? widthDrawMethodList;
    Response response = await apiClient.getData('${AppConstants.withdrawRequestMethodUri}?token=${_getUserToken()}');
    if(response.statusCode == 200) {
      widthDrawMethodList = [];
      response.body.forEach((method) {
        WidthDrawMethodModel withdrawMethod = WidthDrawMethodModel.fromJson(method);
        widthDrawMethodList!.add(withdrawMethod);
      });
    }
    return widthDrawMethodList;
  }

  @override
  Future<List<WidthDrawMethodModel>?> getBankDetails() async {
    List<WidthDrawMethodModel>? bankDetailsList;
    Response response = await apiClient.getData(AppConstants.bankDetailsUri);
    if(response.statusCode == 200) {
      bankDetailsList = [];
      // The API returns { "bank_details": [...] }
      if (response.body['bank_details'] != null) {
        response.body['bank_details'].forEach((method) {
          WidthDrawMethodModel bankDetail = WidthDrawMethodModel.fromJson(method);
          bankDetailsList!.add(bankDetail);
        });
      }
    }
    return bankDetailsList;
  }

  String _getUserToken() {
    return sharedPreferences.getString(AppConstants.token) ?? "";
  }

  @override
  Future add(value) {
    throw UnimplementedError();
  }

  @override
  Future get(int id) {
    throw UnimplementedError();
  }

  @override
  Future update(Map<String, dynamic> body) {
    throw UnimplementedError();
  }

}