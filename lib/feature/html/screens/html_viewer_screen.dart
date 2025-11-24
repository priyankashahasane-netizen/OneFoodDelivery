import 'package:stackfood_multivendor_driver/feature/splash/controllers/splash_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_app_bar_widget.dart';
import 'package:stackfood_multivendor_driver/feature/dashboard/widgets/global_bottom_nav_widget.dart';
import 'package:get/get.dart';
import 'package:url_launcher/url_launcher_string.dart';

class HtmlViewerScreen extends StatefulWidget {
  final bool isPrivacyPolicy;
  const HtmlViewerScreen({super.key, required this.isPrivacyPolicy});

  @override
  State<HtmlViewerScreen> createState() => _HtmlViewerScreenState();
}

class _HtmlViewerScreenState extends State<HtmlViewerScreen> {
  String? _htmlContent;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadContent();
  }

  Future<void> _loadContent() async {
    String? data = widget.isPrivacyPolicy
        ? Get.find<SplashController>().configModel?.privacyPolicy
        : Get.find<SplashController>().configModel?.termsAndConditions;

    // If backend has content, use it; otherwise load from assets as fallback
    if (data != null && data.isNotEmpty) {
      setState(() {
        _htmlContent = data;
        _isLoading = false;
      });
    } else {
      // Load from assets as fallback
      try {
        final String assetPath = widget.isPrivacyPolicy
            ? 'assets/privacy_policy.html'
            : 'assets/terms_and_conditions.html';
        final String assetContent = await rootBundle.loadString(assetPath);
        setState(() {
          _htmlContent = assetContent;
          _isLoading = false;
        });
      } catch (e) {
        // If asset loading fails, show a message
        setState(() {
          _htmlContent = widget.isPrivacyPolicy
              ? '<html><body><h2>Privacy Policy</h2><p>Content not available at this time. Please contact support.</p></body></html>'
              : '<html><body><h2>Terms & Conditions</h2><p>Content not available at this time. Please contact support.</p></body></html>';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: CustomAppBarWidget(
        title: widget.isPrivacyPolicy ? 'privacy_policy'.tr : 'terms_condition'.tr,
        showMenuButton: false,
      ),
      bottomNavigationBar: const GlobalBottomNavWidget(),
      body: Container(
        height: MediaQuery.of(context).size.height,
        width: MediaQuery.of(context).size.width,
        color: Theme.of(context).cardColor,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
                physics: const BouncingScrollPhysics(),
                child: HtmlWidget(
                  _htmlContent ?? '',
                  key: Key(widget.isPrivacyPolicy ? 'privacy_policy' : 'terms_condition'),
                  onTapUrl: (String url) {
                    return launchUrlString(url, mode: LaunchMode.externalApplication);
                  },
                ),
              ),
      ),
    );
  }
}