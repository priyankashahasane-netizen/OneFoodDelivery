import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/feature/routes/domain/models/route_plan_model.dart';
import 'package:stackfood_multivendor_driver/feature/routes/domain/repositories/route_repository_interface.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:get/get_connect/http/src/response/response.dart';
import 'package:get/get.dart';

class RouteRepository implements RouteRepositoryInterface {
  final ApiClient apiClient;
  RouteRepository({required this.apiClient});

  @override
  Future<Response> optimizeRoute(OptimizeRouteRequest request) async {
    return await apiClient.postData(
      '${AppConstants.optimizeRouteUri}',
      request.toJson(),
    );
  }

  @override
  Future<Response> getLatestRoute(String driverId) async {
    return await apiClient.getData(
      '${AppConstants.latestRouteUri}/$driverId/latest',
    );
  }

}

