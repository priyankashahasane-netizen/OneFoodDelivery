import 'package:flutter/foundation.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:stackfood_multivendor_driver/api/api_client.dart';
import 'package:stackfood_multivendor_driver/common/models/response_model.dart';
import 'package:stackfood_multivendor_driver/feature/auth/domain/repositories/auth_repository_interface.dart';
import 'package:stackfood_multivendor_driver/util/app_constants.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math';

class AuthRepository implements AuthRepositoryInterface {
  final ApiClient apiClient;
  final SharedPreferences sharedPreferences;
  AuthRepository({required this.apiClient, required this.sharedPreferences});

  @override
  Future<Response> login(String phone, String password) async {
    return await apiClient.postData(AppConstants.loginUri, {"phone": phone, "password": password}, handleError: false);
  }

  @override
  Future<bool> saveUserToken(String token, String topic) async {
    apiClient.token = token;
    apiClient.updateHeader(token, sharedPreferences.getString(AppConstants.languageCode));
    sharedPreferences.setString(AppConstants.zoneTopic, topic);
    return await sharedPreferences.setString(AppConstants.token, token);
  }

  @override
  Future<Response> updateToken({String notificationDeviceToken = ''}) async {
    // Device token can be provided externally or left empty
    // Using appauth or other notification services instead of Firebase
    String? deviceToken = notificationDeviceToken.isNotEmpty ? notificationDeviceToken : '';
    return await apiClient.postData(AppConstants.tokenUri, {"_method": "put", "token": getUserToken(), "fcm_token": deviceToken}, handleError: false);
  }

  @override
  bool isLoggedIn() {
    return sharedPreferences.containsKey(AppConstants.token);
  }

  @override
  Future<bool> clearSharedData() async {
    if(!GetPlatform.isWeb) {
      // Unsubscribe from topics if using notification service
      apiClient.postData(AppConstants.tokenUri, {"_method": "put", "token": getUserToken()}, handleError: false);
    }
    await sharedPreferences.remove(AppConstants.token);
    await sharedPreferences.setStringList(AppConstants.ignoreList, []);
    await sharedPreferences.remove(AppConstants.userAddress);
    apiClient.updateHeader(null, null);
    return true;
  }

  @override
  Future<void> saveUserNumberAndPassword(String number, String password, String countryCode) async {
    try {
      await sharedPreferences.setString(AppConstants.userPassword, password);
      await sharedPreferences.setString(AppConstants.userNumber, number);
      await sharedPreferences.setString(AppConstants.userCountryCode, countryCode);
    } catch (e) {
      rethrow;
    }
  }

  @override
  String getUserNumber() {
    return sharedPreferences.getString(AppConstants.userNumber) ?? "";
  }

  @override
  String getUserCountryCode() {
    return sharedPreferences.getString(AppConstants.userCountryCode) ?? "";
  }

  @override
  String getUserPassword() {
    return sharedPreferences.getString(AppConstants.userPassword) ?? "";
  }

  @override
  Future<bool> clearUserNumberAndPassword() async {
    await sharedPreferences.remove(AppConstants.userPassword);
    await sharedPreferences.remove(AppConstants.userCountryCode);
    return await sharedPreferences.remove(AppConstants.userNumber);
  }

  @override
  String getUserToken() {
    return sharedPreferences.getString(AppConstants.token) ?? "";
  }

  // Device token handling removed - using appauth or other services instead

  // Helper function to format phone number to CubeOne format (91<mobile>)
  String _formatPhoneForCubeOne(String phone) {
    String formattedPhone = phone;
    if (phone.startsWith('+91')) {
      formattedPhone = phone.substring(1); // Remove +
    } else if (!phone.startsWith('91')) {
      formattedPhone = '91$phone';
    }
    return formattedPhone;
  }

