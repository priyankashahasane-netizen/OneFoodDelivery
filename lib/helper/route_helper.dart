import 'dart:convert';
import 'package:stackfood_multivendor_driver/feature/notification/domain/models/notification_body_model.dart';
import 'package:stackfood_multivendor_driver/feature/cash_in_hand/screens/cash_in_hand_screen.dart';
import 'package:stackfood_multivendor_driver/feature/cash_in_hand/screens/transaction_history_screen.dart';
import 'package:stackfood_multivendor_driver/feature/cash_in_hand/screens/payment_screen.dart';
import 'package:stackfood_multivendor_driver/feature/cash_in_hand/screens/payment_successful_screen.dart';
import 'package:stackfood_multivendor_driver/feature/dashboard/screens/dashboard_screen.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/screens/add_withdraw_method_screen.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/screens/disbursement_screen.dart';
import 'package:stackfood_multivendor_driver/feature/disbursements/screens/withdraw_method_screen.dart';
import 'package:stackfood_multivendor_driver/feature/html/screens/html_viewer_screen.dart';
import 'package:stackfood_multivendor_driver/feature/language/screens/language_screen.dart';
import 'package:stackfood_multivendor_driver/feature/notification/screens/notification_screen.dart';
import 'package:stackfood_multivendor_driver/feature/order/screens/order_details_screen.dart';
import 'package:stackfood_multivendor_driver/feature/profile/screens/update_profile_screen.dart';
import 'package:stackfood_multivendor_driver/feature/splash/screens/splash_screen.dart';
import 'package:stackfood_multivendor_driver/feature/update/screens/update_screen.dart';
import 'package:stackfood_multivendor_driver/feature/auth/screens/registration_step1_screen.dart';
import 'package:stackfood_multivendor_driver/feature/auth/screens/registration_step2_screen.dart';
import 'package:stackfood_multivendor_driver/feature/auth/screens/registration_step3_screen.dart';
import 'package:stackfood_multivendor_driver/feature/auth/screens/registration_step4_screen.dart';
import 'package:stackfood_multivendor_driver/feature/auth/screens/registration_step5_screen.dart';
import 'package:stackfood_multivendor_driver/feature/auth/screens/registration_step6_screen.dart';
import 'package:stackfood_multivendor_driver/feature/auth/screens/registration_step7_screen.dart';
import 'package:stackfood_multivendor_driver/feature/auth/screens/registration_step8_screen.dart';
import 'package:stackfood_multivendor_driver/feature/auth/screens/otp_login_screen.dart';
import 'package:stackfood_multivendor_driver/feature/auth/screens/otp_signup_screen.dart';
import 'package:stackfood_multivendor_driver/feature/auth/screens/otp_verification_screen.dart';
import 'package:stackfood_multivendor_driver/feature/auth/screens/driver_info_screen.dart';
import 'package:stackfood_multivendor_driver/feature/forgot_password/screens/forgot_password_screen.dart';
import 'package:stackfood_multivendor_driver/feature/forgot_password/screens/verification_screen.dart';
import 'package:stackfood_multivendor_driver/feature/forgot_password/screens/new_password_screen.dart';
import 'package:get/get.dart';

