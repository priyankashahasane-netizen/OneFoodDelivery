import 'package:flutter/widgets.dart';
import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/helper/route_helper.dart';

class BottomNavController extends GetxController {
  int _currentIndex = 0;

  int get currentIndex => _currentIndex;

  void setCurrentIndex(int index) {
    if (_currentIndex != index) {
      _currentIndex = index;
      // Defer update to avoid calling during build phase
      WidgetsBinding.instance.addPostFrameCallback((_) {
        update();
      });
    }
  }

  void navigateToPage(int pageIndex) {
    if (_currentIndex == pageIndex) {
      return; // Already on this page
    }

    _currentIndex = pageIndex;
    // Defer update to avoid calling during build phase
    WidgetsBinding.instance.addPostFrameCallback((_) {
      update();
    });

    // Navigate to dashboard with the selected page
    String pageParam = 'home';
    switch (pageIndex) {
      case 0:
        pageParam = 'home';
        break;
      case 1:
        pageParam = 'order-request';
        break;
      case 2:
        pageParam = 'order';
        break;
      case 3:
        pageParam = 'map';
        break;
      case 4:
        pageParam = 'profile';
        break;
    }

    // Defer navigation to avoid calling during build phase
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Get.offNamedUntil(
        RouteHelper.getMainRoute(pageParam),
        (route) => route.settings.name == '/main' || route.settings.name == '/',
      );
    });
  }

  bool isSelected(int index) {
    return _currentIndex == index;
  }
}

