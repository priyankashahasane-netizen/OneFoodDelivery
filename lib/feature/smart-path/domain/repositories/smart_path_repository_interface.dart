import 'package:get/get_connect/http/src/response/response.dart';

abstract class SmartPathRepositoryInterface {
  Future<Response> generateSmartPath(String driverId, {String? date});
  Future<Response> getSmartPath(String driverId, {String? date});
  Future<Response> getSmartPathById(String id);
}