  // Helper function to generate a random strong password (12 characters)
  // Ensures at least one uppercase, one lowercase, one number, and one special character
  // Uses only the most basic, universally accepted special characters
  String _generateRandomPassword() {
    const String lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const String uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const String numbers = '0123456789';
    // Use only the most basic special characters that are universally accepted
    // Removed: #, %, ^, &, *, (, ), +, =, _ as they might cause issues
    // Using only: !, @, $ which are the safest
    const String special = '!@\$';
    
    final random = Random.secure();
    
    // Retry up to 10 times to ensure we get a valid password
    for (int attempt = 0; attempt < 10; attempt++) {
      final password = <String>[];
      
      // Ensure at least one character from each required category
      password.add(lowercase[random.nextInt(lowercase.length)]);
      password.add(uppercase[random.nextInt(uppercase.length)]);
      password.add(numbers[random.nextInt(numbers.length)]);
      password.add(special[random.nextInt(special.length)]);
      
      // Fill the rest randomly from all character sets (12 total characters)
      const String allChars = '$lowercase$uppercase$numbers$special';
      for (int i = password.length; i < 12; i++) {
        password.add(allChars[random.nextInt(allChars.length)]);
      }
      
      // Shuffle the password characters to randomize the order
      password.shuffle(random);
      
      final generatedPassword = password.join();
      
      // Validate using regex (more reliable than string contains)
      final hasLowercase = RegExp(r'[a-z]').hasMatch(generatedPassword);
      final hasUppercase = RegExp(r'[A-Z]').hasMatch(generatedPassword);
      final hasNumber = RegExp(r'[0-9]').hasMatch(generatedPassword);
      final hasSpecial = RegExp(r'[!@\$]').hasMatch(generatedPassword);
      
      // Log the actual password for debugging
      debugPrint('====> [CubeOne] Generated password (attempt ${attempt + 1}): $generatedPassword');
      debugPrint('====> [CubeOne] Password validation - lowercase: $hasLowercase, uppercase: $hasUppercase, number: $hasNumber, special: $hasSpecial');
      debugPrint('====> [CubeOne] Password length: ${generatedPassword.length}');
      
      // Double-check each character type is present
      bool hasLower = false;
      bool hasUpper = false;
      bool hasNum = false;
      bool hasSpec = false;
      
      for (int i = 0; i < generatedPassword.length; i++) {
        final char = generatedPassword[i];
        if (lowercase.contains(char)) hasLower = true;
        if (uppercase.contains(char)) hasUpper = true;
        if (numbers.contains(char)) hasNum = true;
        if (special.contains(char)) hasSpec = true;
      }
      
      // If all requirements are met, return the password
      if (hasLower && hasUpper && hasNum && hasSpec && generatedPassword.length == 12) {
        debugPrint('====> [CubeOne] Password validation PASSED - hasLower: $hasLower, hasUpper: $hasUpper, hasNum: $hasNum, hasSpec: $hasSpec');
        return generatedPassword;
      }
      
      debugPrint('====> [CubeOne] Password validation failed on attempt ${attempt + 1}, retrying...');
      debugPrint('====> [CubeOne] Detailed check - hasLower: $hasLower, hasUpper: $hasUpper, hasNum: $hasNum, hasSpec: $hasSpec');
    }
    
    // If we've exhausted all attempts, generate a guaranteed valid password
    debugPrint('====> [CubeOne] Generating guaranteed valid password after retries');
    final guaranteedPassword = <String>[];
    guaranteedPassword.add(lowercase[random.nextInt(lowercase.length)]);
    guaranteedPassword.add(uppercase[random.nextInt(uppercase.length)]);
    guaranteedPassword.add(numbers[random.nextInt(numbers.length)]);
    guaranteedPassword.add(special[random.nextInt(special.length)]);
    
    // Fill remaining with mix of all types
    const String allChars = '$lowercase$uppercase$numbers$special';
    for (int i = guaranteedPassword.length; i < 12; i++) {
      guaranteedPassword.add(allChars[random.nextInt(allChars.length)]);
    }
    
    guaranteedPassword.shuffle(random);
    final finalPassword = guaranteedPassword.join();
    
    // Final validation
    bool finalHasLower = false;
    bool finalHasUpper = false;
    bool finalHasNum = false;
    bool finalHasSpec = false;
    
    for (int i = 0; i < finalPassword.length; i++) {
      final char = finalPassword[i];
      if (lowercase.contains(char)) finalHasLower = true;
      if (uppercase.contains(char)) finalHasUpper = true;
      if (numbers.contains(char)) finalHasNum = true;
      if (special.contains(char)) finalHasSpec = true;
    }
    
    debugPrint('====> [CubeOne] Final guaranteed password: $finalPassword');
    debugPrint('====> [CubeOne] Final validation - hasLower: $finalHasLower, hasUpper: $finalHasUpper, hasNum: $finalHasNum, hasSpec: $finalHasSpec');
    
    return finalPassword;
  }

