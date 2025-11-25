import 'package:stackfood_multivendor_driver/feature/disbursements/helper/disbursement_helper.dart';
import 'package:stackfood_multivendor_driver/feature/home/screens/home_screen.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/dashboard/controllers/drawer_controller.dart' as drawer_ctrl;
import 'package:stackfood_multivendor_driver/feature/dashboard/controllers/bottom_nav_controller.dart';
import 'package:stackfood_multivendor_driver/feature/dashboard/widgets/bottom_nav_item_widget.dart';
import 'package:stackfood_multivendor_driver/feature/dashboard/widgets/custom_drawer_widget.dart';
import 'package:stackfood_multivendor_driver/feature/order/screens/order_screen.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/feature/profile/screens/profile_screen.dart';
import 'package:stackfood_multivendor_driver/feature/order/screens/order_request_screen.dart';
import 'package:stackfood_multivendor_driver/feature/map/screens/todays_map_screen.dart';
import 'package:stackfood_multivendor_driver/helper/custom_print_helper.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_alert_dialog_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';

class DashboardScreen extends StatefulWidget {
  final int pageIndex;
  const DashboardScreen({super.key, required this.pageIndex});

  @override
  DashboardScreenState createState() => DashboardScreenState();
}

class DashboardScreenState extends State<DashboardScreen> {

  DisbursementHelper disbursementHelper = DisbursementHelper();

  PageController? _pageController;
  int _pageIndex = 0;
  late List<Widget> _screens;
  final _channel = const MethodChannel('com.sixamtech/app_retain');
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _scaffoldKeySet = false;

  @override
  void initState() {
    super.initState();

    _pageIndex = widget.pageIndex;

    _pageController = PageController(initialPage: widget.pageIndex);

    // Register drawer controller if not already registered
    if (!Get.isRegistered<drawer_ctrl.AppDrawerController>()) {
      Get.put(drawer_ctrl.AppDrawerController());
    }

    // Update bottom nav controller with current page index (defer to avoid build phase issues)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (Get.isRegistered<BottomNavController>()) {
        Get.find<BottomNavController>().setCurrentIndex(_pageIndex);
      }
    });

    _screens = [
      const HomeScreen(),
      OrderRequestScreen(onTap: () => _setPage(0)),
      const OrderScreen(isActiveOrders: false), // My Orders
      const TodaysMapScreen(), // Today's Map
      const ProfileScreen(),
    ];

    // Set scaffold key after widget is built
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scaffoldKey.currentState != null && Get.isRegistered<drawer_ctrl.AppDrawerController>()) {
        Get.find<drawer_ctrl.AppDrawerController>().setScaffoldKey(_scaffoldKey);
        _scaffoldKeySet = true;
      }
    });

    showDisbursementWarningMessage();
    Get.find<OrderController>().getLatestOrders();

    customPrint('dashboard call');
    // Firebase Messaging removed - notifications can be handled via backend webhooks
    // _stream subscription removed - use alternative notification service if needed
  }

  void _navigateRequestPage() {
    if(Get.find<ProfileController>().profileModel != null && Get.find<ProfileController>().profileModel!.active == 1
        && Get.find<OrderController>().currentOrderList != null && Get.find<OrderController>().currentOrderList!.isEmpty) {
      _setPage(1);
    }else {
      if(Get.find<ProfileController>().profileModel == null || Get.find<ProfileController>().profileModel!.active == 0) {
        Get.dialog(CustomAlertDialogWidget(description: 'you_are_offline_now'.tr, onOkPressed: () => Get.back()));
      }else {
        _setPage(1);
      }
    }
  }

  // Future _disableBatteryOptimization() async {
  //   bool isDisabled = await DisableBatteryOptimization.isBatteryOptimizationDisabled ?? false;
  //
  //   if(!isDisabled) {
  //     DisableBatteryOptimization.showDisableBatteryOptimizationSettings();
  //   }
  // }

  @override
  void dispose() {
    super.dispose();
    // Stream subscription removed - Firebase Messaging no longer used
  }

  showDisbursementWarningMessage() async {
    disbursementHelper.enableDisbursementWarningMessage(true);
  }

  @override
  Widget build(BuildContext context) {
    // Set scaffold key immediately when scaffold state is available
    if (_scaffoldKey.currentState != null) {
      if (Get.isRegistered<drawer_ctrl.AppDrawerController>()) {
        Get.find<drawer_ctrl.AppDrawerController>().setScaffoldKey(_scaffoldKey);
        _scaffoldKeySet = true;
      }
    }
    
    // Also set it after build to ensure it's captured
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scaffoldKey.currentState != null) {
        if (Get.isRegistered<drawer_ctrl.AppDrawerController>()) {
          Get.find<drawer_ctrl.AppDrawerController>().setScaffoldKey(_scaffoldKey);
          _scaffoldKeySet = true;
        }
      }
    });
    
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async{
        if(_pageIndex != 0) {
          _setPage(0);
        }else {
          if (GetPlatform.isAndroid && Get.find<ProfileController>().profileModel!.active == 1) {
            _channel.invokeMethod('sendToBackground');
          } else {
            return;
          }
        }
      },
      child: Scaffold(
        key: _scaffoldKey,
        drawer: CustomDrawerWidget(
          currentPageIndex: _pageIndex,
          onPageChange: _setPage,
          isFromDashboard: true,
        ),

        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: Theme.of(context).cardColor,
            boxShadow: [BoxShadow(color: Get.isDarkMode ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05), blurRadius: 10, spreadRadius: 0, offset: Offset(0, 0))],
          ),
          child: Padding(
            padding: const EdgeInsets.all(Dimensions.paddingSizeExtraSmall),
            child: Row(children: [

              BottomNavItemWidget(icon: Images.homeIcon, isSelected: _pageIndex == 0, onTap: () => _setPage(0)),

              BottomNavItemWidget(icon: Images.orderRequestIcon, isSelected: _pageIndex == 1, pageIndex: 1, onTap: () {
                _navigateRequestPage();
              }),

              BottomNavItemWidget(icon: Images.myOrderIcon, isSelected: _pageIndex == 2, onTap: () => _setPage(2)),

              BottomNavItemWidget(iconData: Icons.map_outlined, isSelected: _pageIndex == 3, onTap: () => _setPage(3), iconSize: 22),

              BottomNavItemWidget(icon: Images.personIcon, isSelected: _pageIndex == 4, onTap: () => _setPage(4)),

            ]),
          ),
        ),

        body: PageView.builder(
          controller: _pageController,
          itemCount: _screens.length,
          physics: const NeverScrollableScrollPhysics(),
          itemBuilder: (context, index) {
            return _screens[index];
          },
        ),
      ),
    );
  }

  void _setPage(int pageIndex) {
    setState(() {
      _pageController!.jumpToPage(pageIndex);
      _pageIndex = pageIndex;
    });
    // Update bottom nav controller (defer to avoid build phase issues)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (Get.isRegistered<BottomNavController>()) {
        Get.find<BottomNavController>().setCurrentIndex(pageIndex);
      }
    });
  }
}