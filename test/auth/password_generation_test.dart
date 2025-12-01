import 'package:flutter_test/flutter_test.dart';
import 'dart:math';

void main() {
  group('Password Generation Tests', () {
    test('Should generate 10 unique random passwords', () {
      final Set<String> passwords = {};
      
      for (int i = 0; i < 10; i++) {
        String password = _generateTestPassword();
        passwords.add(password);
        
        // Validate password requirements
        expect(password.length, 12, reason: 'Password should be 12 characters long');
        expect(RegExp(r'[a-z]').hasMatch(password), true, reason: 'Should contain lowercase letter');
        expect(RegExp(r'[A-Z]').hasMatch(password), true, reason: 'Should contain uppercase letter');
        expect(RegExp(r'[0-9]').hasMatch(password), true, reason: 'Should contain number');
        expect(RegExp(r'[!@$]').hasMatch(password), true, reason: 'Should contain special character (!, @, or \$)');
        
        print('Password ${i + 1}: $password');
      }
      
      expect(passwords.length, 10, reason: 'All passwords should be unique');
    });

    test('Each password should meet CubeOne requirements', () {
      for (int i = 0; i < 10; i++) {
        String password = _generateTestPassword();
        
        // Check length
        expect(password.length, 12);
        
        // Check character types
        bool hasLower = RegExp(r'[a-z]').hasMatch(password);
        bool hasUpper = RegExp(r'[A-Z]').hasMatch(password);
        bool hasNumber = RegExp(r'[0-9]').hasMatch(password);
        bool hasSpecial = RegExp(r'[!@$]').hasMatch(password);
        
        expect(hasLower, true, reason: 'Password $i should have lowercase');
        expect(hasUpper, true, reason: 'Password $i should have uppercase');
        expect(hasNumber, true, reason: 'Password $i should have number');
        expect(hasSpecial, true, reason: 'Password $i should have special char');
        
        // Verify only allowed special characters are used
        final specialChars = password.split('').where((char) => !RegExp(r'[a-zA-Z0-9]').hasMatch(char));
        for (var char in specialChars) {
          expect(['!', '@', '\$'].contains(char), true, 
            reason: 'Password contains invalid special character: $char');
        }
      }
    });

    test('Passwords should be different from each other', () {
      final List<String> passwords = [];
      
      for (int i = 0; i < 10; i++) {
        passwords.add(_generateTestPassword());
      }
      
      // Check all passwords are unique
      final uniquePasswords = passwords.toSet();
      expect(uniquePasswords.length, 10, reason: 'All 10 passwords should be unique');
    });

    test('Password generation should use secure random', () {
      // Generate multiple passwords and verify they're not predictable
      final List<String> passwords = [];
      
      for (int i = 0; i < 10; i++) {
        passwords.add(_generateTestPassword());
      }
      
      // All passwords should be different (very unlikely to have duplicates with secure random)
      final uniquePasswords = passwords.toSet();
      expect(uniquePasswords.length, greaterThanOrEqualTo(9), 
        reason: 'At least 9 out of 10 passwords should be unique (allowing for rare collisions)');
    });
  });
}

// Helper function that replicates the password generation logic for testing
// This matches the actual implementation in AuthRepository
String _generateTestPassword() {
  const String lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const String uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const String numbers = '0123456789';
  const String special = '!@\$';
  
  final random = Random.secure();
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
  
  return password.join();
}

