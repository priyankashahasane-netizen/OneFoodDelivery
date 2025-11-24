import 'package:flutter/material.dart';
import 'package:get/get.dart';

class AppDrawerController extends GetxController {
  GlobalKey<ScaffoldState>? scaffoldKey;

  void setScaffoldKey(GlobalKey<ScaffoldState> key) {
    scaffoldKey = key;
    update(); // Notify listeners
  }

  void openDrawer() {
    final state = scaffoldKey?.currentState;
    if (state != null && state.mounted) {
      try {
        state.openDrawer();
      } catch (e) {
        debugPrint('AppDrawerController: Error opening drawer: $e');
        // Try to find the scaffold in the current route
        _tryFindAndOpenDrawer();
      }
    } else {
      debugPrint('AppDrawerController: ScaffoldState is null or not mounted, trying to find drawer');
      _tryFindAndOpenDrawer();
    }
  }

  void _tryFindAndOpenDrawer() {
    // Try to find the dashboard scaffold in the current navigation context
    try {
      final context = Get.key.currentContext;
      if (context != null) {
        // Navigate back to dashboard first
        Get.offNamedUntil(
          '/main?page=home',
          (route) => route.settings.name == '/main' || route.settings.name == '/',
        );
        
        // After navigation, try to open drawer with multiple attempts
        Future.delayed(const Duration(milliseconds: 200), () {
          _tryOpenDrawerFromContext();
        });
        
        Future.delayed(const Duration(milliseconds: 500), () {
          _tryOpenDrawerFromContext();
        });
      }
    } catch (e) {
      debugPrint('AppDrawerController: Error in _tryFindAndOpenDrawer: $e');
    }
  }

  void _tryOpenDrawerFromContext() {
    final context = Get.key.currentContext;
    if (context != null) {
      // Try to find scaffold state
      final scaffoldState = context.findAncestorStateOfType<ScaffoldState>();
      if (scaffoldState != null && scaffoldState.mounted) {
        try {
          // Check if scaffold has drawer
          final scaffoldWidget = scaffoldState.context.findAncestorWidgetOfExactType<Scaffold>();
          if (scaffoldWidget?.drawer != null) {
            scaffoldState.openDrawer();
            // Update our scaffold key reference if it's not set
            if (scaffoldKey == null || scaffoldKey!.currentState != scaffoldState) {
              // Create a new key and set the state (though this is a workaround)
              // The proper way is to have the DashboardScreen set the key
            }
          }
        } catch (e) {
          debugPrint('AppDrawerController: Could not open drawer: $e');
        }
      }
    }
  }

  void closeDrawer() {
    final state = scaffoldKey?.currentState;
    if (state != null) {
      state.closeDrawer();
    }
  }
}

