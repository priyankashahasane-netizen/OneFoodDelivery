import 'dart:async';
import 'dart:io';
import 'package:stackfood_multivendor_driver/feature/language/controllers/localization_controller.dart';
import 'package:stackfood_multivendor_driver/feature/splash/controllers/splash_controller.dart';
import 'package:stackfood_multivendor_driver/common/controllers/theme_controller.dart';
import 'package:stackfood_multivendor_driver/feature/notification/domain/models/notification_body_model.dart';
import 'package:stackfood_multivendor_driver/helper/notification_helper.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/theme/dark_theme.dart';
import 'package:stackfood_multivendor_driver/theme/light_theme.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:stackfood_multivendor_driver/util/messages.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get/get.dart';
import 'package:url_strategy/url_strategy.dart';
import 'helper/get_di.dart' as di;

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

Future<void> main() async {
  if(!GetPlatform.isWeb) {
    HttpOverrides.global = MyHttpOverrides();
  }
  setPathUrlStrategy();
  WidgetsFlutterBinding.ensureInitialized();
  Map<String, Map<String, String>> languages = await di.init();

  // Initialize Aadhaar Auth Service (optional - requires UIDAI credentials)
  // Uncomment and configure with your AUA credentials when ready to use
  /*
  try {
    AadhaarAuthService.initialize(
      auaCode: 'YOUR_AUA_CODE',
      saCode: 'YOUR_SUB_AUA_CODE',
      licenseKey: 'YOUR_LICENSE_KEY',
      environment: Environment.STAGING, // or Environment.PRODUCTION
    );
  } catch (e) {
    debugPrint('Aadhaar service initialization failed: $e');
  }
  */

  // Initialize local notifications (Firebase removed, using local notifications only)
  NotificationBodyModel? body;
  try {
    if (GetPlatform.isMobile) {
      await NotificationHelper.initialize(flutterLocalNotificationsPlugin);
    }
  } catch(_) {}

  runApp(MyApp(languages: languages, body: body));
}

class MyApp extends StatelessWidget {
  final Map<String, Map<String, String>>? languages;
  final NotificationBodyModel? body;
  const MyApp({super.key, required this.languages, required this.body});

  void _route() {
    Get.find<SplashController>().getConfigData().then((bool isSuccess) async {
      // Removed auth check - app starts directly on home screen
    });
  }

  @override
  Widget build(BuildContext context) {
    if(GetPlatform.isWeb) {
      Get.find<SplashController>().initSharedData();
      _route();
    }

    return GetBuilder<ThemeController>(builder: (themeController) {
      return GetBuilder<LocalizationController>(builder: (localizeController) {
        return GetBuilder<SplashController>(builder: (splashController) {
          return (GetPlatform.isWeb && splashController.configModel == null) ? const SizedBox() : GetMaterialApp(
            title: AppConstants.appName,
            debugShowCheckedModeBanner: false,
            navigatorKey: Get.key,
            theme: themeController.darkTheme ? dark : light,
            locale: localizeController.locale,
            translations: Messages(languages: languages),
            fallbackLocale: Locale(AppConstants.languages[0].languageCode!, AppConstants.languages[0].countryCode),
            initialRoute: RouteHelper.getSplashRoute(body),
            getPages: RouteHelper.routes,
            defaultTransition: Transition.topLevel,
            transitionDuration: const Duration(milliseconds: 500),
            builder: (BuildContext context, widget) {
              return MediaQuery(data: MediaQuery.of(context).copyWith(textScaler: const TextScaler.linear(1.0)), child: Material(
                child: SafeArea(
                  top: false, bottom: GetPlatform.isAndroid,
                  child: Stack(children: [
                    widget!,
                  ]),
                ),
              ));
            },
          );
        });
      });
    });
  }
}

class MyHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) {
    return super.createHttpClient(context)..badCertificateCallback = (X509Certificate cert, String host, int port) => true;
  }
}