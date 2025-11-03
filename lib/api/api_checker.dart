import 'package:stackfood_multivendor_driver/feature/profile/controllers/profile_controller.dart';
import 'package:stackfood_multivendor_driver/common/widgets/custom_snackbar_widget.dart';
import 'package:get/get.dart';

class ApiChecker {
  static void checkApi(Response response) {
    if(response.statusCode == 401) {
      // Auth removed - just show error message
      showCustomSnackBar(response.statusText);
    }else {
      showCustomSnackBar(response.statusText);
    }
  }
}