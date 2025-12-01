import 'package:image_picker/image_picker.dart';

class RegistrationData {
  // Step 1: Personal Information
  String? firstName;
  String? lastName;
  String? email;
  String? phone;

  // Step 2: State
  String? state;

  // Step 3: City
  String? city;

  // Step 4: Current Location
  double? latitude;
  double? longitude;
  String? address;

  // Step 5: Vehicle Information
  String? vehicleType;
  String? vehicleNumber;
  XFile? driverLicenseFrontImage;
  XFile? driverLicenseBackImage;

  // Step 6: Aadhaar Card
  XFile? aadhaarFrontImage;
  XFile? aadhaarBackImage;

  // Step 7: Selfie
  XFile? selfieImage;

  // Step 8: Wallet
  double? walletBalance;

  RegistrationData({
    this.firstName,
    this.lastName,
    this.email,
    this.phone,
    this.state,
    this.city,
    this.latitude,
    this.longitude,
    this.address,
    this.vehicleType,
    this.vehicleNumber,
    this.driverLicenseFrontImage,
    this.driverLicenseBackImage,
    this.aadhaarFrontImage,
    this.aadhaarBackImage,
    this.selfieImage,
    this.walletBalance,
  });

  Map<String, dynamic> toJson() {
    return {
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': phone,
      'state': state,
      'city': city,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'vehicle_type': vehicleType,
      'vehicle_number': vehicleNumber,
      'wallet_balance': walletBalance,
    };
  }

  bool isStep1Complete() {
    return firstName != null &&
        firstName!.isNotEmpty &&
        lastName != null &&
        lastName!.isNotEmpty &&
        email != null &&
        email!.isNotEmpty &&
        phone != null &&
        phone!.isNotEmpty;
  }

  bool isStep2Complete() {
    return state != null && state!.isNotEmpty;
  }

  bool isStep3Complete() {
    return city != null && city!.isNotEmpty;
  }

  bool isStep4Complete() {
    return latitude != null && longitude != null && address != null && address!.isNotEmpty;
  }

  bool isStep5Complete() {
    return vehicleType != null && 
           vehicleType!.isNotEmpty && 
           vehicleNumber != null && 
           vehicleNumber!.isNotEmpty &&
           driverLicenseFrontImage != null &&
           driverLicenseBackImage != null;
  }

  bool isStep6Complete() {
    return aadhaarFrontImage != null && aadhaarBackImage != null;
  }

  bool isStep7Complete() {
    return selfieImage != null;
  }

  bool isStep8Complete() {
    return walletBalance != null && walletBalance! >= 0;
  }

  bool isAllStepsComplete() {
    return isStep1Complete() &&
        isStep2Complete() &&
        isStep3Complete() &&
        isStep4Complete() &&
        isStep5Complete() &&
        isStep6Complete() &&
        isStep7Complete() &&
        isStep8Complete();
  }
}

