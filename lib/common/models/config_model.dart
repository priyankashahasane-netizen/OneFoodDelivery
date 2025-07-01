class ConfigModel {
  String? businessName;
  String? logo;
  String? address;
  String? phone;
  String? email;
  String? currencySymbol;
  bool? cashOnDelivery;
  bool? digitalPayment;
  String? termsAndConditions;
  String? privacyPolicy;
  String? aboutUs;
  String? country;
  DefaultLocation? defaultLocation;
  String? appUrlAndroidDeliveryman;
  String? appUrlIosDeliveryman;
  bool? customerVerification;
  bool? orderDeliveryVerification;
  String? currencySymbolDirection;
  double? appMinimumVersionAndroid;
  // double perKmShippingCharge;
  // double minimumShippingCharge;
  double? freeDeliveryOver;
  bool? demo;
  bool? maintenanceMode;
  int? popularFood;
  int? popularRestaurant;
  int? newRestaurant;
  String? orderConfirmationModel;
  bool? showDmEarning;
  bool? canceledByDeliveryman;
  bool? canceledByRestaurant;
  String? timeformat;
  bool? toggleVegNonVeg;
  bool? toggleDmRegistration;
  bool? toggleRestaurantRegistration;
  int? scheduleOrderSlotDuration;
  int? digitAfterDecimalPoint;
  String? additionalChargeName;
  bool? dmPictureUploadStatus;
  List<PaymentBody>? activePaymentMethodList;
  DeliverymanAdditionalJoinUsPageData? deliverymanAdditionalJoinUsPageData;
  String? disbursementType;
  double? minAmountToPayDm;
  MaintenanceModeData? maintenanceModeData;
  bool? firebaseOtpVerification;

  ConfigModel({
    this.businessName,
    this.logo,
    this.address,
    this.phone,
    this.email,
    this.currencySymbol,
    this.cashOnDelivery,
    this.digitalPayment,
    this.termsAndConditions,
    this.privacyPolicy,
    this.aboutUs,
    this.country,
    this.defaultLocation,
    this.appUrlAndroidDeliveryman,
    this.appUrlIosDeliveryman,
    this.customerVerification,
    this.orderDeliveryVerification,
    this.currencySymbolDirection,
    this.appMinimumVersionAndroid,
    // this.perKmShippingCharge,
    // this.minimumShippingCharge,
    this.freeDeliveryOver,
    this.demo,
    this.maintenanceMode,
    this.popularFood,
    this.popularRestaurant,
    this.newRestaurant,
    this.orderConfirmationModel,
    this.showDmEarning,
    this.canceledByDeliveryman,
    this.canceledByRestaurant,
    this.timeformat,
    this.toggleVegNonVeg,
    this.toggleDmRegistration,
    this.toggleRestaurantRegistration,
    this.scheduleOrderSlotDuration,
    this.digitAfterDecimalPoint,
    this.additionalChargeName,
    this.dmPictureUploadStatus,
    this.activePaymentMethodList,
    this.deliverymanAdditionalJoinUsPageData,
    this.disbursementType,
    this.minAmountToPayDm,
    this.maintenanceModeData,
    this.firebaseOtpVerification,
  });

  ConfigModel.fromJson(Map<String, dynamic> json) {
    businessName = json['business_name'];
    logo = json['logo'];
    address = json['address'];
    phone = json['phone'];
    email = json['email'];
    currencySymbol = json['currency_symbol'];
    cashOnDelivery = json['cash_on_delivery'];
    digitalPayment = json['digital_payment'];
    termsAndConditions = json['terms_and_conditions'];
    privacyPolicy = json['privacy_policy'];
    aboutUs = json['about_us'];
    country = json['country'];
    defaultLocation = json['default_location'] != null ? DefaultLocation.fromJson(json['default_location']) : null;
    appUrlAndroidDeliveryman = json['app_url_android_deliveryman'];
    appUrlIosDeliveryman = json['app_url_ios_deliveryman'];
    customerVerification = json['customer_verification'];
    orderDeliveryVerification = json['order_delivery_verification'];
    currencySymbolDirection = json['currency_symbol_direction'];
    appMinimumVersionAndroid = json['app_minimum_version_android_deliveryman']?.toDouble();
    // perKmShippingCharge = json['per_km_shipping_charge']?.toDouble();
    // minimumShippingCharge = json['minimum_shipping_charge']?.toDouble();
    freeDeliveryOver =
        (json['free_delivery_over'] != null && json['free_delivery_over'] != 'null') ? double.parse(json['free_delivery_over'].toString()) : null;
    demo = json['demo'];
    maintenanceMode = json['maintenance_mode'];
    popularFood = json['popular_food'];
    popularRestaurant = json['popular_restaurant'];
    newRestaurant = json['new_restaurant'];
    orderConfirmationModel = json['order_confirmation_model'];
    showDmEarning = json['show_dm_earning'];
    canceledByDeliveryman = json['canceled_by_deliveryman'];
    canceledByRestaurant = json['canceled_by_restaurant'];
    timeformat = json['timeformat'];
    toggleVegNonVeg = json['toggle_veg_non_veg'];
    toggleDmRegistration = json['toggle_dm_registration'];
    toggleRestaurantRegistration = json['toggle_restaurant_registration'];
    scheduleOrderSlotDuration = json['schedule_order_slot_duration'];
    digitAfterDecimalPoint = json['digit_after_decimal_point'];
    additionalChargeName = json['additional_charge_name'];
    dmPictureUploadStatus = json['dm_picture_upload_status'] == 1 ? true : false;
    if (json['active_payment_method_list'] != null) {
      activePaymentMethodList = <PaymentBody>[];
      json['active_payment_method_list'].forEach((v) {
        activePaymentMethodList!.add(PaymentBody.fromJson(v));
      });
    }
    deliverymanAdditionalJoinUsPageData = json['deliveryman_additional_join_us_page_data'] != null
        ? DeliverymanAdditionalJoinUsPageData.fromJson(json['deliveryman_additional_join_us_page_data'])
        : null;
    disbursementType = json['disbursement_type'];
    minAmountToPayDm = json['min_amount_to_pay_dm']?.toDouble();
    maintenanceModeData = json['maintenance_mode_data'] != null ? MaintenanceModeData.fromJson(json['maintenance_mode_data']) : null;
    firebaseOtpVerification = json['firebase_otp_verification'] == 1;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['business_name'] = businessName;
    data['logo'] = logo;
    data['address'] = address;
    data['phone'] = phone;
    data['email'] = email;
    data['currency_symbol'] = currencySymbol;
    data['cash_on_delivery'] = cashOnDelivery;
    data['digital_payment'] = digitalPayment;
    data['terms_and_conditions'] = termsAndConditions;
    data['privacy_policy'] = privacyPolicy;
    data['about_us'] = aboutUs;
    data['country'] = country;
    if (defaultLocation != null) {
      data['default_location'] = defaultLocation!.toJson();
    }
    data['app_url_android_deliveryman'] = appUrlAndroidDeliveryman;
    data['app_url_ios_deliveryman'] = appUrlIosDeliveryman;
    data['customer_verification'] = customerVerification;
    data['order_delivery_verification'] = orderDeliveryVerification;
    data['currency_symbol_direction'] = currencySymbolDirection;
    data['app_minimum_version_android_deliveryman'] = appMinimumVersionAndroid;
    // data['per_km_shipping_charge'] = this.perKmShippingCharge;
    // data['minimum_shipping_charge'] = this.minimumShippingCharge;
    data['free_delivery_over'] = freeDeliveryOver;
    data['demo'] = demo;
    data['maintenance_mode'] = maintenanceMode;
    data['popular_food'] = popularFood;
    data['popular_restaurant'] = popularRestaurant;
    data['new_restaurant'] = newRestaurant;
    data['order_confirmation_model'] = orderConfirmationModel;
    data['show_dm_earning'] = showDmEarning;
    data['canceled_by_deliveryman'] = canceledByDeliveryman;
    data['canceled_by_restaurant'] = canceledByRestaurant;
    data['timeformat'] = timeformat;
    data['toggle_veg_non_veg'] = toggleVegNonVeg;
    data['toggle_dm_registration'] = toggleDmRegistration;
    data['toggle_restaurant_registration'] = toggleRestaurantRegistration;
    data['schedule_order_slot_duration'] = scheduleOrderSlotDuration;
    data['digit_after_decimal_point'] = digitAfterDecimalPoint;
    data['additional_charge_name'] = additionalChargeName;
    data['dm_picture_upload_status'] = dmPictureUploadStatus;
    if (activePaymentMethodList != null) {
      data['active_payment_method_list'] = activePaymentMethodList!.map((v) => v.toJson()).toList();
    }
    if (deliverymanAdditionalJoinUsPageData != null) {
      data['deliveryman_additional_join_us_page_data'] = deliverymanAdditionalJoinUsPageData!.toJson();
    }
    data['disbursement_type'] = disbursementType;
    data['min_amount_to_pay_dm'] = minAmountToPayDm;
    if (maintenanceModeData != null) {
      data['maintenance_mode_data'] = maintenanceModeData!.toJson();
    }
    data['firebase_otp_verification'] = firebaseOtpVerification;
    return data;
  }
}