  // Test method to generate and validate 10 unique passwords
  @override
  void testPasswordGeneration() {
    debugPrint('\n========== PASSWORD GENERATION TEST ==========');
    final Set<String> passwords = {};
    final List<Map<String, dynamic>> results = [];
    
    const String lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const String uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const String numbers = '0123456789';
    const String special = '!@\$';
    
    for (int i = 1; i <= 10; i++) {
      String password = _generateRandomPassword();
      passwords.add(password);
      
      // Validate the password
      bool hasLower = false;
      bool hasUpper = false;
      bool hasNum = false;
      bool hasSpec = false;
      
      for (int j = 0; j < password.length; j++) {
        final char = password[j];
        if (lowercase.contains(char)) hasLower = true;
        if (uppercase.contains(char)) hasUpper = true;
        if (numbers.contains(char)) hasNum = true;
        if (special.contains(char)) hasSpec = true;
      }
      
      bool isValid = hasLower && hasUpper && hasNum && hasSpec && password.length == 12;
      bool isUnique = passwords.length == i; // Check if unique
      
      results.add({
        'index': i,
        'password': password,
        'length': password.length,
        'hasLowercase': hasLower,
        'hasUppercase': hasUpper,
        'hasNumber': hasNum,
        'hasSpecial': hasSpec,
        'isValid': isValid,
        'isUnique': isUnique,
      });
      
      debugPrint('Password $i: $password | Valid: $isValid | Length: ${password.length}');
      debugPrint('  - Lowercase: $hasLower, Uppercase: $hasUpper, Number: $hasNum, Special: $hasSpec');
    }
    
    debugPrint('\n========== TEST RESULTS ==========');
    debugPrint('Total passwords generated: ${passwords.length}');
    debugPrint('Unique passwords: ${passwords.length}');
    debugPrint('All valid: ${results.every((r) => r['isValid'] == true)}');
    debugPrint('All unique: ${results.every((r) => r['isUnique'] == true)}');
    
    // Print summary
    debugPrint('\nPassword Summary:');
    for (var result in results) {
      debugPrint('${result['index']}. ${result['password']} - Valid: ${result['isValid']}, Unique: ${result['isUnique']}');
    }
    
    debugPrint('=====================================\n');
  }

