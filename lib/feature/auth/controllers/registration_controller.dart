import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/models/registration_model.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/services/registration_service_interface.dart';

class RegistrationController extends GetxController implements GetxService {
  final RegistrationServiceInterface registrationServiceInterface;
  RegistrationController({required this.registrationServiceInterface});

  RegistrationData _registrationData = RegistrationData();
  RegistrationData get registrationData => _registrationData;

  int _currentStep = 1;
  int get currentStep => _currentStep;

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  final ImagePicker _imagePicker = ImagePicker();

  void setStep(int step) {
    _currentStep = step;
    update();
  }

  void nextStep() {
    if (_currentStep < 8) {
      _currentStep++;
      update();
    }
  }

  void previousStep() {
    if (_currentStep > 1) {
      _currentStep--;
      update();
    }
  }

  // Step 1: Personal Information
  void setPersonalInfo(String firstName, String lastName, String email, String phone) {
    _registrationData.firstName = firstName;
    _registrationData.lastName = lastName;
    _registrationData.email = email;
    _registrationData.phone = phone;
    update();
  }

  // Step 2: State
  void setState(String state) {
    _registrationData.state = state;
    _registrationData.city = null; // Reset city when state changes
    update();
  }

  // Step 3: City
  void setCity(String city) {
    _registrationData.city = city;
    update();
  }

  // Step 4: Location
  void setLocation(double latitude, double longitude, String address) {
    _registrationData.latitude = latitude;
    _registrationData.longitude = longitude;
    _registrationData.address = address;
    update();
  }

  // Step 5: Vehicle
  void setVehicle(String vehicleType, String vehicleNumber) {
    _registrationData.vehicleType = vehicleType;
    _registrationData.vehicleNumber = vehicleNumber;
    update();
  }

  // Step 6: Aadhaar
  Future<void> pickAadhaarFront({bool isCamera = false}) async {
    try {
      XFile? image = await _imagePicker.pickImage(
        source: isCamera ? ImageSource.camera : ImageSource.gallery,
        imageQuality: 80,
      );
      if (image != null) {
        _registrationData.aadhaarFrontImage = image;
        update();
      }
    } catch (e) {
      showCustomSnackBar('Failed to pick image: ${e.toString()}');
    }
  }

  Future<void> pickAadhaarBack({bool isCamera = false}) async {
    try {
      XFile? image = await _imagePicker.pickImage(
        source: isCamera ? ImageSource.camera : ImageSource.gallery,
        imageQuality: 80,
      );
      if (image != null) {
        _registrationData.aadhaarBackImage = image;
        update();
      }
    } catch (e) {
      showCustomSnackBar('Failed to pick image: ${e.toString()}');
    }
  }

  void removeAadhaarFront() {
    _registrationData.aadhaarFrontImage = null;
    update();
  }

  void removeAadhaarBack() {
    _registrationData.aadhaarBackImage = null;
    update();
  }

  // Step 7: Selfie
  Future<void> pickSelfie({bool isCamera = true}) async {
    try {
      XFile? image = await _imagePicker.pickImage(
        source: isCamera ? ImageSource.camera : ImageSource.gallery,
        imageQuality: 80,
      );
      if (image != null) {
        _registrationData.selfieImage = image;
        update();
      }
    } catch (e) {
      showCustomSnackBar('Failed to capture selfie: ${e.toString()}');
    }
  }

  void removeSelfie() {
    _registrationData.selfieImage = null;
    update();
  }

  // Step 8: Wallet
  void setWalletBalance(double balance) {
    _registrationData.walletBalance = balance;
    update();
  }

  Future<ResponseModel> submitRegistration() async {
    if (!_registrationData.isAllStepsComplete()) {
      return ResponseModel(false, 'Please complete all steps');
    }

    _isLoading = true;
    update();

    ResponseModel response = await registrationServiceInterface.submitRegistration(_registrationData);

    _isLoading = false;
    update();

    return response;
  }

  bool canProceedToNextStep() {
    switch (_currentStep) {
      case 1:
        return _registrationData.isStep1Complete();
      case 2:
        return _registrationData.isStep2Complete();
      case 3:
        return _registrationData.isStep3Complete();
      case 4:
        return _registrationData.isStep4Complete();
      case 5:
        return _registrationData.isStep5Complete();
      case 6:
        return _registrationData.isStep6Complete();
      case 7:
        return _registrationData.isStep7Complete();
      case 8:
        return _registrationData.isStep8Complete();
      default:
        return false;
    }
  }
}

