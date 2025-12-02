import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/feature/routes/domain/repositories/route_repository_interface.dart';
import 'package:stackfood_multivendor_driver/feature/routes/domain/models/route_plan_model.dart';
import 'package:stackfood_multivendor_driver/feature/routes/domain/services/route_service_interface.dart';

class RouteService implements RouteServiceInterface {
  final RouteRepositoryInterface routeRepository;
  RouteService({required this.routeRepository});

  @override
  Future<RoutePlanModel?> optimizeRoute(String driverId, List<OptimizeStop> stops) async {
    try {
      final request = OptimizeRouteRequest(driverId: driverId, stops: stops);
      Response response = await routeRepository.optimizeRoute(request);
      if (response.statusCode == 200 && response.body != null) {
        return RoutePlanModel.fromJson(response.body);
      }
    } catch (e) {
      print('Error optimizing route: $e');
    }
    return null;
  }

  @override
  Future<RoutePlanModel?> getLatestRoute(String driverId) async {
    try {
      Response response = await routeRepository.getLatestRoute(driverId);
      if (response.statusCode == 200 && response.body != null) {
        return RoutePlanModel.fromJson(response.body);
      }
    } catch (e) {
      print('Error getting latest route: $e');
    }
    return null;
  }

  @override
  Future<RoutePlanModel?> optimizeSubscriptionRoute(String driverId) async {
    try {
      Response response = await routeRepository.optimizeSubscriptionRoute(driverId);
      if (response.statusCode == 200 && response.body != null) {
        return RoutePlanModel.fromJson(response.body);
      }
    } catch (e) {
      print('Error optimizing subscription route: $e');
    }
    return null;
  }

  @override
  Future<RoutePlanModel?> getLatestSubscriptionRoute(String driverId) async {
    try {
      Response response = await routeRepository.getLatestSubscriptionRoute(driverId);
      if (response.statusCode == 200 && response.body != null) {
        return RoutePlanModel.fromJson(response.body);
      }
    } catch (e) {
      print('Error getting latest subscription route: $e');
    }
    return null;
  }
}