  @override
  Future<ResponseModel> searchUser(String username) async {
    try {
      debugPrint('====> [CubeOne] Searching user: $username');
      Map<String, String> headers = {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      };

      http.Response response = await http.post(
        Uri.parse('${AppConstants.cubeOneBaseUrl}${AppConstants.cubeOneSearchUserUri}'),
        headers: headers,
        body: jsonEncode({'username': username}),
      ).timeout(Duration(seconds: 30));

      debugPrint('====> [CubeOne] Search user response status: ${response.statusCode}');
      debugPrint('====> [CubeOne] Search user response body: ${response.body}');

      if (response.statusCode == 200) {
        Map<String, dynamic> body = jsonDecode(response.body);
        
        if (body['success'] == true) {
          // Check if user data exists (user found)
          if (body['data'] != null && body['data']['data'] != null) {
            debugPrint('====> [CubeOne] User found: ${body['data']['data']}');
            return ResponseModel(true, 'User found', body['data']['data']);
          } 
          // Check if user doesn't exist (404 error)
          else if (body['data'] != null && 
                   body['data']['status_code'] == 404 && 
                   body['data']['error'] != null) {
            debugPrint('====> [CubeOne] User not found (404): ${body['data']['error']}');
            return ResponseModel(false, 'User not found');
          }
        }
        debugPrint('====> [CubeOne] Unexpected response format: $body');
        return ResponseModel(false, 'Unexpected response format');
      } else {
        debugPrint('====> [CubeOne] Search user failed with status: ${response.statusCode}');
        debugPrint('====> [CubeOne] Response body: ${response.body}');
        return ResponseModel(false, 'Failed to search user: ${response.statusCode}');
      }
    } catch (e, stackTrace) {
      debugPrint('====> [CubeOne] Search user error: $e');
      debugPrint('====> [CubeOne] Stack trace: $stackTrace');
      return ResponseModel(false, 'Failed to search user: ${e.toString()}');
    }
  }

  @override
  Future<ResponseModel> registerUser(String mobile, String firstName, String lastName, String email) async {
    try {
      // Generate a random strong password (12 characters)
      String password = _generateRandomPassword();
      debugPrint('====> [CubeOne] Registering user: mobile=$mobile, email=$email, firstName=$firstName, lastName=$lastName');
      
      Map<String, String> headers = {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      };

      Map<String, dynamic> requestBody = {
        'password': password,
        'password_confirmation': password,
        'email': email,
        'mobile': mobile,
        'first_name': firstName,
        'last_name': lastName,
      };
      
      debugPrint('====> [CubeOne] Register request body: ${jsonEncode(requestBody).replaceAll(password, '***')}'); // Hide password in logs

      http.Response response = await http.post(
        Uri.parse('${AppConstants.cubeOneBaseUrl}${AppConstants.cubeOneRegisterUri}'),
        headers: headers,
        body: jsonEncode(requestBody),
      ).timeout(Duration(seconds: 30));

      debugPrint('====> [CubeOne] Register response status: ${response.statusCode}');
      debugPrint('====> [CubeOne] Register response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        Map<String, dynamic> body = jsonDecode(response.body);
        
        if (body['success'] == true) {
          debugPrint('====> [CubeOne] Registration successful: ${body['data']}');
          return ResponseModel(true, 'Registration successful', body['data']);
        } else {
          String errorMessage = body['message'] ?? 'Registration failed';
          debugPrint('====> [CubeOne] Registration failed: $errorMessage');
          return ResponseModel(false, errorMessage);
        }
      } else {
        String errorMessage = 'Registration failed: ${response.statusCode}';
        try {
          Map<String, dynamic> errorBody = jsonDecode(response.body);
          errorMessage = errorBody['message'] ?? errorMessage;
          debugPrint('====> [CubeOne] Registration error response: $errorBody');
        } catch (e) {
          debugPrint('====> [CubeOne] Failed to parse error response: $e');
        }
        return ResponseModel(false, errorMessage);
      }
    } catch (e, stackTrace) {
      debugPrint('====> [CubeOne] Register user error: $e');
      debugPrint('====> [CubeOne] Stack trace: $stackTrace');
      return ResponseModel(false, 'Failed to register user: ${e.toString()}');
    }
  }

