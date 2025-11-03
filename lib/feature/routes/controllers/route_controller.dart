import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/feature/routes/domain/models/route_plan_model.dart';
import 'package:stackfood_multivendor_driver/feature/routes/domain/services/route_service_interface.dart';

class RouteController extends GetxController implements GetxService {
  final RouteServiceInterface routeServiceInterface;

  RouteController({required this.routeServiceInterface});

  RoutePlanModel? _currentRoute;
  RoutePlanModel? get currentRoute => _currentRoute;

  bool _isOptimizing = false;
  bool get isOptimizing => _isOptimizing;

  Future<RoutePlanModel?> optimizeRoute(String driverId, List<OptimizeStop> stops) async {
    _isOptimizing = true;
    update();
    try {
      _currentRoute = await routeServiceInterface.optimizeRoute(driverId, stops);
      return _currentRoute;
    } finally {
      _isOptimizing = false;
      update();
    }
  }

  Future<void> refreshLatestRoute(String driverId) async {
    _currentRoute = await routeServiceInterface.getLatestRoute(driverId);
    update();
  }
}


