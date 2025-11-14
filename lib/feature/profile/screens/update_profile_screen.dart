import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_image_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_app_bar_widget.dart';
// Auth removed - no longer using AuthController
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/feature/profile/domain/models/profile_model.dart';
import 'package:stackfood_multivendor_driver/feature/profile/widgets/profile_bg_widget.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_text_form_field.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class UpdateProfileScreen extends StatefulWidget {
  const UpdateProfileScreen({super.key});

  @override
  State<UpdateProfileScreen> createState() => _UpdateProfileScreenState();
}

class _UpdateProfileScreenState extends State<UpdateProfileScreen> {

  final FocusNode _firstNameFocus = FocusNode();
  final FocusNode _lastNameFocus = FocusNode();
  final FocusNode _emailFocus = FocusNode();
  final FocusNode _phoneFocus = FocusNode();

  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();

  bool _controllersInitialized = false;

  @override
  void initState() {
    super.initState();

    final profileController = Get.find<ProfileController>();
    // Always fetch fresh profile data when entering edit screen
    profileController.getProfile().then((_) {
      // Initialize controllers after profile is loaded
      if (mounted) {
        _initializeControllers(profileController);
      }
    });
    profileController.initData();
  }

  void _initializeControllers(ProfileController profileController) {
    if (profileController.profileModel != null) {
      // Always update controllers with latest profile data
      // This ensures we get fresh data even if profile was already loaded
      final profile = profileController.profileModel!;
      final currentFirstName = _firstNameController.text;
      final currentLastName = _lastNameController.text;
      
      // Only update if values have changed or controllers are empty
      if (!_controllersInitialized || 
          currentFirstName.isEmpty || 
          currentLastName.isEmpty ||
          currentFirstName != (profile.fName ?? '') ||
          currentLastName != (profile.lName ?? '')) {
        _firstNameController.text = profile.fName ?? '';
        _lastNameController.text = profile.lName ?? '';
        _phoneController.text = profile.phone ?? '';
        _emailController.text = profile.email ?? '';
        _controllersInitialized = true;
        debugPrint('✅ Controllers initialized with profile data:');
        debugPrint('  First Name: ${profile.fName}');
        debugPrint('  Last Name: ${profile.lName}');
        debugPrint('  Email: ${profile.email}');
        debugPrint('  Phone: ${profile.phone}');
      }
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _firstNameFocus.dispose();
    _lastNameFocus.dispose();
    _emailFocus.dispose();
    _phoneFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).cardColor,
      appBar: CustomAppBarWidget(title: 'edit_profile'.tr),
      body: GetBuilder<ProfileController>(builder: (profileController) {
        // Initialize controllers when profile is loaded (will be called on every rebuild)
        // This ensures controllers are updated when profile loads asynchronously
        if (profileController.profileModel != null && !_controllersInitialized) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              _initializeControllers(profileController);
            }
          });
        }

        return profileController.profileModel != null ? ProfileBgWidget(
          backButton: true,
          circularImage: Center(child: Stack(children: [

            ClipOval(child: profileController.pickedFile != null ? GetPlatform.isWeb ? Image.network(
                profileController.pickedFile!.path, width: 100, height: 100, fit: BoxFit.cover) : Image.file(
              File(profileController.pickedFile!.path), width: 100, height: 100, fit: BoxFit.cover) : (profileController.profileModel?.imageFullUrl != null && profileController.profileModel!.imageFullUrl!.isNotEmpty)
              ? CustomImageWidget(
                  image: profileController.profileModel!.imageFullUrl!,
                  height: 100, width: 100, fit: BoxFit.cover,
                )
              : Image.asset(
                  Images.demoProfilePic,
                  height: 100, width: 100, fit: BoxFit.cover,
                )),

            Positioned(
              bottom: 0, right: 0, top: 0, left: 0,
              child: InkWell(
                onTap: () => profileController.pickImage(),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.3), shape: BoxShape.circle,
                    border: Border.all(width: 1, color: Theme.of(context).primaryColor),
                  ),
                  child: Container(
                    margin: const EdgeInsets.all(25),
                    decoration: BoxDecoration(
                      border: Border.all(width: 2, color: Colors.white),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.camera_alt, color: Colors.white),
                  ),
                ),
              ),
            ),
          ])),
          mainWidget: Column(children: [

            Expanded(child: Scrollbar(child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
              child: Center(child: SizedBox(width: 1170, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                CustomTextFormField(
                  hintText: 'first_name'.tr,
                  controller: _firstNameController,
                  focusNode: _firstNameFocus,
                  nextFocus: _lastNameFocus,
                  inputType: TextInputType.name,
                  capitalization: TextCapitalization.words,
                ),
                const SizedBox(height: Dimensions.paddingSizeLarge),

                CustomTextFormField(
                  hintText: 'last_name'.tr,
                  controller: _lastNameController,
                  focusNode: _lastNameFocus,
                  nextFocus: _emailFocus,
                  inputType: TextInputType.name,
                  capitalization: TextCapitalization.words,
                ),
                const SizedBox(height: Dimensions.paddingSizeLarge),

                CustomTextFormField(
                  hintText: 'email'.tr,
                  controller: _emailController,
                  focusNode: _emailFocus,
                  inputAction: TextInputAction.done,
                  inputType: TextInputType.emailAddress,
                ),
                const SizedBox(height: Dimensions.paddingSizeLarge),

                CustomTextFormField(
                  hintText: 'phone'.tr,
                  controller: _phoneController,
                  focusNode: _phoneFocus,
                  inputType: TextInputType.phone,
                  isEnabled: false,
                ),

              ]))),
            ))),

            !profileController.isLoading ? CustomButtonWidget(
              onPressed: () => _updateProfile(profileController),
              margin: const EdgeInsets.all(Dimensions.paddingSizeSmall),
              buttonText: 'update'.tr,
            ) : const Center(child: CircularProgressIndicator()),

          ]),
        ) : const Center(child: CircularProgressIndicator());
      }),
    );
  }

  void _updateProfile(ProfileController profileController) async {
    String firstName = _firstNameController.text.trim();
    String lastName = _lastNameController.text.trim();
    String email = _emailController.text.trim();
    String phoneNumber = _phoneController.text.trim();
    
    debugPrint('📝 Update Profile - Form Data:');
    debugPrint('  First Name: $firstName');
    debugPrint('  Last Name: $lastName');
    debugPrint('  Email: $email');
    debugPrint('  Phone: $phoneNumber');
    debugPrint('  Current Profile:');
    debugPrint('    First Name: ${profileController.profileModel?.fName}');
    debugPrint('    Last Name: ${profileController.profileModel?.lName}');
    debugPrint('    Email: ${profileController.profileModel?.email}');
    debugPrint('    Phone: ${profileController.profileModel?.phone}');
    
    // Check if nothing changed
    if (profileController.profileModel?.fName == firstName &&
        profileController.profileModel?.lName == lastName && 
        profileController.profileModel?.phone == phoneNumber &&
        profileController.profileModel?.email == email && 
        profileController.pickedFile == null) {
      showCustomSnackBar('change_something_to_update'.tr);
      return;
    }
    
    // Validate inputs
    if (firstName.isEmpty) {
      showCustomSnackBar('enter_your_first_name'.tr);
      return;
    }
    if (lastName.isEmpty) {
      showCustomSnackBar('enter_your_last_name'.tr);
      return;
    }
    if (email.isEmpty) {
      showCustomSnackBar('enter_email_address'.tr);
      return;
    }
    if (!GetUtils.isEmail(email)) {
      showCustomSnackBar('enter_a_valid_email_address'.tr);
      return;
    }
    if (phoneNumber.isEmpty) {
      showCustomSnackBar('enter_phone_number'.tr);
      return;
    }
    if (phoneNumber.length < 6) {
      showCustomSnackBar('enter_a_valid_phone_number'.tr);
      return;
    }
    
    // Create updated user model and call update API
    debugPrint('✅ Validation passed, calling update API...');
    ProfileModel updatedUser = ProfileModel(
      fName: firstName, 
      lName: lastName, 
      email: email, 
      phone: phoneNumber
    );
    // Auth removed - pass empty token or modify updateUserInfo to not require token
    await profileController.updateUserInfo(updatedUser, '');
  }

}