class RouteHelper {
  static const String initial = '/';
  static const String splash = '/splash';
  static const String main = '/main';
  static const String orderDetails = '/order-details';
  static const String updateProfile = '/update-profile';
  static const String notification = '/notification';
  static const String terms = '/terms-and-condition';
  static const String privacy = '/privacy-policy';
  static const String language = '/language';
  static const String update = '/update';
  static const String cashInHand = '/cash-in-hand';
  static const String disbursement = '/disbursement';
  static const String withdrawMethod = '/withdraw-method';
  static const String addWithdrawMethod = '/add-withdraw-method';
  static const String success = '/success';
  static const String payment = '/payment';
  static const String transactionHistory = '/transaction-history';
  static const String registrationStep1 = '/registration-step-1';
  static const String registrationStep2 = '/registration-step-2';
  static const String registrationStep3 = '/registration-step-3';
  static const String registrationStep4 = '/registration-step-4';
  static const String registrationStep5 = '/registration-step-5';
  static const String registrationStep6 = '/registration-step-6';
  static const String registrationStep7 = '/registration-step-7';
  static const String registrationStep8 = '/registration-step-8';
  static const String otpLogin = '/otp-login';
  static const String otpSignup = '/otp-signup';
  static const String otpVerification = '/otp-verification';
  static const String forgotPassword = '/forgot-password';
  static const String forgotPasswordVerification = '/forgot-password-verification';
  static const String resetPassword = '/reset-password';
  static const String driverInfo = '/driver-info';


  static String getInitialRoute() => initial;
  static String getSplashRoute(NotificationBodyModel? body) {
    String data = 'null';
    if(body != null) {
      List<int> encoded = utf8.encode(jsonEncode(body.toJson()));
      data = base64Encode(encoded);
    }
    return '$splash?data=$data';
  }
  static String getMainRoute(String page) => '$main?page=$page';
  static String getOrderDetailsRoute(int? id, {bool fromNotification = false}) => '$orderDetails?id=$id&from_notification=${fromNotification.toString()}';
  static String getUpdateProfileRoute() => updateProfile;
  static String getNotificationRoute({bool fromNotification = false}) => '$notification?from_notification=${fromNotification.toString()}';
  static String getTermsRoute() => terms;
  static String getPrivacyRoute() => privacy;
  static String getLanguageRoute() => language;
  static String getUpdateRoute(bool isUpdate) => '$update?update=${isUpdate.toString()}';
  static String getCashInHandRoute() => cashInHand;
  static String getDisbursementRoute() => disbursement;
  static String getWithdrawMethodRoute({bool isFromDashBoard = false}) => '$withdrawMethod?is_from_dashboard=${isFromDashBoard.toString()}';
  static String getAddWithdrawMethodRoute() => addWithdrawMethod;
  static String getSuccessRoute(String status) => '$success?status=$status';
  static String getPaymentRoute(String? redirectUrl) {
    return '$payment?redirect-url=$redirectUrl';
  }
  static String getTransactionHistoryRoute() => transactionHistory;
  static String getRegistrationStep1Route() => registrationStep1;
  static String getRegistrationStep2Route() => registrationStep2;
  static String getRegistrationStep3Route() => registrationStep3;
  static String getRegistrationStep4Route() => registrationStep4;
  static String getRegistrationStep5Route() => registrationStep5;
  static String getRegistrationStep6Route() => registrationStep6;
  static String getRegistrationStep7Route() => registrationStep7;
  static String getRegistrationStep8Route() => registrationStep8;
  static String getOtpLoginRoute() => otpLogin;
  static String getOtpSignupRoute() => otpSignup;
  static String getOtpVerificationRoute() => otpVerification;
  static String getForgotPasswordRoute() => forgotPassword;
  static String getForgotPasswordVerificationRoute(String phone, {String? session}) => '$forgotPasswordVerification?phone=$phone${session != null ? '&session=$session' : ''}';
  static String getResetPasswordRoute(String? phone, String? token, String type) => '$resetPassword?phone=$phone&token=$token&type=$type';
  static String getDriverInfoRoute() => driverInfo;


