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

      // Prepare driver update data
      Map<String, dynamic> driverUpdateData = {
        'name': '${registrationData.firstName ?? ''} ${registrationData.lastName ?? ''}'.trim(),
        'vehicleType': registrationData.vehicleType ?? '',
        'homeAddress': registrationData.address ?? '',
        'homeAddressLatitude': registrationData.latitude,
        'homeAddressLongitude': registrationData.longitude,
      };

      // Update driver basic fields
      Response driverResponse = await apiClient.patchData(
        '${AppConstants.driverUpdateUri}/$driverId',
        driverUpdateData,
        handleError: false,
      );

      if (driverResponse.statusCode != 200) {
        String errorMessage = 'Failed to update driver information';
        if (driverResponse.body is Map && driverResponse.body['message'] != null) {
          errorMessage = driverResponse.body['message'];
        }
        return ResponseModel(false, errorMessage);
      }

      // Prepare metadata update (for fields not in driver entity)
      Map<String, dynamic> metadataUpdate = {
        'email': registrationData.email ?? '',
        'state': registrationData.state ?? '',
        'city': registrationData.city ?? '',
        'vehicleNumber': registrationData.vehicleNumber ?? '',
        'aadhaarFrontUploaded': registrationData.aadhaarFrontImage != null,
        'aadhaarBackUploaded': registrationData.aadhaarBackImage != null,
        'selfieUploaded': registrationData.selfieImage != null,
      };

      // Update driver with metadata and set is_verified to true (registration completed)
      Map<String, dynamic> finalUpdateData = {
        'metadata': metadataUpdate,
        'isVerified': true,
        'isActive': true,
      };

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

      // Handle wallet balance if provided
      if (registrationData.walletBalance != null && registrationData.walletBalance! > 0) {
        // Wallet balance should be handled via wallet service
        // For now, we'll skip this as it requires wallet service integration
      }

      // Refresh profile after registration
      await profileController.getProfile();

      return ResponseModel(true, 'Registration completed successfully');
    } catch (e) {
      return ResponseModel(false, 'Error: ${e.toString()}');
    }
  }
}

