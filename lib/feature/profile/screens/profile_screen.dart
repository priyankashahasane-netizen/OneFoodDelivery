import 'package:flutter/cupertino.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_bottom_sheet_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_confirmation_bottom_sheet.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_image_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/details_custom_card.dart';
import 'package:stackfood_multivendor_driver/feature/auth/controllers/auth_controller.dart';
import 'package:stackfood_multivendor_driver/feature/language/controllers/localization_controller.dart';
import 'package:stackfood_multivendor_driver/feature/language/widgets/language_bottom_sheet_widget.dart';
import 'package:stackfood_multivendor_driver/feature/splash/controllers/splash_controller.dart';
import 'package:stackfood_multivendor_driver/common/controllers/theme_controller.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/feature/profile/widgets/profile_bg_widget.dart';
import 'package:stackfood_multivendor_driver/feature/profile/widgets/profile_button_widget.dart';
import 'package:stackfood_multivendor_driver/feature/profile/widgets/profile_card_widget.dart';
import 'package:stackfood_multivendor_driver/helper/date_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late final AppLifecycleListener _listener;

  @override
  void initState() {
    super.initState();

    _listener = AppLifecycleListener(
      onStateChange: _onStateChanged,
    );
    Get.find<ProfileController>().getProfile();
  }

  void _onStateChanged(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.detached:
        break;
      case AppLifecycleState.resumed:
        checkBatteryPermission();
        break;
      case AppLifecycleState.inactive:
        break;
      case AppLifecycleState.hidden:
        break;
      case AppLifecycleState.paused:
        break;
    }
  }

  void checkBatteryPermission() async {
    Future.delayed(const Duration(milliseconds: 400), () async {
      if(await Permission.ignoreBatteryOptimizations.status.isDenied) {
        Get.find<ProfileController>().setBackgroundNotificationActive(false);
      } else {
        Get.find<ProfileController>().setBackgroundNotificationActive(true);
      }
    });
  }

  @override
  dispose() {
    _listener.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GetBuilder<ProfileController>(builder: (profileController) {
        return profileController.profileModel == null ? const Center(child: CircularProgressIndicator()) : ProfileBgWidget(
          backButton: false,
          circularImage: Container(
            decoration: BoxDecoration(
              border: Border.all(width: 2, color: Theme.of(context).cardColor),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: ClipOval(child: CustomImageWidget(
              image: '${profileController.profileModel != null ? profileController.profileModel!.imageFullUrl : ''}',
              height: 100, width: 100, fit: BoxFit.cover,
            )),
          ),
          mainWidget: SingleChildScrollView(physics: const BouncingScrollPhysics(), child: Center(child: Container(
            width: 1170,
            padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
            child: Column(children: [

              Text(
                '${profileController.profileModel!.fName} ${profileController.profileModel!.lName}',
                style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge),
              ),

              profileController.profileModel!.shiftName != null ? RichText(text: TextSpan(children: [
                TextSpan(text: '${'shift'.tr}: ', style: robotoMedium.copyWith(color: Theme.of(context).textTheme.bodyLarge!.color, fontSize: Dimensions.fontSizeSmall)),
                TextSpan(text: ' ${profileController.profileModel!.shiftName}', style: robotoMedium.copyWith(color: Theme.of(context).primaryColor, fontSize: Dimensions.fontSizeSmall)),
                TextSpan(text: ' (${DateConverter.onlyTimeShow(profileController.profileModel!.shiftStartTime!)} - ${DateConverter.onlyTimeShow(profileController.profileModel!.shiftEndTime!)})',
                    style: robotoMedium.copyWith(color: Theme.of(context).primaryColor, fontSize: Dimensions.fontSizeSmall)),
              ])) : const SizedBox(),
              const SizedBox(height: 30),

              Row(children: [

                ProfileCardWidget(title: 'since_joining'.tr, data: '${profileController.profileModel!.memberSinceDays} ${'days'.tr}'),
                const SizedBox(width: Dimensions.paddingSizeSmall),

                ProfileCardWidget(title: 'total_order'.tr, data: profileController.profileModel!.orderCount.toString()),

              ]),
              const SizedBox(height: 30),

              ProfileButtonWidget(icon: Icons.dark_mode, title: 'dark_mode'.tr, isButtonActive: Get.isDarkMode, onTap: () {
                Get.find<ThemeController>().toggleTheme();
              }),
              const SizedBox(height: Dimensions.paddingSizeSmall),

              ProfileButtonWidget(
                icon: Icons.notifications, title: 'system_notification'.tr,
                isButtonActive: profileController.notification, onTap: () {
                profileController.setNotificationActive(!profileController.notification);
                },
              ),
              const SizedBox(height: Dimensions.paddingSizeSmall),

              InkWell(
                onTap: () {
                  showBgNotificationBottomSheet(profileController.backgroundNotification);
                },
                child: DetailsCustomCard(
                  padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeSmall, vertical: 8),
                  child: Row(children: [

                    const Icon(Icons.notifications_active_rounded, size: 25),
                    const SizedBox(width: Dimensions.paddingSizeSmall),

                    Expanded(child: Text('background_notification'.tr, style: robotoRegular)),

                    CupertinoSwitch(
                      value: profileController.backgroundNotification,
                      activeTrackColor: Theme.of(context).primaryColor,
                      inactiveTrackColor: Theme.of(context).disabledColor.withValues(alpha: 0.5),
                      onChanged: (bool isActive) {
                        showBgNotificationBottomSheet(profileController.backgroundNotification);
                      },
                    ),
                  ]),
                ),
              ),
              const SizedBox(height: Dimensions.paddingSizeSmall),

              ProfileButtonWidget(icon: Icons.chat_bubble, title: 'conversation'.tr, onTap: () {
                Get.toNamed(RouteHelper.getConversationListRoute());
              }),
              const SizedBox(height: Dimensions.paddingSizeSmall),

              ProfileButtonWidget(icon: Icons.language, title: 'language'.tr, onTap: () {
                _manageLanguageFunctionality();
              }),
              const SizedBox(height: Dimensions.paddingSizeSmall),

              ProfileButtonWidget(icon: Icons.lock, title: 'change_password'.tr, onTap: () {
                Get.toNamed(RouteHelper.getResetPasswordRoute('', '', 'password-change'));
              }),
              const SizedBox(height: Dimensions.paddingSizeSmall),

              ProfileButtonWidget(icon: Icons.edit, title: 'edit_profile'.tr, onTap: () {
                Get.toNamed(RouteHelper.getUpdateProfileRoute());
              }),
              const SizedBox(height: Dimensions.paddingSizeSmall),

              (profileController.profileModel != null && profileController.profileModel!.earnings == 1) ? Padding(
                padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
                child: ProfileButtonWidget(icon: Icons.account_balance, title: 'my_account'.tr, onTap: () {
                  Get.toNamed(RouteHelper.getCashInHandRoute());
                }),
              ) : const SizedBox(),

              (profileController.profileModel!.type != 'restaurant_wise' && profileController.profileModel!.earnings != 0) ? ProfileButtonWidget(icon: Icons.local_offer_rounded, title: 'incentive_offers'.tr, onTap: () {
                Get.toNamed(RouteHelper.getIncentiveRoute());
              }) : const SizedBox(),
              SizedBox(height: (profileController.profileModel!.type != 'restaurant_wise' && profileController.profileModel!.earnings != 0) ? Dimensions.paddingSizeSmall : 0),

              if(Get.find<SplashController>().configModel!.disbursementType == 'automated' && profileController.profileModel!.type != 'restaurant_wise' && profileController.profileModel!.earnings != 0)
              Column(children: [

                 Padding(
                  padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
                  child: ProfileButtonWidget(icon: Icons.payments, title: 'disbursement'.tr, onTap: () {
                    Get.toNamed(RouteHelper.getDisbursementRoute());
                  }),
                ),

                ProfileButtonWidget(icon: Icons.money, title: 'disbursement_methods'.tr, onTap: () {
                  Get.toNamed(RouteHelper.getWithdrawMethodRoute());
                }),
                const SizedBox(height: Dimensions.paddingSizeSmall),

              ]),

              ProfileButtonWidget(icon: Icons.list, title: 'terms_condition'.tr, onTap: () {
                Get.toNamed(RouteHelper.getTermsRoute());
              }),
              const SizedBox(height: Dimensions.paddingSizeSmall),

              ProfileButtonWidget(icon: Icons.privacy_tip, title: 'privacy_policy'.tr, onTap: () {
                Get.toNamed(RouteHelper.getPrivacyRoute());
              }),
              const SizedBox(height: Dimensions.paddingSizeSmall),

              ProfileButtonWidget(
                icon: Icons.delete, title: 'delete_account'.tr,
                onTap: () {
                  showCustomBottomSheet(
                    child: CustomConfirmationBottomSheet(
                      cancelButtonText: 'no'.tr, confirmButtonText: 'yes'.tr,
                      title: 'are_you_sure_to_delete_account'.tr,
                      description: 'it_will_remove_your_all_information'.tr,
                      onConfirm: () {
                        profileController.removeDriver();
                      },
                    ),
                  );
                },
              ),
              const SizedBox(height: Dimensions.paddingSizeSmall),

              ProfileButtonWidget(icon: Icons.logout, title: 'logout'.tr, onTap: () {
                showCustomBottomSheet(
                  child: CustomConfirmationBottomSheet(
                    cancelButtonText: 'no'.tr, confirmButtonText: 'yes'.tr,
                    title: 'logout'.tr,
                    description: 'are_you_sure_to_logout'.tr,
                    onConfirm: () {
                      Get.find<AuthController>().clearSharedData();
                      profileController.stopLocationRecord();
                      Get.offAllNamed(RouteHelper.getSignInRoute());
                    },
                  ),
                );
              }),
              const SizedBox(height: Dimensions.paddingSizeLarge),

              Row(mainAxisAlignment: MainAxisAlignment.center, children: [

                Text('${'version'.tr}:', style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeExtraSmall)),
                const SizedBox(width: Dimensions.paddingSizeExtraSmall),

                Text(AppConstants.appVersion.toString(), style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeExtraSmall)),

              ]),

            ]),
          ))),
        );
      }),
    );
  }

  void showBgNotificationBottomSheet(bool allow) {
    Get.bottomSheet(Container(
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: const BorderRadius.only(topLeft: Radius.circular(Dimensions.radiusExtraLarge), topRight: Radius.circular(Dimensions.radiusExtraLarge)),
      ),
      padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
      child: Column(mainAxisSize: MainAxisSize.min, children: [

        Container(
          height: 5, width: 50,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(Dimensions.radiusLarge),
            color: Theme.of(context).disabledColor,
          ),
        ),
        const SizedBox(height: Dimensions.paddingSizeLarge),

        Text(
          '${!allow ? 'allow'.tr : 'disable'.tr} ${AppConstants.appName} ${!allow ? 'to_run_notification_in_background'.tr : 'from_running_notification_in_background'.tr}',
          textAlign: TextAlign.center,
          style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge),
        ),

        allow ? Text(
          '(${AppConstants.appName} -> Battery -> Select Optimized)',
          textAlign: TextAlign.center,
          style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).primaryColor),
        ) : const SizedBox(),
        const SizedBox(height: Dimensions.paddingSizeLarge),

        _buildInfoText("you_will_be_able_to_get_order_notification_even_if_you_are_not_in_the_app".tr),
        _buildInfoText("${AppConstants.appName} ${!allow ? 'will_run_notification_service_in_the_background_always'.tr : 'will_not_run_notification_service_in_the_background_always'.tr}"),
        _buildInfoText(!allow ? "notification_will_always_send_alert_from_the_background".tr : 'notification_will_not_always_send_alert_from_the_background'.tr),
        const SizedBox(height: 20.0),

        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text("cancel".tr, style: robotoMedium),
            ),
            const SizedBox(width: Dimensions.paddingSizeSmall),

            ElevatedButton(
              onPressed: () async {
                if(await Permission.ignoreBatteryOptimizations.status.isGranted) {
                  openAppSettings();
                } else {
                  await Permission.ignoreBatteryOptimizations.request();
                }
                Get.back();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).primaryColor,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8.0),
                ),
              ),
              child: Text(
                "okay".tr,
                style: robotoMedium.copyWith(color: Theme.of(context).cardColor),
              ),
            ),
          ],
        ),
      ]),
    ), isScrollControlled: true).then((value) {
      checkBatteryPermission();
    });
  }

  Widget _buildInfoText(String text) {
    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
      margin: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
      decoration: BoxDecoration(
        color: Theme.of(context).disabledColor.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(8.0),
      ),
      child: Text(
        text,
        style: robotoRegular,
      ),
    );
  }

  _manageLanguageFunctionality() {
    Get.find<LocalizationController>().saveCacheLanguage(null);
    Get.find<LocalizationController>().searchSelectedLanguage();

    showModalBottomSheet(
      isScrollControlled: true, useRootNavigator: true, context: Get.context!,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(topLeft: Radius.circular(Dimensions.radiusExtraLarge), topRight: Radius.circular(Dimensions.radiusExtraLarge)),
      ),
      builder: (context) {
        return ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.8),
          child: const LanguageBottomSheetWidget(),
        );
      },
    ).then((value) => Get.find<LocalizationController>().setLanguage(Get.find<LocalizationController>().getCacheLocaleFromSharedPref()));
  }

}