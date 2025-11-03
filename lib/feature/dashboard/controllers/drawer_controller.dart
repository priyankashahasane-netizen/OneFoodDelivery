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
    if (state != null) {
      state.openDrawer();
    } else {
      debugPrint('AppDrawerController: ScaffoldState is null, cannot open drawer');
    }
  }

  void closeDrawer() {
    final state = scaffoldKey?.currentState;
    if (state != null) {
      state.closeDrawer();
    }
  }
}

