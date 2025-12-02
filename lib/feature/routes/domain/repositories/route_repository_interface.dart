import 'package:stackfood_multivendor_driver/feature/routes/domain/models/route_plan_model.dart';
import 'package:get/get_connect/http/src/response/response.dart';

abstract class RouteRepositoryInterface {
  Future<Response> optimizeRoute(OptimizeRouteRequest request);
  Future<Response> getLatestRoute(String driverId);
  Future<Response> optimizeSubscriptionRoute(String driverId);
  Future<Response> getLatestSubscriptionRoute(String driverId);
}

