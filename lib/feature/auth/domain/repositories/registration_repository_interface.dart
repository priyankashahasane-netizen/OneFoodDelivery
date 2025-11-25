import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/models/registration_model.dart';

abstract class RegistrationRepositoryInterface {
  Future<ResponseModel> submitRegistration(RegistrationData registrationData);
}

