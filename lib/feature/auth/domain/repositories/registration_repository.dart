import 'package:flutter/foundation.dart' show debugPrint;
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/models/registration_model.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/repositories/registration_repository_interface.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:get/get.dart';

class RegistrationRepository implements RegistrationRepositoryInterface {
  final ApiClient apiClient;
  RegistrationRepository({required this.apiClient});

  @override
  Future<ResponseModel> submitRegistration(RegistrationData registrationData) async {
    try {
      // Get driver ID from profile
      final profileController = Get.find<ProfileController>();
      final profileModel = profileController.profileModel;
      
      if (profileModel == null || profileModel.id == null) {
        return ResponseModel(false, 'Profile not found. Please login again.');
      }

      // Get driver UUID from profile response
      Response profileResponse = await apiClient.getData(AppConstants.driverProfileUri);
      String driverId = profileModel.id.toString();
      
      // Try to get UUID from profile response if available
      if (profileResponse.statusCode == 200 && profileResponse.body != null) {
        // Check for uuid field first
        if (profileResponse.body['uuid'] != null) {
          driverId = profileResponse.body['uuid'].toString();
        } else if (profileResponse.body['id'] != null) {
          // Check if the ID is a UUID (contains hyphens and is long enough)
          String responseId = profileResponse.body['id'].toString();
          if (responseId.contains('-') && responseId.length > 20) {
            driverId = responseId;
          }
        }
      }

      // Prepare all registration data to be stored in driver table
      // Basic driver fields (direct columns in driver table)
      Map<String, dynamic> driverUpdateData = {
        'name': '${registrationData.firstName ?? ''} ${registrationData.lastName ?? ''}'.trim(),
        'vehicleType': registrationData.vehicleType ?? '',
        'homeAddress': registrationData.address ?? '',
        'homeAddressLatitude': registrationData.latitude,
        'homeAddressLongitude': registrationData.longitude,
      };

      // Prepare comprehensive metadata with all registration information
      // This stores additional fields not in direct driver columns
      Map<String, dynamic> metadataUpdate = {
        // Personal Information
        'firstName': registrationData.firstName ?? '',
        'lastName': registrationData.lastName ?? '',
        'email': registrationData.email ?? '',
        'phone': registrationData.phone ?? '',
        
        // Location Information
        'state': registrationData.state ?? '',
        'city': registrationData.city ?? '',
        'address': registrationData.address ?? '',
        'latitude': registrationData.latitude,
        'longitude': registrationData.longitude,
        
        // Vehicle Information
        'vehicleType': registrationData.vehicleType ?? '',
        'vehicleNumber': registrationData.vehicleNumber ?? '',
        
        // Document information (store file names/paths)
        'driverLicenseFrontImage': registrationData.driverLicenseFrontImage?.name ?? registrationData.driverLicenseFrontImage?.path ?? '',
        'driverLicenseBackImage': registrationData.driverLicenseBackImage?.name ?? registrationData.driverLicenseBackImage?.path ?? '',
        'aadhaarFrontImage': registrationData.aadhaarFrontImage?.name ?? registrationData.aadhaarFrontImage?.path ?? '',
        'aadhaarBackImage': registrationData.aadhaarBackImage?.name ?? registrationData.aadhaarBackImage?.path ?? '',
        'selfieImage': registrationData.selfieImage?.name ?? registrationData.selfieImage?.path ?? '',
        'driverLicenseFrontUploaded': registrationData.driverLicenseFrontImage != null,
        'driverLicenseBackUploaded': registrationData.driverLicenseBackImage != null,
        'aadhaarFrontUploaded': registrationData.aadhaarFrontImage != null,
        'aadhaarBackUploaded': registrationData.aadhaarBackImage != null,
        'selfieUploaded': registrationData.selfieImage != null,
        
        // Wallet
        'walletBalance': registrationData.walletBalance ?? 0,
        
        // Registration completion timestamp
        'registrationCompletedAt': DateTime.now().toIso8601String(),
      };

      // Combine all data for single update
      Map<String, dynamic> finalUpdateData = {
        ...driverUpdateData,
        'metadata': metadataUpdate,
        'isVerified': true,
        'isActive': true,
      };

      // Update driver with all registration data
      Response finalResponse = await apiClient.patchData(
        '${AppConstants.driverUpdateUri}/$driverId',
        finalUpdateData,
        handleError: false,
      );

      if (finalResponse.statusCode != 200) {
        String errorMessage = 'Failed to complete registration';
        if (finalResponse.body is Map && finalResponse.body['message'] != null) {
          errorMessage = finalResponse.body['message'];
        }
        return ResponseModel(false, errorMessage);
      }

      // Handle wallet balance - add amount to wallet
      if (registrationData.walletBalance != null && registrationData.walletBalance! > 0) {
        try {
          // Get existing wallet balance from profile
          double existingBalance = 0.0;
          if (profileController.profileModel?.balance != null) {
            existingBalance = profileController.profileModel!.balance!;
          } else if (profileController.profileModel?.payableBalance != null) {
            existingBalance = profileController.profileModel!.payableBalance!;
          }
          
          // Calculate amount to add (total balance - existing balance)
          double amountToAdd = registrationData.walletBalance! - existingBalance;
          
          if (amountToAdd > 0) {
            // Add wallet balance using the new add-wallet-balance endpoint
            Response walletResponse = await apiClient.postData(
              AppConstants.addWalletBalanceUri,
              {
                'amount': amountToAdd,
                'description': 'Initial wallet deposit during registration',
              },
              handleError: false,
            );
            
            if (walletResponse.statusCode != 200) {
              // Log error but don't fail registration
              debugPrint('Failed to add wallet balance: ${walletResponse.body}');
            } else {
              debugPrint('Successfully added ${amountToAdd} to wallet balance');
            }
          }
        } catch (e) {
          // Log error but don't fail registration
          debugPrint('Error adding wallet balance: $e');
        }
      }

      // Refresh profile after registration
      await profileController.getProfile();

      return ResponseModel(true, 'Registration completed successfully');
    } catch (e) {
      return ResponseModel(false, 'Error: ${e.toString()}');
    }
  }
}

