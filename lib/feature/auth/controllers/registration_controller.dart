import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/models/registration_model.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/services/registration_service_interface.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/profile_model.dart';

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

  // Auto-fill registration data from profile
  void autoFillFromProfile(ProfileModel? profileModel) {
    if (profileModel == null) return;

    // Step 1: Personal Information
    if (profileModel.fName != null && profileModel.fName!.isNotEmpty) {
      _registrationData.firstName = profileModel.fName;
    }
    if (profileModel.lName != null && profileModel.lName!.isNotEmpty) {
      _registrationData.lastName = profileModel.lName;
    }
    if (profileModel.email != null && profileModel.email!.isNotEmpty) {
      _registrationData.email = profileModel.email;
    }
    if (profileModel.phone != null && profileModel.phone!.isNotEmpty) {
      _registrationData.phone = profileModel.phone;
    }

    // Step 4: Location (use home address if available)
    if (profileModel.homeAddressLatitude != null && profileModel.homeAddressLongitude != null) {
      _registrationData.latitude = profileModel.homeAddressLatitude;
      _registrationData.longitude = profileModel.homeAddressLongitude;
      _registrationData.address = profileModel.homeAddress ?? '';
    }

    // Step 5: Vehicle (from metadata if available)
    // Note: vehicleType is not directly in ProfileModel, it may be in metadata
    // We'll leave this for the user to fill in the form

    // Note: State, city, vehicle number, Aadhaar images, selfie, and wallet balance
    // need to be filled by the user as they may not be in the profile
    // Defer update to avoid calling during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      update();
    });
  }

  void setStep(int step) {
    if (_currentStep != step) {
    _currentStep = step;
      // Defer update to avoid calling during build
      WidgetsBinding.instance.addPostFrameCallback((_) {
    update();
      });
    }
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

  // Step 5: Driver License
  Future<void> pickDriverLicenseFront({bool isCamera = false}) async {
    try {
      // On macOS/desktop, camera is not fully supported, use gallery/file picker instead
      if (GetPlatform.isDesktop || GetPlatform.isMacOS) {
        await _pickDriverLicenseFromFile(isFront: true);
      } else {
        XFile? image = await _imagePicker.pickImage(
          source: isCamera ? ImageSource.camera : ImageSource.gallery,
          imageQuality: 80,
        );
        if (image != null) {
          _registrationData.driverLicenseFrontImage = image;
          update();
        }
      }
    } catch (e) {
      showCustomSnackBar('Failed to pick image: ${e.toString()}');
    }
  }

  Future<void> pickDriverLicenseBack({bool isCamera = false}) async {
    try {
      // On macOS/desktop, camera is not fully supported, use gallery/file picker instead
      if (GetPlatform.isDesktop || GetPlatform.isMacOS) {
        await _pickDriverLicenseFromFile(isFront: false);
      } else {
        XFile? image = await _imagePicker.pickImage(
          source: isCamera ? ImageSource.camera : ImageSource.gallery,
          imageQuality: 80,
        );
        if (image != null) {
          _registrationData.driverLicenseBackImage = image;
          update();
        }
      }
    } catch (e) {
      showCustomSnackBar('Failed to pick image: ${e.toString()}');
    }
  }

  Future<void> _pickDriverLicenseFromFile({required bool isFront}) async {
    try {
      // For macOS/desktop, use file picker to select image
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
      );
      
      if (result != null && result.files.single.path != null) {
        // Create XFile from the selected file path
        final file = XFile(result.files.single.path!);
        if (isFront) {
          _registrationData.driverLicenseFrontImage = file;
        } else {
          _registrationData.driverLicenseBackImage = file;
        }
        update();
      }
    } catch (e) {
      showCustomSnackBar('Failed to select image: ${e.toString()}');
    }
  }

  void removeDriverLicenseFront() {
    _registrationData.driverLicenseFrontImage = null;
    update();
  }

  void removeDriverLicenseBack() {
    _registrationData.driverLicenseBackImage = null;
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
      // On macOS/desktop, camera is not fully supported, use gallery/file picker instead
      if (GetPlatform.isDesktop || GetPlatform.isMacOS) {
        // Use file picker for macOS/desktop
        await _pickSelfieFromFile();
      } else {
        // Use image picker for mobile platforms
        XFile? image = await _imagePicker.pickImage(
          source: isCamera ? ImageSource.camera : ImageSource.gallery,
          imageQuality: 80,
        );
        if (image != null) {
          _registrationData.selfieImage = image;
          update();
        }
      }
    } catch (e) {
      showCustomSnackBar('Failed to capture selfie: ${e.toString()}');
    }
  }

  Future<void> _pickSelfieFromFile() async {
    try {
      // For macOS/desktop, use file picker to select image
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
      );
      
      if (result != null && result.files.single.path != null) {
        // Create XFile from the selected file path
        final file = XFile(result.files.single.path!);
        _registrationData.selfieImage = file;
        update();
      }
    } catch (e) {
      showCustomSnackBar('Failed to select image: ${e.toString()}');
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

