import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/models/registration_model.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/repositories/registration_repository_interface.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:get/get.dart';

class RegistrationRepository implements RegistrationRepositoryInterface {
  final ApiClient apiClient;
  RegistrationRepository({required this.apiClient});

  @override
  Future<ResponseModel> submitRegistration(RegistrationData registrationData) async {
    try {
      // Prepare multipart body for images
      List<MultipartBody> multipartBody = [];
      
      if (registrationData.aadhaarFrontImage != null) {
        multipartBody.add(MultipartBody('aadhaar_front', registrationData.aadhaarFrontImage));
      }
      if (registrationData.aadhaarBackImage != null) {
        multipartBody.add(MultipartBody('aadhaar_back', registrationData.aadhaarBackImage));
      }
      if (registrationData.selfieImage != null) {
        multipartBody.add(MultipartBody('selfie', registrationData.selfieImage));
      }

      // Prepare form data
      Map<String, String> body = {
        'first_name': registrationData.firstName ?? '',
        'last_name': registrationData.lastName ?? '',
        'email': registrationData.email ?? '',
        'phone': registrationData.phone ?? '',
        'state': registrationData.state ?? '',
        'city': registrationData.city ?? '',
        'latitude': registrationData.latitude?.toString() ?? '',
        'longitude': registrationData.longitude?.toString() ?? '',
        'address': registrationData.address ?? '',
        'vehicle_type': registrationData.vehicleType ?? '',
        'vehicle_number': registrationData.vehicleNumber ?? '',
        'wallet_balance': registrationData.walletBalance?.toString() ?? '0',
        'status': 'Active',
      };

      Response response = await apiClient.postMultipartData(
        AppConstants.registerUri,
        body,
        multipartBody,
        [],
        handleError: false,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        String message = 'Registration successful';
        if (response.body is Map && response.body['message'] != null) {
          message = response.body['message'];
        }
        return ResponseModel(true, message);
      } else {
        String errorMessage = 'Registration failed';
        if (response.body is Map && response.body['message'] != null) {
          errorMessage = response.body['message'];
        }
        return ResponseModel(false, errorMessage);
      }
    } catch (e) {
      return ResponseModel(false, 'Error: ${e.toString()}');
    }
  }
}