  static List<GetPage> routes = [
    GetPage(name: initial, page: () => const DashboardScreen(pageIndex: 0)),
    GetPage(name: splash, page: () {
      NotificationBodyModel? data;
      if(Get.parameters['data'] != 'null') {
        List<int> decode = base64Decode(Get.parameters['data']!.replaceAll(' ', '+'));
        data = NotificationBodyModel.fromJson(jsonDecode(utf8.decode(decode)));
      }
      return SplashScreen(body: data);
    }),
    GetPage(name: main, page: () => DashboardScreen(
      pageIndex: Get.parameters['page'] == 'home' ? 0 : Get.parameters['page'] == 'order-request' ? 1
          : Get.parameters['page'] == 'order' ? 2 : Get.parameters['page'] == 'map' ? 3 : Get.parameters['page'] == 'profile' ? 4 : 0,
    )),
    GetPage(name: orderDetails, page: () {
      OrderDetailsScreen? orderDetails = Get.arguments;
      return orderDetails ?? OrderDetailsScreen(
        orderId: int.parse(Get.parameters['id']!), orderIndex: null, isRunningOrder: null,
      );
    }),
    GetPage(name: updateProfile, page: () => const UpdateProfileScreen()),
    GetPage(name: notification, page: () => NotificationScreen(fromNotification: Get.parameters['from_notification'] == 'true')),
    GetPage(name: terms, page: () => const HtmlViewerScreen(isPrivacyPolicy: false)),
    GetPage(name: privacy, page: () => const HtmlViewerScreen(isPrivacyPolicy: true)),
    GetPage(name: language, page: () => ChooseLanguageScreen()),
    GetPage(name: update, page: () => UpdateScreen(isUpdate: Get.parameters['update'] == 'true')),
    // Delivery man registration removed - simplified to JWT auth only
    // GetPage(name: deliveryManRegistration, page: () => const DeliveryManRegistrationScreen()),
    GetPage(name: cashInHand, page: () => const CashInHandScreen()),
    GetPage(name: disbursement, page: () => const DisbursementScreen()),
    GetPage(name: withdrawMethod, page: () => WithdrawMethodScreen(isFromDashboard: Get.parameters['is_from_dashboard'] == 'true')),
    GetPage(name: addWithdrawMethod, page: () => const AddWithDrawMethodScreen()),
    GetPage(name: success, page: () => PaymentSuccessfulScreen(success: Get.parameters['status'] == 'success')),
    GetPage(name: payment, page: () {
      String walletPayment = Get.parameters['redirect-url']!;
      return PaymentScreen(redirectUrl: walletPayment);
    }),
    GetPage(name: transactionHistory, page: () => const TransactionHistoryScreen()),
    GetPage(name: registrationStep1, page: () {
      final args = Get.arguments as Map<String, dynamic>?;
      return RegistrationStep1Screen(phone: args?['phone'] ?? '');
    }),
    GetPage(name: registrationStep2, page: () => const RegistrationStep2Screen()),
    GetPage(name: registrationStep3, page: () => const RegistrationStep3Screen()),
    GetPage(name: registrationStep4, page: () => const RegistrationStep4Screen()),
    GetPage(name: registrationStep5, page: () => const RegistrationStep5Screen()),
    GetPage(name: registrationStep6, page: () => const RegistrationStep6Screen()),
    GetPage(name: registrationStep7, page: () => const RegistrationStep7Screen()),
    GetPage(name: registrationStep8, page: () => const RegistrationStep8Screen()),
    GetPage(name: otpLogin, page: () => OtpLoginScreen()),
    GetPage(name: otpSignup, page: () => OtpSignupScreen()),
    GetPage(name: otpVerification, page: () => const OtpVerificationScreen()),
    GetPage(name: driverInfo, page: () => DriverInfoScreen()),
    GetPage(name: forgotPassword, page: () => const ForgotPasswordScreen()),
    GetPage(name: forgotPasswordVerification, page: () {
      final phone = Get.parameters['phone'] ?? '';
      final session = Get.parameters['session'];
      return VerificationScreen(number: phone, firebaseSession: session);
    }),
    GetPage(name: resetPassword, page: () {
      final phone = Get.parameters['phone'];
      final token = Get.parameters['token'];
      final type = Get.parameters['type'] ?? 'reset-password';
      return NewPasswordScreen(
        resetToken: token,
        number: phone,
        fromPasswordChange: type == 'change-password',
      );
    }),

  ];
}