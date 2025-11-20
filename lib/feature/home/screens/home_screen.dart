import 'package:permission_handler/permission_handler.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_bottom_sheet_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_card.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_confirmation_bottom_sheet.dart';
import 'package:stackfood_multivendor_driver/feature/dashboard/controllers/drawer_controller.dart' as drawer_ctrl;
import 'package:stackfood_multivendor_driver/feature/home/widgets/order_count_card_widget.dart';
import 'package:stackfood_multivendor_driver/feature/notification/controllers/notification_controller.dart';
import 'package:stackfood_multivendor_driver/feature/order/controllers/order_controller.dart';
import 'package:stackfood_multivendor_driver/feature/home/widgets/count_card_widget.dart';
import 'package:stackfood_multivendor_driver/feature/home/widgets/shift_dialogue_widget.dart';
import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/helper/price_converter_helper.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';
import 'package:stackfood_multivendor_driver/util/color_resources.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/images.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_button_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/order_shimmer_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/order_widget.dart';
import 'package:stackfood_multivendor_driver/common/widgets/title_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_switch/flutter_switch.dart';
import 'package:get/get.dart';
import 'package:shimmer_animation/shimmer_animation.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' as ll;
import 'package:geolocator/geolocator.dart';
import 'dart:async';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {

  late final AppLifecycleListener _listener;
  bool _isNotificationPermissionGranted = true;
  bool _isBatteryOptimizationGranted = true;
  final MapController _mapController = MapController();
  ll.LatLng? _currentLocation;
  bool _isLoadingLocation = false;
  StreamSubscription<Position>? _locationStreamSubscription;

  @override
  void initState() {
    super.initState();

    _listener = AppLifecycleListener(
      onStateChange: _onStateChanged,
    );

    _loadData();
    _getCurrentLocation();
    _startLocationTrackingIfOnline();

    Future.delayed(const Duration(milliseconds: 200), () {
      checkPermission();
    });
  }

  Future<void> _getCurrentLocation({bool forceGPS = false}) async {
    try {
      setState(() {
        _isLoadingLocation = true;
      });

      // Check if driver is offline - if so, use home address coordinates
      // Skip this check if forceGPS is true (e.g., when going online)
      if (!forceGPS) {
        final profileController = Get.find<ProfileController>();
        final profileModel = profileController.profileModel;
        
        if (profileModel != null) {
          final isOffline = (profileModel.active ?? 0) == 0;
          
          if (isOffline && profileModel.homeAddressLatitude != null && profileModel.homeAddressLongitude != null) {
            // Driver is offline - use home address coordinates
            if (kDebugMode) {
              debugPrint('Driver is offline - using home address location');
            }
            setState(() {
              _currentLocation = ll.LatLng(
                profileModel.homeAddressLatitude!,
                profileModel.homeAddressLongitude!,
              );
              _isLoadingLocation = false;
            });
            // Move map to home address location
            _mapController.move(_currentLocation!, 15.0);
            return;
          }
        }
      }

      // Driver is online - get current GPS location
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (kDebugMode) {
          debugPrint('Location services are disabled');
        }
        setState(() {
          _isLoadingLocation = false;
          _currentLocation = const ll.LatLng(0.0, 0.0); // Default location
        });
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (kDebugMode) {
            debugPrint('Location permissions are denied');
          }
          setState(() {
            _isLoadingLocation = false;
            _currentLocation = const ll.LatLng(0.0, 0.0); // Default location
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (kDebugMode) {
          debugPrint('Location permissions are permanently denied');
        }
        setState(() {
          _isLoadingLocation = false;
          _currentLocation = const ll.LatLng(0.0, 0.0); // Default location
        });
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        _currentLocation = ll.LatLng(position.latitude, position.longitude);
        _isLoadingLocation = false;
      });

      // Move map to current location
      _mapController.move(_currentLocation!, 15.0);
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Error getting location: $e');
      }
      setState(() {
        _isLoadingLocation = false;
        _currentLocation = const ll.LatLng(0.0, 0.0); // Default location
      });
    }
  }

  // Listen to the app lifecycle state changes
  void _onStateChanged(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.detached:
        break;
      case AppLifecycleState.resumed:
        checkPermission();
        _getCurrentLocation(); // Refresh location when app resumes (will use home address if offline)
        _startLocationTrackingIfOnline(); // Restart tracking if online
        break;
      case AppLifecycleState.paused:
        // Pause tracking when app is in background to save battery
        _stopLiveLocationTracking();
        break;
      case AppLifecycleState.inactive:
        break;
      case AppLifecycleState.hidden:
        break;
    }
  }

  Future<void> _loadData() async {
    debugPrint('🔄 HomeScreen._loadData: Starting data load');
    Get.find<OrderController>().getIgnoreList();
    Get.find<OrderController>().removeFromIgnoreList();
    Get.find<ProfileController>().getShiftList();
    await Get.find<ProfileController>().getProfile();
    // Use isDataClear: true to ensure fresh data on initial load
    await Get.find<OrderController>().getCurrentOrders(status: Get.find<OrderController>().selectedRunningOrderStatus ?? 'all', isDataClear: true);
    await Get.find<OrderController>().getCompletedOrders(offset: 1, status: 'all', isUpdate: false);
    await Get.find<NotificationController>().getNotificationList();
    // Refresh location when data is refreshed
    _getCurrentLocation();
    // Update location tracking based on current online/offline status
    _startLocationTrackingIfOnline();
    debugPrint('✅ HomeScreen._loadData: Data load complete');
  }

  Future<void> checkPermission() async {
    try {
      var notificationStatus = await Permission.notification.status;
      var batteryStatus = await Permission.ignoreBatteryOptimizations.status;

      if(notificationStatus.isDenied || notificationStatus.isPermanentlyDenied) {
        setState(() {
          _isNotificationPermissionGranted = false;
          _isBatteryOptimizationGranted = true;
        });
      } else if(batteryStatus.isDenied) {
        setState(() {
          _isBatteryOptimizationGranted = false;
          _isNotificationPermissionGranted = true;
        });
      } else {
        setState(() {
          _isNotificationPermissionGranted = true;
          _isBatteryOptimizationGranted = true;
        });
        Get.find<ProfileController>().setBackgroundNotificationActive(true);
      }

      if(batteryStatus.isDenied) {
        Get.find<ProfileController>().setBackgroundNotificationActive(false);
      }
    } catch (e) {
      // Permission handler not available on this platform (e.g., macOS/web)
      // Default to granted state
      setState(() {
        _isNotificationPermissionGranted = true;
        _isBatteryOptimizationGranted = true;
      });
    }
  }

  Future<void> requestNotificationPermission() async {
    try {
      if (await Permission.notification.request().isGranted) {
        checkPermission();
        return;
      } else {
        await openAppSettings();
      }
      checkPermission();
    } catch (e) {
      // Permission handler not available on this platform
      setState(() {
        _isNotificationPermissionGranted = true;
      });
    }
  }

  void requestBatteryOptimization() async {
    try {
      var status = await Permission.ignoreBatteryOptimizations.status;

      if (status.isGranted) {
        return;
      } else if(status.isDenied) {
        await Permission.ignoreBatteryOptimizations.request();
      } else {
        openAppSettings();
      }
      checkPermission();
    } catch (e) {
      // Permission handler not available on this platform
      setState(() {
        _isBatteryOptimizationGranted = true;
      });
    }
  }


  void _startLocationTrackingIfOnline() {
    final profileController = Get.find<ProfileController>();
    final profileModel = profileController.profileModel;
    
    if (profileModel != null && (profileModel.active ?? 0) == 1) {
      // Driver is online - start live location tracking
      _startLiveLocationTracking();
    } else {
      // Driver is offline - stop tracking
      _stopLiveLocationTracking();
    }
  }

  void _startLiveLocationTracking() async {
    // Stop any existing stream
    await _stopLiveLocationTracking();

    try {
      // Check location permissions
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (kDebugMode) {
          debugPrint('Location services are disabled - cannot start live tracking');
        }
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (kDebugMode) {
            debugPrint('Location permissions are denied - cannot start live tracking');
          }
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (kDebugMode) {
          debugPrint('Location permissions are permanently denied - cannot start live tracking');
        }
        return;
      }

      // Start listening to location updates
      _locationStreamSubscription = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 10, // Update every 10 meters
        ),
      ).listen(
        (Position position) {
          if (mounted) {
            setState(() {
              _currentLocation = ll.LatLng(position.latitude, position.longitude);
            });
            // Smoothly move map to new location
            _mapController.move(_currentLocation!, _mapController.camera.zoom);
            
            if (kDebugMode) {
              debugPrint('📍 Live location update: ${position.latitude}, ${position.longitude}');
            }
          }
        },
        onError: (error) {
          if (kDebugMode) {
            debugPrint('Error in location stream: $error');
          }
        },
      );

      if (kDebugMode) {
        debugPrint('✅ Started live location tracking');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Error starting live location tracking: $e');
      }
    }
  }

  Future<void> _stopLiveLocationTracking() async {
    await _locationStreamSubscription?.cancel();
    _locationStreamSubscription = null;
    if (kDebugMode) {
      debugPrint('🛑 Stopped live location tracking');
    }
  }

  @override
  void dispose() {
    _listener.dispose();
    _stopLiveLocationTracking();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(

      appBar: AppBar(
        backgroundColor: Theme.of(context).cardColor,
        surfaceTintColor: Theme.of(context).cardColor,
        shadowColor: Theme.of(context).disabledColor.withValues(alpha: 0.5),
        elevation: 2,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () {
              // Use the drawer controller to open the parent Scaffold's drawer
              if (Get.isRegistered<drawer_ctrl.AppDrawerController>()) {
                final controller = Get.find<drawer_ctrl.AppDrawerController>();
                controller.openDrawer();
              } else {
                // Fallback: Find the parent Scaffold (DashboardScreen's Scaffold)
                // We need to skip HomeScreen's Scaffold and find the one above it
                ScaffoldState? parentScaffold = _findParentScaffold(context);
                parentScaffold?.openDrawer();
              }
            },
          ),
        ),
        titleSpacing: 0,
        title: Row(
          children: [
            Padding(
              padding: const EdgeInsets.only(left: Dimensions.paddingSizeSmall),
              child: Image.asset(Images.logo, height: 30, width: 30),
            ),
            const SizedBox(width: Dimensions.paddingSizeSmall),
            Text(
              'ONE FOOD DELIVERY',
              style: robotoBold.copyWith(
                fontSize: Dimensions.fontSizeLarge,
                color: Theme.of(context).textTheme.bodyLarge?.color,
              ),
            ),
          ],
        ),
        actions: [

          IconButton(
            icon: GetBuilder<NotificationController>(builder: (notificationController) {
              bool hasNewNotification = false;
              if(notificationController.notificationList != null && notificationController.notificationList!.isNotEmpty) {
                hasNewNotification = notificationController.notificationList!.length != notificationController.getSeenNotificationCount();
              }
              return Stack(children: [

                Icon(Icons.notifications, size: 25, color: Theme.of(context).textTheme.bodyLarge?.color ?? Theme.of(context).iconTheme.color ?? Colors.black),

                hasNewNotification ? Positioned(top: 0, right: 0, child: Container(
                  height: 10, width: 10, decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor, shape: BoxShape.circle,
                  border: Border.all(width: 1, color: Theme.of(context).cardColor),
                ),
                )) : const SizedBox(),

              ]);
            }),
            onPressed: () => Get.toNamed(RouteHelper.getNotificationRoute()),
          ),

          GetBuilder<ProfileController>(builder: (profileController) {
            return GetBuilder<OrderController>(builder: (orderController) {
              final profileModel = profileController.profileModel;
              final currentOrderList = orderController.currentOrderList;
              
              return (profileModel != null) ? FlutterSwitch(
                width: 75, height: 30, valueFontSize: Dimensions.fontSizeExtraSmall, showOnOff: true,
                activeText: 'online'.tr, inactiveText: 'offline'.tr, activeColor: Theme.of(context).primaryColor,
                value: (profileModel.active ?? 0) == 1, onToggle: (bool isActive) async {
                  if(!isActive && (currentOrderList != null && currentOrderList.isNotEmpty)) {
                    showCustomSnackBar('you_can_not_go_offline_now'.tr);
                  }else {
                    if(!isActive) {
                      showCustomBottomSheet(
                        child: CustomConfirmationBottomSheet(
                          title: 'offline'.tr,
                          description: 'are_you_sure_to_offline'.tr,
                          onConfirm: () async {
                            Get.back(); // Close the bottom sheet
                            await profileController.updateActiveStatus(isUpdate: true);
                            // Stop live tracking and show home address when going offline
                            await _stopLiveLocationTracking();
                            _getCurrentLocation();
                          },
                        ),
                      );
                    }else {
                      // Go online - check for shifts first
                      if(profileController.shifts != null && profileController.shifts!.isNotEmpty) {
                        Get.dialog(const ShiftDialogueWidget()).then((_) {
                          // After shift dialog closes, check if profile is now online and update location
                          WidgetsBinding.instance.addPostFrameCallback((_) async {
                            await Future.delayed(const Duration(milliseconds: 500));
                            final profileController = Get.find<ProfileController>();
                            if (profileController.profileModel != null && 
                                (profileController.profileModel!.active ?? 0) == 1) {
                              await profileController.getProfile();
                              await _getCurrentLocation(forceGPS: true);
                              _startLocationTrackingIfOnline();
                            }
                          });
                        });
                      } else {
                        await profileController.updateActiveStatus();
                        // Refresh profile to ensure status is updated
                        await profileController.getProfile();
                        // Start live tracking when going online and force GPS location update
                        await _getCurrentLocation(forceGPS: true);
                        _startLocationTrackingIfOnline();
                      }
                    }
                  }
                },
              ) : const SizedBox();
            });
          }),
          const SizedBox(width: Dimensions.paddingSizeSmall),

        ],
      ),

      body: RefreshIndicator(
        onRefresh: () async {
          return await _loadData();
        },
        child: Column(
          children: [

            if(!_isNotificationPermissionGranted)
              permissionWarning(isBatteryPermission: false, onTap: requestNotificationPermission, closeOnTap: () {
                setState(() {
                  _isNotificationPermissionGranted = true;
                });
              }),

            if(!_isBatteryOptimizationGranted)
              permissionWarning(isBatteryPermission: true, onTap: requestBatteryOptimization, closeOnTap: () {
                setState(() {
                  _isBatteryOptimizationGranted = true;
                });
              }),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(Dimensions.paddingSizeDefault),
                child: GetBuilder<ProfileController>(builder: (profileController) {
                  final profileModel = profileController.profileModel;

                  return Column(children: [

                    GetBuilder<OrderController>(builder: (orderController) {
                      bool hasActiveOrder = orderController.currentOrderList != null && orderController.currentOrderList!.isNotEmpty;
                      bool isLoading = orderController.currentOrderList == null;
                      bool isEmpty = orderController.currentOrderList != null && orderController.currentOrderList!.isEmpty;
                      
                      return Column(children: [

                        // Always show the title section
                        TitleWidget(
                          title: 'active_order'.tr, 
                          onTap: null,
                        ),
                        const SizedBox(height: Dimensions.paddingSizeSmall),

                        // Show content based on state
                        if (isLoading)
                          OrderShimmerWidget(isEnabled: true)
                        else if (hasActiveOrder)
                          OrderWidget(
                            orderModel: orderController.currentOrderList![0], 
                            isRunningOrder: true, 
                            orderIndex: 0,
                          )
                        else if (isEmpty)
                          Container(
                            height: 300,
                            decoration: BoxDecoration(
                              color: Theme.of(context).cardColor,
                              borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                              child: _isLoadingLocation
                                  ? Center(
                                      child: CircularProgressIndicator(
                                        color: Theme.of(context).primaryColor,
                                      ),
                                    )
                                  : FlutterMap(
                                      mapController: _mapController,
                                      options: MapOptions(
                                        initialCenter: _currentLocation ?? const ll.LatLng(0.0, 0.0),
                                        initialZoom: 15.0,
                                        interactionOptions: const InteractionOptions(
                                          flags: InteractiveFlag.all,
                                        ),
                                      ),
                                      children: [
                                        TileLayer(
                                          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                          userAgentPackageName: 'com.sixamtech.app_retain',
                                        ),
                                        if (_currentLocation != null && _currentLocation!.latitude != 0.0 && _currentLocation!.longitude != 0.0)
                                          MarkerLayer(
                                            markers: [
                                              Marker(
                                                point: _currentLocation!,
                                                width: 60,
                                                height: 60,
                                                child: Image.asset(
                                                  // Show HappyMan icon when offline, DeliveryBike icon when online
                                                  (profileModel != null && (profileModel.active ?? 0) == 0)
                                                      ? Images.happyManIcon
                                                      : Images.deliveryBikeIcon,
                                                  width: 60,
                                                  height: 60,
                                                  fit: BoxFit.contain,
                                                  errorBuilder: (context, error, stackTrace) {
                                                    // Fallback icons based on online/offline status
                                                    if (profileModel != null && (profileModel.active ?? 0) == 0) {
                                                      return Icon(
                                                        Icons.home,
                                                        color: Theme.of(context).primaryColor,
                                                        size: 40,
                                                      );
                                                    } else {
                                                      return Icon(
                                                        Icons.directions_bike,
                                                        color: Theme.of(context).primaryColor,
                                                        size: 40,
                                                      );
                                                    }
                                                  },
                                                ),
                                              ),
                                            ],
                                          ),
                                      ],
                                    ),
                            ),
                          ),
                        const SizedBox(height: Dimensions.paddingSizeDefault),

                      ]);
                    }),

                    (profileModel != null && (profileModel.earnings ?? 0) == 1) ? Column(children: [

                      TitleWidget(title: 'earnings'.tr),
                      const SizedBox(height: Dimensions.paddingSizeSmall),

                      Container(
                        padding: const EdgeInsets.all(Dimensions.paddingSizeLarge),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                          color: Get.isDarkMode ? Colors.white.withValues(alpha: 0.3) : Color(0xff334257),
                        ),
                        child: Column(children: [

                          Row(mainAxisAlignment: MainAxisAlignment.start, children: [

                            const SizedBox(width: Dimensions.paddingSizeSmall),

                            Image.asset(Images.wallet, width: 60, height: 60),
                            const SizedBox(width: Dimensions.paddingSizeLarge),

                            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

                              Text(
                                'balance'.tr,
                                style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeSmall, color: ColorResources.white),
                              ),
                              const SizedBox(height: Dimensions.paddingSizeSmall),

                              Text(
                                PriceConverter.convertPrice(profileModel.balance ?? 0.0, showCurrency: false),
                                style: robotoBold.copyWith(fontSize: 24, color: ColorResources.white),
                                maxLines: 1, overflow: TextOverflow.ellipsis,
                              ),

                            ]),
                          ]),

                        ]),
                      ),
                      const SizedBox(height: Dimensions.paddingSizeDefault),
                    ]) : const SizedBox(),

                    TitleWidget(title: 'orders'.tr),
                    const SizedBox(height: Dimensions.paddingSizeSmall),

                    (profileModel != null && (profileModel.earnings ?? 0) == 1) ? Row(children: [

                      OrderCountCardWidget(
                        title: 'todays_orders'.tr,
                        value: profileModel.todaysOrderCount?.toString(),
                      ),
                      const SizedBox(width: Dimensions.paddingSizeDefault),

                      OrderCountCardWidget(
                        title: 'this_week_orders'.tr,
                        value: profileModel.thisWeekOrderCount?.toString(),
                      ),
                      const SizedBox(width: Dimensions.paddingSizeDefault),

                      OrderCountCardWidget(
                        title: 'total_orders'.tr,
                        value: profileModel.orderCount?.toString(),
                      ),

                    ]) : Column(children: [

                      Row(children: [

                        Expanded(child: CountCardWidget(
                          title: 'todays_orders'.tr, backgroundColor: Theme.of(context).secondaryHeaderColor.withValues(alpha: 0.2), height: 180,
                          value: profileModel?.todaysOrderCount?.toString(),
                        )),
                        const SizedBox(width: Dimensions.paddingSizeSmall),

                        Expanded(child: CountCardWidget(
                          title: 'this_week_orders'.tr, backgroundColor: Theme.of(context).colorScheme.error.withValues(alpha: 0.2), height: 180,
                          value: profileModel?.thisWeekOrderCount?.toString(),
                        )),

                      ]),
                      const SizedBox(height: Dimensions.paddingSizeSmall),

                      CountCardWidget(
                        title: 'total_orders'.tr, backgroundColor: Theme.of(context).primaryColor.withValues(alpha: 0.2), height: 140,
                        value: profileModel?.orderCount?.toString(),
                      ),

                    ]),
                    const SizedBox(height: Dimensions.paddingSizeLarge),

                    profileModel != null ? (profileModel.earnings ?? 0) == 1 ? CustomCard(
                      height: 85, width: MediaQuery.of(context).size.width,
                      padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSizeDefault, vertical: Dimensions.paddingSizeLarge),
                      child: Row(children: [

                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                            Text(PriceConverter.convertPrice(profileModel.cashInHands ?? 0.0, showCurrency: false), style: robotoBold.copyWith(fontSize: Dimensions.fontSizeLarge)),

                            RichText(
                              text: TextSpan(
                                children: [
                                  TextSpan(text: 'cash_in_your_hand'.tr, style: robotoRegular.copyWith(color: Theme.of(context).hintColor)),
                                  TextSpan(text: ' (${'limit_exceeded'.tr})', style: robotoRegular.copyWith(color: ColorResources.red, fontSize: Dimensions.fontSizeSmall - 2)),
                                ],
                              ),
                            ),
                          ]),
                        ),

                        CustomButtonWidget(
                          width: 90, height: 40,
                          fontWeight: FontWeight.w400,
                          fontSize: Dimensions.fontSizeDefault,
                          buttonText: 'pay_now'.tr,
                          backgroundColor: Theme.of(context).primaryColor,
                          onPressed: () => Get.toNamed(RouteHelper.getCashInHandRoute()),
                        ),

                      ]),
                    ) : SizedBox() : Shimmer(
                      duration: const Duration(seconds: 2),
                      enabled: true,
                      child: Container(
                        height: 85, width: MediaQuery.of(context).size.width,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(Dimensions.radiusDefault),
                          color: Theme.of(context).shadowColor,
                        ),
                      ),
                    ),

                  ]);
                }),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget permissionWarning({required bool isBatteryPermission, required Function() onTap, required Function() closeOnTap}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.8),
      ),
      child: InkWell(
        onTap: onTap,
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(Dimensions.paddingSizeSmall),
              child: Row(children: [

                if(isBatteryPermission)
                  const Padding(
                    padding: EdgeInsets.only(right: 8.0),
                    child: Icon(Icons.warning_rounded, color: Colors.yellow,),
                  ),

                Expanded(
                  child: Row(children: [
                    Flexible(
                      child: Text(
                        isBatteryPermission ? 'for_better_performance_allow_notification_to_run_in_background'.tr
                            : 'notification_is_disabled_please_allow_notification'.tr,
                        maxLines: 2, style: robotoRegular.copyWith(fontSize: Dimensions.fontSizeSmall, color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: Dimensions.paddingSizeSmall),
                    const Icon(Icons.arrow_circle_right_rounded, color: Colors.white, size: 24,),
                  ]),
                ),

                const SizedBox(width: 20),
              ]),
            ),

            Positioned(
              top: 5, right: 5,
              child: InkWell(
                onTap: closeOnTap,
                child: const Icon(Icons.clear, color: Colors.white, size: 18),
              ),
            ),
          ],
        ),
      ),
    );
  }


  // Helper method to find the parent Scaffold (DashboardScreen's Scaffold)
  ScaffoldState? _findParentScaffold(BuildContext context) {
    // Find the closest ScaffoldState that has a drawer
    // First, try to find any ScaffoldState and check if it has a drawer
    final scaffoldState = context.findAncestorStateOfType<ScaffoldState>();
    if (scaffoldState != null && scaffoldState.mounted) {
      try {
        final scaffoldWidget = scaffoldState.context.findAncestorWidgetOfExactType<Scaffold>();
        if (scaffoldWidget?.drawer != null) {
          return scaffoldState;
        }
      } catch (e) {
        // If we can't check, continue searching
      }
    }
    
    // If not found, traverse up using visitAncestorElements
    ScaffoldState? foundScaffold;
    context.visitAncestorElements((element) {
      final widget = element.widget;
      if (widget is Scaffold && widget.drawer != null) {
        // Found a Scaffold with a drawer, find its state
        final state = element.findAncestorStateOfType<ScaffoldState>();
        if (state != null && state.mounted) {
          foundScaffold = state;
          return false; // Stop visiting ancestors
        }
      }
      return true; // Continue visiting ancestors
    });
    
    return foundScaffold;
  }
}