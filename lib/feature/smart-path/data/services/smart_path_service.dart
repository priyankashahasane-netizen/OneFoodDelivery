import 'package:get/get.dart';
import 'package:stackfood_multivendor_driver/feature/smart-path/data/repositories/smart_path_repository.dart';
import 'package:stackfood_multivendor_driver/feature/smart-path/domain/models/smart_path_model.dart';
import 'package:stackfood_multivendor_driver/feature/smart-path/domain/services/smart_path_service_interface.dart';

class SmartPathService implements SmartPathServiceInterface {
  final SmartPathRepository smartPathRepository;
  SmartPathService({required this.smartPathRepository});

  @override
  Future<List<SmartPathModel>?> generateSmartPath(String driverId, {String? date}) async {
    try {
      Response response = await smartPathRepository.generateSmartPath(driverId, date: date);
      if (response.statusCode == 200 && response.body != null) {
        if (response.body is List) {
          return (response.body as List)
              .map((e) => SmartPathModel.fromJson(e as Map<String, dynamic>))
              .toList();
        }
      }
    } catch (e) {
      print('Error generating Smart Path: $e');
    }
    return null;
  }

  @override
  Future<List<SmartPathModel>?> getSmartPath(String driverId, {String? date}) async {
    try {
      Response response = await smartPathRepository.getSmartPath(driverId, date: date);
      if (response.statusCode == 200 && response.body != null) {
        if (response.body is List) {
          return (response.body as List)
              .map((e) => SmartPathModel.fromJson(e as Map<String, dynamic>))
              .toList();
        }
      }
    } catch (e) {
      print('Error getting Smart Path: $e');
    }
    return null;
  }

  @override
  Future<SmartPathModel?> getSmartPathById(String id) async {
    try {
      Response response = await smartPathRepository.getSmartPathById(id);
      if (response.statusCode == 200 && response.body != null) {
        return SmartPathModel.fromJson(response.body as Map<String, dynamic>);
      }
    } catch (e) {
      print('Error getting Smart Path by ID: $e');
    }
    return null;
  }
}

