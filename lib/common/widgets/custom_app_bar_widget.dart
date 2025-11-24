import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/util/dimensions.dart';
import 'package:stackfood_multivendor_driver/util/styles.dart';
import 'package:flutter/material.dart';
import 'package:get/get_utils/get_utils.dart';
import 'package:stackfood_multivendor_driver/feature/dashboard/controllers/drawer_controller.dart' as drawer_ctrl;

class CustomAppBarWidget extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final bool isBackButtonExist;
  final Function? onBackPressed;
  final Widget? actionWidget;
  final bool showMenuButton;
  const CustomAppBarWidget({super.key, required this.title, this.isBackButtonExist = true, this.onBackPressed, this.actionWidget, this.showMenuButton = true});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title, style: robotoMedium.copyWith(fontSize: Dimensions.fontSizeLarge, fontWeight: FontWeight.w600, color: Theme.of(context).textTheme.bodyLarge!.color)),
      centerTitle: true,
      leading: _buildLeading(context),
      backgroundColor: Theme.of(context).cardColor,
      surfaceTintColor: Theme.of(context).cardColor,
      shadowColor: Theme.of(context).disabledColor.withValues(alpha: 0.5),
      elevation: 2,
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: Dimensions.paddingSizeLarge),
          child: actionWidget ?? const SizedBox(),
        ),
      ],
    );
  }

  Widget _buildLeading(BuildContext context) {
    if (showMenuButton) {
      return Builder(
        builder: (context) => IconButton(
          icon: const Icon(Icons.menu),
          color: Theme.of(context).textTheme.bodyLarge!.color,
          onPressed: () {
            _openDrawer(context);
          },
        ),
      );
    } else if (isBackButtonExist) {
      return IconButton(
        icon: const Icon(Icons.arrow_back_ios),
        color: Theme.of(context).textTheme.bodyLarge!.color,
        onPressed: () => onBackPressed != null ? onBackPressed!() : Navigator.pop(context),
      );
    }
    return const SizedBox();
  }

  void _openDrawer(BuildContext context) {
    // First, try to find and open drawer in the current screen's Scaffold
    ScaffoldState? scaffoldState = _findScaffoldWithDrawer(context);
    
    if (scaffoldState != null && scaffoldState.mounted) {
      try {
        scaffoldState.openDrawer();
        return; // Successfully opened drawer on current screen
      } catch (e) {
        // Continue to fallback
      }
    }
    
    // If no drawer found in current screen, try drawer controller (for dashboard)
    if (Get.isRegistered<drawer_ctrl.AppDrawerController>()) {
      final controller = Get.find<drawer_ctrl.AppDrawerController>();
      if (controller.scaffoldKey?.currentState != null && controller.scaffoldKey!.currentState!.mounted) {
        try {
          controller.openDrawer();
          return;
        } catch (e) {
          // Continue to fallback
        }
      }
    }
    
    // Last resort: If we're on dashboard route, try to open directly
    final currentRoute = Get.currentRoute;
    if (currentRoute == '/main' || currentRoute == '/') {
      _tryOpenDrawerDirectly();
    }
    // Note: We no longer navigate away from current screen since drawer is now on all screens
  }

  ScaffoldState? _findScaffoldWithDrawer(BuildContext context) {
    // Find the closest ScaffoldState that has a drawer
    ScaffoldState? scaffoldState = context.findAncestorStateOfType<ScaffoldState>();
    if (scaffoldState != null && scaffoldState.mounted) {
      try {
        final scaffoldWidget = scaffoldState.context.findAncestorWidgetOfExactType<Scaffold>();
        if (scaffoldWidget?.drawer != null) {
          return scaffoldState;
        }
      } catch (e) {
        // Continue searching
      }
    }
    
    // If not found, traverse up using visitAncestorElements
    ScaffoldState? foundScaffold;
    context.visitAncestorElements((element) {
      final widget = element.widget;
      if (widget is Scaffold && widget.drawer != null) {
        final state = element.findAncestorStateOfType<ScaffoldState>();
        if (state != null && state.mounted) {
          foundScaffold = state;
          return false; // Stop traversal
        }
      }
      return true; // Continue traversal
    });
    
    return foundScaffold;
  }

  void _tryOpenDrawerDirectly() {
    // Try to use the drawer controller first
    if (Get.isRegistered<drawer_ctrl.AppDrawerController>()) {
      final controller = Get.find<drawer_ctrl.AppDrawerController>();
      if (controller.scaffoldKey?.currentState != null && controller.scaffoldKey!.currentState!.mounted) {
        try {
          controller.openDrawer();
          return;
        } catch (e) {
          // Continue to fallback
        }
      }
    }
    
    // Fallback: Try to find scaffold in current context
    final context = Get.key.currentContext;
    if (context != null) {
      final scaffoldState = context.findAncestorStateOfType<ScaffoldState>();
      if (scaffoldState != null && scaffoldState.mounted) {
        try {
          final scaffoldWidget = scaffoldState.context.findAncestorWidgetOfExactType<Scaffold>();
          if (scaffoldWidget?.drawer != null) {
            scaffoldState.openDrawer();
            return;
          }
        } catch (e) {
          // Continue to navigation fallback
        }
      }
    }
    
    // If direct opening fails, wait a bit and try again (in case dashboard is still building)
    Future.delayed(const Duration(milliseconds: 100), () {
      _tryOpenDrawerDirectly();
    });
  }



  @override
  Size get preferredSize => Size(1170, GetPlatform.isDesktop ? 70 : 50);
}