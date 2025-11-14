import 'package:flutter/cupertino.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_bottom_sheet_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_confirmation_bottom_sheet.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_image_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/details_custom_card.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_app_bar_widget.dart';
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
import 'package:stackfood_multivendor_driver/util/images.dart';
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
      appBar: CustomAppBarWidget(title: 'profile'.tr, isBackButtonExist: false),
      body: GetBuilder<ProfileController>(builder: (profileController) {
        return profileController.profileModel == null ? const Center(child: CircularProgressIndicator()) : ProfileBgWidget(
          backButton: false,
          circularImage: Container(
            decoration: BoxDecoration(
              border: Border.all(width: 2, color: Theme.of(context).cardColor),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: ClipOval(child: (profileController.profileModel?.imageFullUrl != null && profileController.profileModel!.imageFullUrl!.isNotEmpty)
              ? CustomImageWidget(
                  image: profileController.profileModel!.imageFullUrl!,
                  height: 100, width: 100, fit: BoxFit.cover,
                )
              : Image.asset(
                  Images.demoProfilePic,
                  height: 100, width: 100, fit: BoxFit.cover,
                )),
          ),
          mainWidget: SingleChildScrollView(physics: const BouncingScrollPhysics(), child: Center(child: Container(
            width: 1170,
            padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
            child: Column(children: [

              Text(
                '${profileController.profileModel?.fName ?? ''} ${profileController.profileModel?.lName ?? ''}'.trim().isEmpty 
                    ? 'Driver' 
                    : '${profileController.profileModel?.fName ?? ''} ${profileController.profileModel?.lName ?? ''}'.trim(),
                style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge),
              ),

              (profileController.profileModel?.shiftName != null && profileController.profileModel?.shiftName?.isNotEmpty == true) ? RichText(text: TextSpan(children: [
                TextSpan(text: '${'shift'.tr}: ', style: robotoMedium.copyWith(color: Theme.of(context).textTheme.bodyLarge!.color, fontSize: Dimensions.fontSizeSmall)),
                TextSpan(text: ' ${profileController.profileModel?.shiftName}', style: robotoMedium.copyWith(color: Theme.of(context).primaryColor, fontSize: Dimensions.fontSizeSmall)),
                TextSpan(text: ' (${_formatShiftTime(profileController.profileModel?.shiftStartTime)} - ${_formatShiftTime(profileController.profileModel?.shiftEndTime)})',
                    style: robotoMedium.copyWith(color: Theme.of(context).primaryColor, fontSize: Dimensions.fontSizeSmall)),
              ])) : const SizedBox(),
              const SizedBox(height: Dimensions.paddingSizeDefault),

              // Contact Information Section - Displayed from API data
              if ((profileController.profileModel?.phone != null && profileController.profileModel!.phone!.isNotEmpty) ||
                  (profileController.profileModel?.email != null && profileController.profileModel!.email!.isNotEmpty))
                DetailsCustomCard(
                  padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('contact_information'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge)),
                      const SizedBox(height: Dimensions.paddingSizeDefault),
                      // Phone number from API
                      if (profileController.profileModel?.phone != null && profileController.profileModel!.phone!.isNotEmpty)
                        Row(children: [
                          Icon(Icons.phone, size: 20, color: Theme.of(context).primaryColor),
                          const SizedBox(width: Dimensions.paddingSizeSmall),
                          Expanded(child: Text(profileController.profileModel!.phone ?? '', style: robotoRegular)),
                        ]),
                      // Spacing between phone and email if both are present
                      if ((profileController.profileModel?.phone != null && profileController.profileModel!.phone!.isNotEmpty) && 
                          (profileController.profileModel?.email != null && profileController.profileModel!.email!.isNotEmpty))
                        const SizedBox(height: Dimensions.paddingSizeSmall),
                      // Email from API
                      if (profileController.profileModel?.email != null && profileController.profileModel!.email!.isNotEmpty)
                        Row(children: [
                          Icon(Icons.email, size: 20, color: Theme.of(context).primaryColor),
                          const SizedBox(width: Dimensions.paddingSizeSmall),
                          Expanded(child: Text(profileController.profileModel!.email ?? '', style: robotoRegular)),
                        ]),
                    ],
                  ),
                ),
              if ((profileController.profileModel?.phone != null && profileController.profileModel!.phone!.isNotEmpty) ||
                  (profileController.profileModel?.email != null && profileController.profileModel!.email!.isNotEmpty))
                const SizedBox(height: Dimensions.paddingSizeDefault),

              // Rating Information - Displayed from API data
              if (profileController.profileModel?.avgRating != null)
                DetailsCustomCard(
                  padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Rating number from API
                      Text('${profileController.profileModel?.avgRating ?? 0.0}', 
                        style: robotoBold.copyWith(fontSize: Dimensions.fontSizeExtraLarge, color: Theme.of(context).primaryColor)),
                      const SizedBox(width: Dimensions.paddingSizeSmall),
                      // Star rating visualization from API
                      _buildStarRating(profileController.profileModel?.avgRating ?? 0.0),
                      const SizedBox(width: Dimensions.paddingSizeSmall),
                      // Rating count from API
                      Expanded(
                        child: Text('${profileController.profileModel?.ratingCount ?? 0} ${'ratings'.tr}', 
                          style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).hintColor)),
                      ),
                    ],
                  ),
                ),
              if (profileController.profileModel?.avgRating != null)
                const SizedBox(height: Dimensions.paddingSizeDefault),

              // Statistics Cards Row 1
              Row(children: [
                ProfileCardWidget(title: 'since_joining'.tr, data: '${profileController.profileModel?.memberSinceDays ?? 0} ${'days'.tr}'),
                const SizedBox(width: Dimensions.paddingSizeSmall),
                ProfileCardWidget(title: 'total_order'.tr, data: '${profileController.profileModel?.orderCount ?? 0}'),
              ]),
              const SizedBox(height: Dimensions.paddingSizeSmall),

              // Additional Order Statistics
              if ((profileController.profileModel?.todaysOrderCount ?? 0) > 0 || (profileController.profileModel?.thisWeekOrderCount ?? 0) > 0)
                Row(children: [
                  ProfileCardWidget(title: 'todays_orders'.tr, data: '${profileController.profileModel?.todaysOrderCount ?? 0}'),
                  const SizedBox(width: Dimensions.paddingSizeSmall),
                  ProfileCardWidget(title: 'this_week_orders'.tr, data: '${profileController.profileModel?.thisWeekOrderCount ?? 0}'),
                ]),
              if ((profileController.profileModel?.todaysOrderCount ?? 0) > 0 || (profileController.profileModel?.thisWeekOrderCount ?? 0) > 0)
                const SizedBox(height: Dimensions.paddingSizeDefault),

              // Earnings Section (if enabled)
              if (profileController.profileModel != null && (profileController.profileModel?.earnings ?? 0) == 1)
                DetailsCustomCard(
                  padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Icon(Icons.account_balance_wallet, color: Theme.of(context).primaryColor, size: 24),
                        const SizedBox(width: Dimensions.paddingSizeSmall),
                        Text('earnings'.tr, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge)),
                      ]),
                      const SizedBox(height: Dimensions.paddingSizeDefault),
                      Row(children: [
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text('today'.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).hintColor)),
                            const SizedBox(height: Dimensions.paddingSizeExtraSmall),
                            Text(
                              _formatPriceWithoutSymbol(profileController.profileModel?.todaysEarning ?? 0.0),
                              style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge, color: Theme.of(context).primaryColor),
                            ),
                          ]),
                        ),
                        Container(height: 30, width: 1, color: Theme.of(context).disabledColor),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.center, children: [
                            Text('this_week'.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).hintColor)),
                            const SizedBox(height: Dimensions.paddingSizeExtraSmall),
                            Text(
                              _formatPriceWithoutSymbol(profileController.profileModel?.thisWeekEarning ?? 0.0),
                              style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge, color: Theme.of(context).primaryColor),
                            ),
                          ]),
                        ),
                        Container(height: 30, width: 1, color: Theme.of(context).disabledColor),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                            Text('this_month'.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).hintColor)),
                            const SizedBox(height: Dimensions.paddingSizeExtraSmall),
                            Text(
                              _formatPriceWithoutSymbol(profileController.profileModel?.thisMonthEarning ?? 0.0),
                              style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge, color: Theme.of(context).primaryColor),
                            ),
                          ]),
                        ),
                      ]),
                      if (profileController.profileModel?.balance != null)
                        Padding(
                          padding: const EdgeInsets.only(top: Dimensions.paddingSizeDefault),
                          child: Row(children: [
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).primaryColor.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(Dimensions.radiusSmall),
                                ),
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text('balance'.tr, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Theme.of(context).hintColor)),
                                  const SizedBox(height: Dimensions.paddingSizeExtraSmall),
                                  Text(
                                    _formatPriceWithoutSymbol(profileController.profileModel?.balance ?? 0.0),
                                    style: robotoBold.copyWith(fontSize: Dimensions.fontSizeDefault, color: Theme.of(context).primaryColor),
                                  ),
                                ]),
                              ),
                            ),
                          ]),
                        ),
                    ],
                  ),
                ),
              if (profileController.profileModel != null && (profileController.profileModel?.earnings ?? 0) == 1)
                const SizedBox(height: Dimensions.paddingSizeDefault),
              const SizedBox(height: Dimensions.paddingSizeSmall),

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

              // Change password button removed - auth is no longer required

              ProfileButtonWidget(icon: Icons.edit, title: 'edit_profile'.tr, onTap: () {
                Get.toNamed(RouteHelper.getUpdateProfileRoute());
              }),
              const SizedBox(height: Dimensions.paddingSizeSmall),

              (profileController.profileModel != null && (profileController.profileModel?.earnings ?? 0) == 1) ? Padding(
                padding: const EdgeInsets.only(bottom: Dimensions.paddingSizeSmall),
                child: ProfileButtonWidget(icon: Icons.account_balance, title: 'my_account'.tr, onTap: () {
                  Get.toNamed(RouteHelper.getCashInHandRoute());
                }),
              ) : const SizedBox(),

              if(Get.find<SplashController>().configModel?.disbursementType == 'automated' && (profileController.profileModel?.type ?? '') != 'restaurant_wise' && (profileController.profileModel?.earnings ?? 0) != 0)
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

              // Logout button removed - auth is no longer required
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

  String _formatShiftTime(String? time) {
    if (time == null || time.isEmpty) {
      return '--';
    }
    try {
      return DateConverter.onlyTimeShow(time);
    } catch (e) {
      return '--';
    }
  }

  String _formatPriceWithoutSymbol(double price) {
    // Format price with commas but without currency symbol
    final int decimalPlaces = Get.find<SplashController>().configModel?.digitAfterDecimalPoint ?? 2;
    final String formatted = price.toStringAsFixed(decimalPlaces)
        .replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},');
    return formatted;
  }

  Widget _buildStarRating(double rating) {
    int fullStars = rating.floor();
    bool hasHalfStar = (rating - fullStars) >= 0.5;
    int emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return Row(
      children: [
        // Full stars
        ...List.generate(fullStars, (index) => Icon(
          Icons.star,
          color: Colors.amber,
          size: 20,
        )),
        // Half star if needed
        if (hasHalfStar)
          Icon(
            Icons.star_half,
            color: Colors.amber,
            size: 20,
          ),
        // Empty stars
        ...List.generate(emptyStars, (index) => Icon(
          Icons.star_border,
          color: Colors.grey.shade400,
          size: 20,
        )),
      ],
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