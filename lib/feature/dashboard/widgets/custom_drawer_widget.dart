import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_image_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/feature/language/controllers/localization_controller.dart';
import 'package:stackfood_multivendor_driver/feature/language/widgets/language_bottom_sheet_widget.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';

class CustomDrawerWidget extends StatelessWidget {
  final int? currentPageIndex;
  final Function(int)? onPageChange;
  final bool isFromDashboard;

  const CustomDrawerWidget({
    super.key,
    this.currentPageIndex,
    this.onPageChange,
    this.isFromDashboard = true,
  });

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: Container(
        color: Theme.of(context).cardColor,
        child: Column(
          children: [
            // Profile Section Header
            GetBuilder<ProfileController>(
              builder: (profileController) {
                final profileModel = profileController.profileModel;
                final name = profileModel != null
                    ? '${profileModel.fName} ${profileModel.lName}'
                    : 'User Name';
                final email = profileModel?.email ?? 'info@binary-fusion.com';

                return Container(
                  padding: EdgeInsets.only(
                    top: MediaQuery.of(context).padding.top + Dimensions.paddingSizeSmall,
                    left: Dimensions.paddingSizeDefault,
                    right: Dimensions.paddingSizeDefault,
                    bottom: Dimensions.paddingSizeDefault,
                  ),
                  child: Column(
                    children: [
                      // Profile Picture
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            width: 2,
                            color: Theme.of(context).primaryColor,
                          ),
                        ),
                        child: ClipOval(
                          child: (profileModel?.imageFullUrl != null && profileModel!.imageFullUrl!.isNotEmpty)
                            ? CustomImageWidget(
                                image: profileModel.imageFullUrl!,
                                height: 80,
                                width: 80,
                                fit: BoxFit.cover,
                                placeholder: Images.placeholder,
                              )
                            : Image.asset(
                                Images.demoProfilePic,
                                height: 80,
                                width: 80,
                                fit: BoxFit.cover,
                              ),
                        ),
                      ),
                      const SizedBox(height: Dimensions.paddingSizeSmall),
                      
                      // Name
                      Text(
                        name,
                        style: robotoBold.copyWith(
                          fontSize: Dimensions.fontSizeLarge,
                          color: Theme.of(context).textTheme.bodyLarge!.color,
                        ),
                      ),
                      const SizedBox(height: Dimensions.paddingSizeExtraSmall),
                      
                      // Email
                      Text(
                        email,
                        style: robotoRegular.copyWith(
                          fontSize: Dimensions.fontSizeSmall,
                          color: Theme.of(context).hintColor,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),

            // Divider
            Divider(
              height: 1,
              thickness: 1,
              color: Theme.of(context).disabledColor.withValues(alpha: 0.3),
            ),

            // Menu Items
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _DrawerMenuItem(
                    icon: Icons.home,
                    title: 'home'.tr,
                    isSelected: isFromDashboard && currentPageIndex == 0,
                    onTap: () {
                      Navigator.pop(context);
                      if (isFromDashboard && onPageChange != null) {
                        onPageChange!(0);
                      } else {
                        Get.offNamedUntil('/main?page=home', (route) => route.settings.name == '/main' || route.settings.name == '/');
                      }
                    },
                  ),
                  _DrawerMenuItem(
                    icon: Icons.delivery_dining,
                    title: 'orders'.tr,
                    isSelected: isFromDashboard && currentPageIndex == 2,
                    onTap: () {
                      Navigator.pop(context);
                      if (isFromDashboard && onPageChange != null) {
                        onPageChange!(2);
                      } else {
                        Get.offNamedUntil('/main?page=order', (route) => route.settings.name == '/main' || route.settings.name == '/');
                      }
                    },
                  ),
                  _DrawerMenuItem(
                    icon: Icons.person,
                    title: 'profile'.tr,
                    isSelected: isFromDashboard && currentPageIndex == 4,
                    onTap: () {
                      Navigator.pop(context);
                      if (isFromDashboard && onPageChange != null) {
                        onPageChange!(4);
                      } else {
                        Get.offNamedUntil('/main?page=profile', (route) => route.settings.name == '/main' || route.settings.name == '/');
                      }
                    },
                  ),
                  GetBuilder<ProfileController>(
                    builder: (profileController) {
                      if (profileController.profileModel?.earnings == 1) {
                        return _DrawerMenuItem(
                          icon: Icons.account_balance_wallet,
                          title: 'wallet'.tr,
                          onTap: () {
                            Navigator.pop(context);
                            Get.toNamed(RouteHelper.getCashInHandRoute());
                          },
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                  GetBuilder<ProfileController>(
                    builder: (profileController) {
                      if (profileController.profileModel?.earnings == 1) {
                        return _DrawerMenuItem(
                          icon: Icons.account_balance,
                          title: 'bank_details'.tr,
                          onTap: () {
                            Navigator.pop(context);
                            Get.toNamed(RouteHelper.getWithdrawMethodRoute(isFromDashBoard: false));
                          },
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                  _DrawerMenuItem(
                    icon: Icons.inbox,
                    title: 'inbox'.tr,
                    onTap: () {
                      Navigator.pop(context);
                      Get.toNamed(RouteHelper.getConversationListRoute());
                    },
                  ),
                  _DrawerMenuItem(
                    icon: Icons.language,
                    title: 'language'.tr,
                    onTap: () {
                      Navigator.pop(context);
                      _showLanguageBottomSheet(context);
                    },
                  ),
                  _DrawerMenuItem(
                    icon: Icons.phone,
                    title: 'contact_us'.tr,
                    onTap: () {
                      Navigator.pop(context);
                      _showContactDialog(context);
                    },
                  ),
                  _DrawerMenuItem(
                    icon: Icons.description,
                    title: 'terms_condition'.tr,
                    onTap: () {
                      Navigator.pop(context);
                      Get.toNamed(RouteHelper.getTermsRoute());
                    },
                  ),
                  _DrawerMenuItem(
                    icon: Icons.privacy_tip,
                    title: 'privacy_policy'.tr,
                    onTap: () {
                      Navigator.pop(context);
                      Get.toNamed(RouteHelper.getPrivacyRoute());
                    },
                  ),
                ],
              ),
            ),

            // Divider
            Divider(
              height: 1,
              thickness: 1,
              color: Theme.of(context).disabledColor.withValues(alpha: 0.3),
            ),

            // Log out
            _DrawerMenuItem(
              icon: Icons.logout,
              title: 'log_out'.tr,
              onTap: () {
                Navigator.pop(context);
                // Add logout functionality
                // Since auth was removed, you may want to navigate to splash or show a message
                Get.snackbar(
                  'log_out'.tr,
                  'logout_feature_not_available'.tr,
                  snackPosition: SnackPosition.BOTTOM,
                );
              },
            ),
            SizedBox(height: Dimensions.paddingSizeSmall),
          ],
        ),
      ),
    );
  }

  void _showLanguageBottomSheet(BuildContext context) {
    Get.find<LocalizationController>().saveCacheLanguage(null);
    Get.find<LocalizationController>().searchSelectedLanguage();

    showModalBottomSheet(
      isScrollControlled: true,
      useRootNavigator: true,
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(Dimensions.radiusExtraLarge),
          topRight: Radius.circular(Dimensions.radiusExtraLarge),
        ),
      ),
      builder: (context) {
        return ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.8,
          ),
          child: const LanguageBottomSheetWidget(),
        );
      },
    ).then((value) => Get.find<LocalizationController>().setLanguage(
          Get.find<LocalizationController>().getCacheLocaleFromSharedPref(),
        ));
  }

  void _showContactDialog(BuildContext context) {
    // Contact information
    const String address = '1905, Cyber One, Plot No. 4&6, behind Odisha Bhavan, Sector 30A, Vashi, Navi Mumbai, Maharashtra 400703';
    const String email = 'support@onefooddelivery.com';
    const String phone = '+91-8450940705';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('contact_us'.tr),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Address
              ListTile(
                leading: const Icon(Icons.location_on),
                title: const Text('Address', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(address),
                contentPadding: EdgeInsets.zero,
                minLeadingWidth: 24,
              ),
              const SizedBox(height: Dimensions.paddingSizeSmall),
              
              // Email
              ListTile(
                leading: const Icon(Icons.email),
                title: const Text('Email Id', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(email),
                onTap: () async {
                  final uri = Uri.parse('mailto:$email');
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri);
                  } else {
                    showCustomSnackBar('can_not_launch'.tr);
                  }
                },
                contentPadding: EdgeInsets.zero,
                minLeadingWidth: 24,
              ),
              const SizedBox(height: Dimensions.paddingSizeSmall),
              
              // Phone
              ListTile(
                leading: const Icon(Icons.phone),
                title: const Text('Contact Number', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(phone),
                onTap: () async {
                  final uri = Uri.parse('tel:$phone');
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri);
                  } else {
                    showCustomSnackBar('can_not_launch'.tr);
                  }
                },
                contentPadding: EdgeInsets.zero,
                minLeadingWidth: 24,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('close'.tr),
          ),
        ],
      ),
    );
  }
}

class _DrawerMenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final bool isSelected;
  final VoidCallback onTap;

  const _DrawerMenuItem({
    required this.icon,
    required this.title,
    this.isSelected = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: Dimensions.paddingSizeDefault,
          vertical: Dimensions.paddingSizeSmall,
        ),
        decoration: BoxDecoration(
          color: isSelected
              ? Theme.of(context).primaryColor.withValues(alpha: 0.1)
              : Colors.transparent,
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected
                  ? Theme.of(context).primaryColor
                  : Theme.of(context).textTheme.bodyLarge!.color,
              size: 24,
            ),
            const SizedBox(width: Dimensions.paddingSizeDefault),
            Expanded(
              child: Text(
                title,
                style: robotoRegular.copyWith(
                  fontSize: Dimensions.fontSizeDefault,
                  color: isSelected
                      ? Theme.of(context).primaryColor
                      : Theme.of(context).textTheme.bodyLarge!.color,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