class DefaultLocation {
  String? lat;
  String? lng;

  DefaultLocation({this.lat, this.lng});

  DefaultLocation.fromJson(Map<String, dynamic> json) {
    lat = json['lat'];
    lng = json['lng'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['lat'] = lat;
    data['lng'] = lng;
    return data;
  }
}

class PaymentBody {
  String? getWay;
  String? getWayTitle;
  String? getWayImageFullUrl;

  PaymentBody({this.getWay, this.getWayTitle, this.getWayImageFullUrl});

  PaymentBody.fromJson(Map<String, dynamic> json) {
    getWay = json['gateway'];
    getWayTitle = json['gateway_title'];
    getWayImageFullUrl = json['gateway_image_full_url'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['gateway'] = getWay;
    data['gateway_title'] = getWayTitle;
    data['gateway_image_full_url'] = getWayImageFullUrl;
    return data;
  }
}

class DeliverymanAdditionalJoinUsPageData {
  List<Data>? data;

  DeliverymanAdditionalJoinUsPageData({this.data});

  DeliverymanAdditionalJoinUsPageData.fromJson(Map<String, dynamic> json) {
    if (json['data'] != null) {
      data = <Data>[];
      json['data'].forEach((v) {
        data!.add(Data.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    if (this.data != null) {
      data['data'] = this.data!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Data {
  String? fieldType;
  String? inputData;
  List<String>? checkData;
  MediaData? mediaData;
  String? placeholderData;
  int? isRequired;

  Data({
    this.fieldType,
    this.inputData,
    this.checkData,
    this.mediaData,
    this.placeholderData,
    this.isRequired,
  });

  Data.fromJson(Map<String, dynamic> json) {
    fieldType = json['field_type'];
    inputData = json['input_data'];
    if (json['check_data'] != null) {
      checkData = [];
      json['check_data'].forEach((e) => checkData!.add(e));
    }
    mediaData = json['media_data'] != null ? MediaData.fromJson(json['media_data']) : null;
    placeholderData = json['placeholder_data'];
    isRequired = json['is_required'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['field_type'] = fieldType;
    data['input_data'] = inputData;
    data['check_data'] = checkData;
    if (mediaData != null) {
      data['media_data'] = mediaData!.toJson();
    }
    data['placeholder_data'] = placeholderData;
    data['is_required'] = isRequired;
    return data;
  }
}

class MediaData {
  int? uploadMultipleFiles;
  int? image;
  int? pdf;
  int? docs;

  MediaData({
    this.uploadMultipleFiles,
    this.image,
    this.pdf,
    this.docs,
  });

  MediaData.fromJson(Map<String, dynamic> json) {
    uploadMultipleFiles = json['upload_multiple_files'];
    image = json['image'];
    pdf = json['pdf'];
    docs = json['docs'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['upload_multiple_files'] = uploadMultipleFiles;
    data['image'] = image;
    data['pdf'] = pdf;
    data['docs'] = docs;
    return data;
  }
}

class MaintenanceModeData {
  List<String>? maintenanceSystemSetup;
  MaintenanceDurationSetup? maintenanceDurationSetup;
  MaintenanceMessageSetup? maintenanceMessageSetup;

  MaintenanceModeData({
    this.maintenanceSystemSetup,
    this.maintenanceDurationSetup,
    this.maintenanceMessageSetup,
  });

  MaintenanceModeData.fromJson(Map<String, dynamic> json) {
    maintenanceSystemSetup = json['maintenance_system_setup'].cast<String>();
    maintenanceDurationSetup = json['maintenance_duration_setup'] != null ? MaintenanceDurationSetup.fromJson(json['maintenance_duration_setup']) : null;
    maintenanceMessageSetup = json['maintenance_message_setup'] != null ? MaintenanceMessageSetup.fromJson(json['maintenance_message_setup']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['maintenance_system_setup'] = maintenanceSystemSetup;
    if (maintenanceDurationSetup != null) {
      data['maintenance_duration_setup'] = maintenanceDurationSetup!.toJson();
    }
    if (maintenanceMessageSetup != null) {
      data['maintenance_message_setup'] = maintenanceMessageSetup!.toJson();
    }
    return data;
  }
}

class MaintenanceDurationSetup {
  String? maintenanceDuration;
  String? startDate;
  String? endDate;

  MaintenanceDurationSetup({
    this.maintenanceDuration,
    this.startDate,
    this.endDate,
  });

  MaintenanceDurationSetup.fromJson(Map<String, dynamic> json) {
    maintenanceDuration = json['maintenance_duration'];
    startDate = json['start_date'];
    endDate = json['end_date'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['maintenance_duration'] = maintenanceDuration;
    data['start_date'] = startDate;
    data['end_date'] = endDate;
    return data;
  }
}

class MaintenanceMessageSetup {
  int? businessNumber;
  int? businessEmail;
  String? maintenanceMessage;
  String? messageBody;

  MaintenanceMessageSetup({this.businessNumber, this.businessEmail, this.maintenanceMessage, this.messageBody});

  MaintenanceMessageSetup.fromJson(Map<String, dynamic> json) {
    businessNumber = json['business_number'];
    businessEmail = json['business_email'];
    maintenanceMessage = json['maintenance_message'];
    messageBody = json['message_body'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = <String, dynamic>{};
    data['business_number'] = businessNumber;
    data['business_email'] = businessEmail;
    data['maintenance_message'] = maintenanceMessage;
    data['message_body'] = messageBody;
    return data;
  }
}