  @override
  Future<ResponseModel> requestCubeOneOtp(String username) async {
    try {
      debugPrint('====> [CubeOne] Requesting OTP for username: $username');
      Map<String, String> headers = {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      };

      http.Response response = await http.post(
        Uri.parse('${AppConstants.cubeOneBaseUrl}${AppConstants.cubeOneRequestOtpUri}'),
        headers: headers,
        body: jsonEncode({'username': username}),
      ).timeout(Duration(seconds: 30));

      debugPrint('====> [CubeOne] Request OTP response status: ${response.statusCode}');
      debugPrint('====> [CubeOne] Request OTP response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        Map<String, dynamic> body = jsonDecode(response.body);
        
        if (body['success'] == true) {
          debugPrint('====> [CubeOne] OTP sent successfully');
          return ResponseModel(true, body['message'] ?? 'OTP sent successfully');
        } else {
          String errorMessage = body['message'] ?? 'Failed to send OTP';
          debugPrint('====> [CubeOne] OTP request failed: $errorMessage');
          return ResponseModel(false, errorMessage);
        }
      } else {
        String errorMessage = 'Failed to send OTP: ${response.statusCode}';
        try {
          Map<String, dynamic> errorBody = jsonDecode(response.body);
          errorMessage = errorBody['message'] ?? errorMessage;
          debugPrint('====> [CubeOne] OTP request error response: $errorBody');
        } catch (e) {
          debugPrint('====> [CubeOne] Failed to parse error response: $e');
        }
        return ResponseModel(false, errorMessage);
      }
    } catch (e, stackTrace) {
      debugPrint('====> [CubeOne] Request OTP error: $e');
      debugPrint('====> [CubeOne] Stack trace: $stackTrace');
      return ResponseModel(false, 'Failed to request OTP: ${e.toString()}');
    }
  }

  @override
  Future<ResponseModel> verifyCubeOneOtp(String username, String otp) async {
    try {
      debugPrint('====> [CubeOne] Verifying OTP for username: $username');
      Map<String, String> headers = {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      };

      http.Response response = await http.post(
        Uri.parse('${AppConstants.cubeOneBaseUrl}${AppConstants.cubeOneVerifyOtpUri}'),
        headers: headers,
        body: jsonEncode({
          'username': username,
          'otp': otp,
        }),
      ).timeout(Duration(seconds: 30));

      debugPrint('====> [CubeOne] Verify OTP response status: ${response.statusCode}');
      debugPrint('====> [CubeOne] Verify OTP response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        Map<String, dynamic> body = jsonDecode(response.body);
        
        if (body['success'] == true) {
          debugPrint('====> [CubeOne] OTP verified successfully: ${body['data']}');
          return ResponseModel(true, body['message'] ?? 'OTP verified successfully', body['data']);
        } else {
          String errorMessage = body['message'] ?? 'OTP verification failed';
          debugPrint('====> [CubeOne] OTP verification failed: $errorMessage');
          return ResponseModel(false, errorMessage);
        }
      } else {
        String errorMessage = 'OTP verification failed: ${response.statusCode}';
        try {
          Map<String, dynamic> errorBody = jsonDecode(response.body);
          errorMessage = errorBody['message'] ?? errorMessage;
          debugPrint('====> [CubeOne] OTP verification error response: $errorBody');
        } catch (e) {
          debugPrint('====> [CubeOne] Failed to parse error response: $e');
        }
        return ResponseModel(false, errorMessage);
      }
    } catch (e, stackTrace) {
      debugPrint('====> [CubeOne] Verify OTP error: $e');
      debugPrint('====> [CubeOne] Stack trace: $stackTrace');
      return ResponseModel(false, 'Failed to verify OTP: ${e.toString()}');
    }
  }

