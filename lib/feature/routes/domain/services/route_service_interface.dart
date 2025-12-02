import 'package:stackfood_multivendor_driver/feature/routes/domain/models/route_plan_model.dart';

abstract class RouteServiceInterface {
  Future<RoutePlanModel?> optimizeRoute(String driverId, List<OptimizeStop> stops);
  Future<RoutePlanModel?> getLatestRoute(String driverId);
  Future<RoutePlanModel?> optimizeSubscriptionRoute(String driverId);
  Future<RoutePlanModel?> getLatestSubscriptionRoute(String driverId);
}


