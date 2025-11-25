import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/models/registration_model.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/repositories/registration_repository_interface.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/services/registration_service_interface.dart';

class RegistrationService implements RegistrationServiceInterface {
  final RegistrationRepositoryInterface registrationRepositoryInterface;
  RegistrationService({required this.registrationRepositoryInterface});

  @override
  Future<ResponseModel> submitRegistration(RegistrationData registrationData) async {
    return await registrationRepositoryInterface.submitRegistration(registrationData);
  }
}

