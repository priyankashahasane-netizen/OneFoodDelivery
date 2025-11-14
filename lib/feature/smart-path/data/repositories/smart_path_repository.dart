import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/feature/smart-path/domain/repositories/smart_path_repository_interface.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:get/get_connect/http/src/response/response.dart';
import 'package:get/get.dart';

class SmartPathRepository implements SmartPathRepositoryInterface {
  final ApiClient apiClient;
  SmartPathRepository({required this.apiClient});

  @override
  Future<Response> generateSmartPath(String driverId, {String? date}) async {
    final body = <String, dynamic>{
      'driverId': driverId,
    };
    if (date != null) {
      body['date'] = date;
    }
    return await apiClient.postData(
      AppConstants.generateSmartPathUri,
      body,
    );
  }

  @override
  Future<Response> getSmartPath(String driverId, {String? date}) async {
    String uri = '${AppConstants.getSmartPathUri}/$driverId';
    if (date != null) {
      uri += '?date=$date';
    }
    return await apiClient.getData(uri);
  }

  @override
  Future<Response> getSmartPathById(String id) async {
    return await apiClient.getData(
      '${AppConstants.getSmartPathByIdUri}/$id',
    );
  }
}

