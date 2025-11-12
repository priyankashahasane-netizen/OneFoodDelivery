import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:stackfood_multivendor_driver/feature/dashboard/screens/dashboard_screen.dart';
import 'package:stackfood_multivendor_driver/feature/splash/controllers/splash_controller.dart';
import 'package:stackfood_multivendor_driver/feature/notification/domain/models/notification_body_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/auth_controller.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class SplashScreen extends StatefulWidget {
  final NotificationBodyModel? body;
  const SplashScreen({super.key, required this.body});
  @override
  SplashScreenState createState() => SplashScreenState();
}

class SplashScreenState extends State<SplashScreen> {

  final GlobalKey<ScaffoldState> _globalKey = GlobalKey();
  StreamSubscription<List<ConnectivityResult>>? _onConnectivityChanged;

  @override
  void initState() {
    super.initState();

    bool firstTime = true;
    _onConnectivityChanged = Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> result) {
      // Fix: Include ethernet and check for any non-none connection (macOS support)
      bool isConnected = result.contains(ConnectivityResult.wifi) || 
                         result.contains(ConnectivityResult.mobile) ||
                         result.contains(ConnectivityResult.ethernet) ||
                         result.any((r) => r != ConnectivityResult.none);

      if(!firstTime) {
        ScaffoldMessenger.of(Get.context!).hideCurrentSnackBar();
        ScaffoldMessenger.of(Get.context!).showSnackBar(SnackBar(
          backgroundColor: isConnected ? Colors.green : Colors.red,
          duration: const Duration(seconds: 3),
          content: Text(isConnected ? 'connected'.tr : 'no_connection'.tr, textAlign: TextAlign.center),
        ));
        if(isConnected) {
          _route();
        }
      }

      firstTime = false;
    });

    Get.find<SplashController>().initSharedData();
    _route();
  }

  @override
  void dispose() {
    super.dispose();

    _onConnectivityChanged?.cancel();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _globalKey,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(Dimensions.paddingSizeLarge),
          child: Column(mainAxisSize: MainAxisSize.min, children: [

            Image.asset(Images.logo, width: 150),
            const SizedBox(height: Dimensions.paddingSizeLarge),

            Image.asset(Images.logoName, width: 150),
            const SizedBox(height: Dimensions.paddingSizeSmall),

            Text('suffix_name'.tr, style: robotoMedium, textAlign: TextAlign.center),

          ]),
        ),
      ),
    );
  }

  void _route() {
    Get.find<SplashController>().getConfigData().then((isSuccess) {
      if(isSuccess) {
        Timer(const Duration(seconds: 1), () async {
          double? minimumVersion = 0;
          if(GetPlatform.isAndroid) {
            minimumVersion = Get.find<SplashController>().configModel!.appMinimumVersionAndroid;
          }
          if(AppConstants.appVersion < minimumVersion! || (Get.find<SplashController>().configModel!.maintenanceMode! && Get.find<SplashController>().configModel!.maintenanceModeData!.maintenanceSystemSetup!.contains('deliveryman_app'))) {
            Get.offNamed(RouteHelper.getUpdateRoute(AppConstants.appVersion < minimumVersion));
          }else {
            if(widget.body != null) {
              if(widget.body!.notificationType == NotificationType.order || widget.body!.notificationType == NotificationType.assign){
                Get.toNamed(RouteHelper.getOrderDetailsRoute(widget.body!.orderId, fromNotification: true));
              }else if(widget.body!.notificationType == NotificationType.order_request){
                Get.toNamed(RouteHelper.getMainRoute('order-request'));
              }else if(widget.body!.notificationType == NotificationType.message){
                Get.toNamed(RouteHelper.getChatRoute(notificationBody: widget.body, conversationId: widget.body!.conversationId, fromNotification: true));
              }else if(widget.body!.notificationType == NotificationType.unassign){
                Get.to(const DashboardScreen(pageIndex: 1));
              }else{
                Get.toNamed(RouteHelper.getNotificationRoute(fromNotification: true));
              }
            }else{
              // Auto-login with demo account if not already logged in
              AuthController authController = Get.find<AuthController>();
              
              if(!authController.isLoggedIn()) {
                // Demo account credentials
                String demoPhone = '+919975008124'; // or '9975008124'
                String demoPassword = 'Pri@0110';
                
                // Attempt auto-login
                try {
                  ResponseModel loginResult = await authController.login(demoPhone, demoPassword);
                  
                  if(loginResult.isSuccess && authController.getUserToken().isNotEmpty) {
                    // Login successful - fetch profile
                    try {
                      await Get.find<ProfileController>().getProfile();
                    } catch (e) {
                      debugPrint('Profile fetch failed: $e');
                      // Continue anyway
                    }
                    // Navigate to home screen
                    Get.offAllNamed(RouteHelper.getInitialRoute());
                  } else {
                    // Login failed - navigate anyway (might work with cached token)
                    debugPrint('Auto-login failed: ${loginResult.message}');
                    Get.offAllNamed(RouteHelper.getInitialRoute());
                  }
                } catch (e) {
                  debugPrint('Auto-login error: $e');
                  // Navigate anyway - might have cached token
                  Get.offAllNamed(RouteHelper.getInitialRoute());
                }
              } else {
                // Already logged in - just fetch profile and navigate
                try {
                  await Get.find<ProfileController>().getProfile();
                } catch (e) {
                  debugPrint('Profile fetch failed: $e');
                }
                Get.offAllNamed(RouteHelper.getInitialRoute());
              }
            }
          }
        });
      } else {
        // Config fetch failed - try to auto-login anyway
        Timer(const Duration(seconds: 1), () async {
          AuthController authController = Get.find<AuthController>();
          
          if(!authController.isLoggedIn()) {
            try {
              String demoPhone = '+919975008124';
              String demoPassword = 'Pri@0110';
              ResponseModel loginResult = await authController.login(demoPhone, demoPassword);
              
              if(loginResult.isSuccess && authController.getUserToken().isNotEmpty) {
                try {
                  await Get.find<ProfileController>().getProfile();
                } catch (e) {
                  debugPrint('Profile fetch failed: $e');
                }
              }
            } catch (e) {
              debugPrint('Auto-login error: $e');
            }
          }
          
          // Navigate to home regardless
          Get.offAllNamed(RouteHelper.getInitialRoute());
        });
      }
    });
  }

}