  @override
  Future<ResponseModel> loginCubeOne(String username, String otp) async {
    try {
      debugPrint('====> [CubeOne] Logging in with username: $username');
      Map<String, String> headers = {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      };

      http.Response response = await http.post(
        Uri.parse('${AppConstants.cubeOneBaseUrl}${AppConstants.cubeOneLoginUri}'),
        headers: headers,
        body: jsonEncode({
          'username': username,
          'login_otp': otp,
        }),
      ).timeout(Duration(seconds: 30));

      debugPrint('====> [CubeOne] Login response status: ${response.statusCode}');
      debugPrint('====> [CubeOne] Login response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        Map<String, dynamic> body = jsonDecode(response.body);
        
        if (body['success'] == true) {
          debugPrint('====> [CubeOne] Login successful: ${body['data']}');
          return ResponseModel(true, body['message'] ?? 'Login successful', body['data']);
        } else {
          String errorMessage = body['message'] ?? 'Login failed';
          debugPrint('====> [CubeOne] Login failed: $errorMessage');
          return ResponseModel(false, errorMessage);
        }
      } else {
        String errorMessage = 'Login failed: ${response.statusCode}';
        try {
          Map<String, dynamic> errorBody = jsonDecode(response.body);
          errorMessage = errorBody['message'] ?? errorMessage;
          debugPrint('====> [CubeOne] Login error response: $errorBody');
        } catch (e) {
          debugPrint('====> [CubeOne] Failed to parse error response: $e');
        }
        return ResponseModel(false, errorMessage);
      }
    } catch (e, stackTrace) {
      debugPrint('====> [CubeOne] Login error: $e');
      debugPrint('====> [CubeOne] Stack trace: $stackTrace');
      return ResponseModel(false, 'Failed to login: ${e.toString()}');
    }
  }

  @override
  Future<ResponseModel> sendOtp(String phone) async {
    // Demo account: 9975008124 - always return success
    if (phone.contains('9975008124') || phone.endsWith('9975008124')) {
      return ResponseModel(true, 'OTP sent successfully');
    }

    // Format phone for CubeOne API (91<mobile>)
    String formattedPhone = _formatPhoneForCubeOne(phone);

    // Use CubeOne API to request OTP
    return await requestCubeOneOtp(formattedPhone);
  }

  @override
  Future<ResponseModel> verifyOtp(String phone, String otp, {bool isLogin = true, String? firstName, String? lastName, String? email}) async {
    // Demo account: 9975008124 / OTP: 1234
    if ((phone.contains('9975008124') || phone.endsWith('9975008124')) && otp == '1234') {
      // For demo account, create a mock token
      String demoToken = 'demo_token_${DateTime.now().millisecondsSinceEpoch}';
      await saveUserToken(demoToken, AppConstants.topic);
      await updateToken();
      return ResponseModel(true, 'OTP verified successfully');
    }
    
    // Format phone for CubeOne API (91<mobile>)
    String formattedPhone = _formatPhoneForCubeOne(phone);

    // First verify OTP with CubeOne
    ResponseModel cubeOneResponse = await verifyCubeOneOtp(formattedPhone, otp);
    
    if (!cubeOneResponse.isSuccess) {
      return cubeOneResponse; // Return CubeOne error
    }

    // After successful CubeOne OTP verification, skip backend verification
    // CubeOne handles OTP verification, so we don't need to call our backend
    // Driver creation/authentication will be handled separately if needed
    
    // For now, return success after CubeOne verification
    // Note: Token generation and driver creation should be handled by the login flow
    // or a separate endpoint if needed
    debugPrint('====> [CubeOne] OTP verified successfully, skipping backend verification');
    return ResponseModel(true, 'OTP verified successfully');
  }

  @override
  Future<ResponseModel> logout() async {
    try {
      debugPrint('====> Calling logout endpoint: ${AppConstants.driverLogoutUri}');
      Response response = await apiClient.postData(
        AppConstants.driverLogoutUri,
        {},
        handleError: false,
      );
      
      debugPrint('====> Logout response status: ${response.statusCode}');
      debugPrint('====> Logout response body: ${response.body}');
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        return ResponseModel(true, response.body['message'] ?? 'Logged out successfully');
      } else {
        String errorMessage = 'Logout failed';
        if (response.body is Map) {
          errorMessage = response.body['message'] ?? response.statusText ?? errorMessage;
        }
        debugPrint('====> Logout endpoint returned error: $errorMessage');
        // Log the error but still allow logout to proceed
        return ResponseModel(false, errorMessage);
      }
    } catch (e) {
      debugPrint('====> Logout endpoint exception: $e');
      // Log the error but still allow logout to proceed
      return ResponseModel(false, 'Logout endpoint error: ${e.toString()}');
    }
  }
}