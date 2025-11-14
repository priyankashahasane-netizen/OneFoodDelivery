import 'package:stackfood_multivendor_driver/feature/smart-path/domain/models/smart_path_model.dart';

abstract class SmartPathServiceInterface {
  Future<List<SmartPathModel>?> generateSmartPath(String driverId, {String? date});
  Future<List<SmartPathModel>?> getSmartPath(String driverId, {String? date});
  Future<SmartPathModel?> getSmartPathById(String id);
}

