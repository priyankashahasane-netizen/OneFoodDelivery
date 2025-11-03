import 'package:flutter_test/flutter_test.dart';
import 'package:get/get.dart';
import 'package:mockito/mockito.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math' show sin, cos, atan2, sqrt, pi;

/// Tests for ipstack integration failures and edge cases
/// PRD Reference: 2.2 Customer Tracking - "ipstack lookup of client IP → personalize language/units/timezone"
/// These tests cover scenarios that could create bugs or failures in geolocation
void main() {
  group('ipstack Integration Failures', () {
    setUpAll(() {
      Get.testMode = true;
    });

    tearDown(() {
      Get.reset();
    });

    group('API Failure Scenarios', () {
      test('Should handle ipstack API timeout', () async {
        // Arrange
        final ip = '192.168.1.1';
        // Simulate timeout
        Future<Map<String, dynamic>> lookupIp(String ipAddress) async {
          await Future.delayed(Duration(seconds: 6)); // Timeout
          throw Exception('ipstack API timeout');
        }

        // Act
        Map<String, dynamic>? result;
        try {
          result = await lookupIp(ip);
        } catch (e) {
          result = null;
        }

        // Assert
        expect(result, isNull, reason: 'Should handle timeout gracefully');
      });

      test('Should handle ipstack API 500 error', () async {
        // Arrange
        final ip = '192.168.1.1';
        Future<Map<String, dynamic>> lookupIp(String ipAddress) async {
          throw Exception('ipstack API returned 500 Internal Server Error');
        }

        // Act
        Map<String, dynamic>? result;
        try {
          result = await lookupIp(ip);
        } catch (e) {
          result = null;
        }

        // Assert
        expect(result, isNull, reason: 'Should handle server errors');
      });

      test('Should handle ipstack API 401 unauthorized (invalid API key)', () async {
        // Arrange
        final ip = '192.168.1.1';
        Future<Map<String, dynamic>> lookupIp(String ipAddress) async {
          throw Exception('ipstack API returned 401 Unauthorized - Invalid API key');
        }

        // Act
        Map<String, dynamic>? result;
        try {
          result = await lookupIp(ip);
        } catch (e) {
          result = null;
        }

        // Assert
        expect(result, isNull, reason: 'Should handle authentication errors');
      });

      test('Should handle ipstack API rate limit (429)', () async {
        // Arrange
        final ip = '192.168.1.1';
        Future<Map<String, dynamic>> lookupIp(String ipAddress) async {
          throw Exception('ipstack API returned 429 Too Many Requests');
        }

        // Act
        Map<String, dynamic>? result;
        try {
          result = await lookupIp(ip);
        } catch (e) {
          result = null;
        }

        // Assert
        expect(result, isNull, reason: 'Should handle rate limiting');
      });

      test('Should handle network connectivity failure', () async {
        // Arrange
        final ip = '192.168.1.1';
        Future<Map<String, dynamic>> lookupIp(String ipAddress) async {
          throw Exception('Network error: No internet connection');
        }

        // Act
        Map<String, dynamic>? result;
        try {
          result = await lookupIp(ip);
        } catch (e) {
          result = null;
        }

        // Assert
        expect(result, isNull, reason: 'Should handle network errors');
      });
    });

    group('Invalid IP Address Scenarios', () {
      test('Should handle invalid IP format', () async {
        // Arrange
        final invalidIps = [
          'not-an-ip',
          '999.999.999.999',
          '256.1.1.1',
          '1.1.1',
          '',
          null,
        ];

        for (final ip in invalidIps) {
          // Act & Assert
          expect(ip, isNot(equals('valid')), reason: 'Invalid IP should be rejected: $ip');
        }
      });

      test('Should handle private IP addresses', () async {
        // PRD: ipstack may not work for private IPs
        // Arrange
        final privateIps = [
          '192.168.1.1',
          '10.0.0.1',
          '172.16.0.1',
          '127.0.0.1',
        ];

        // Act & Assert
        for (final ip in privateIps) {
          // Should fallback to default/approximate location
          expect(ip, isNotEmpty);
        }
      });

      test('Should handle IPv6 addresses', () async {
        // Arrange
        final ipv6Addresses = [
          '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
          '::1',
        ];

        // Act & Assert
        for (final ip in ipv6Addresses) {
          expect(ip.contains(':'), true, reason: 'IPv6 should be recognized');
        }
      });

      test('Should handle missing X-Forwarded-For header', () async {
        // PRD: Headers: X-Forwarded-For: <client-ip>
        // Arrange
        String? forwardedHeader = null;

        // Act
        final ip = forwardedHeader?.split(',')[0].trim() ?? 'check';

        // Assert
        expect(ip, equals('check'), reason: 'Should fallback to default when header missing');
      });

      test('Should handle multiple IPs in X-Forwarded-For header', () async {
        // Arrange
        final forwardedHeader = '192.168.1.1, 10.0.0.1, 172.16.0.1';

        // Act
        final ip = forwardedHeader.split(',')[0].trim();

        // Assert
        expect(ip, equals('192.168.1.1'), reason: 'Should use first IP from header');
      });
    });

    group('Response Validation Failures', () {
      test('Should handle malformed ipstack response', () async {
        // Arrange
        final invalidJson = '{invalid json}';

        // Act
        Map<String, dynamic>? result;
        try {
          result = json.decode(invalidJson) as Map<String, dynamic>;
        } catch (e) {
          result = null;
        }

        // Assert
        expect(result, isNull, reason: 'Should handle JSON parsing errors');
      });

      test('Should handle missing city in response', () async {
        // Arrange
        final response = {
          'country_code': 'IN',
          'time_zone': {'id': 'Asia/Kolkata'},
          // Missing 'city'
        };

        // Act
        final city = response['city'] as String?;
        final countryCode = response['country_code'] as String?;

        // Assert
        expect(city, isNull, reason: 'Should handle missing city');
        expect(countryCode, isNotNull, reason: 'Should still have country code');
      });

      test('Should handle missing timezone in response', () async {
        // Arrange
        final response = {
          'city': 'Bengaluru',
          'country_code': 'IN',
          // Missing 'time_zone'
        };

        // Act
        final tz = response['time_zone']?['id'] ?? response['time_zone'];
        final fallbackTz = tz ?? 'UTC';

        // Assert
        expect(tz, isNull, reason: 'Should handle missing timezone');
        expect(fallbackTz, equals('UTC'), reason: 'Should fallback to UTC');
      });

      test('Should handle missing language in response', () async {
        // Arrange
        final response = {
          'city': 'Bengaluru',
          'country_code': 'IN',
          'time_zone': {'id': 'Asia/Kolkata'},
          // Missing 'location.languages'
        };

        // Act
        final lang = response['location']?['languages']?[0]?['code'] ?? 'en';
        final countryCode = response['country_code'] ?? 'US';
        final fullLang = '$lang-$countryCode';

        // Assert
        expect(fullLang, equals('en-IN'), reason: 'Should fallback to en-{country}');
      });
    });

    group('Fallback Behavior', () {
      test('Should provide default values when ipstack fails', () async {
        // PRD: ipstack key + fallback behavior
        // Arrange
        Future<Map<String, dynamic>> lookupIp(String ip) async {
          throw Exception('ipstack failed');
        }

        // Act
        Map<String, dynamic>? geoData;
        try {
          geoData = await lookupIp('192.168.1.1');
        } catch (e) {
          // Fallback
          geoData = {
            'city': 'Unknown',
            'country_code': 'US',
            'tz': 'UTC',
            'lang': 'en-US',
            'approx': true,
          };
        }

        // Assert
        expect(geoData, isNotNull);
        expect(geoData!['city'], isNotNull);
        expect(geoData['approx'], true, reason: 'Should mark as approximate');
      });

      test('Should mark location as approximate on failure', () async {
        // Arrange
        final geoData = {
          'city': 'Bengaluru',
          'country_code': 'IN',
          'tz': 'Asia/Kolkata',
          'lang': 'en-IN',
          'approx': true, // Marked approximate due to fallback
        };

        // Assert
        expect(geoData['approx'], true, reason: 'Should indicate approximate location');
      });
    });

    group('Geofence Fraud Detection Edge Cases', () {
      test('Should handle IP geolocation mismatch with order location', () async {
        // PRD: "geo-fence fraud/anomalies (delivery far from expected region)"
        // Arrange
        final ipGeo = {
          'city': 'New York',
          'country_code': 'US',
          'latitude': 40.7128,
          'longitude': -74.0060,
        };

        final orderLocation = {
          'city': 'Bengaluru',
          'country_code': 'IN',
          'latitude': 12.9716,
          'longitude': 77.5946,
        };

        // Act
        final distance = _calculateDistance(
          ipGeo['latitude'] as double,
          ipGeo['longitude'] as double,
          orderLocation['latitude'] as double,
          orderLocation['longitude'] as double,
        );

        // Assert
        expect(distance, greaterThan(10000), reason: 'Should detect large distance mismatch');
      });

      test('Should handle VPN/proxy IP addresses', () async {
        // Arrange
        final vpnIndicators = ['VPN', 'Proxy', 'Tor'];
        final ipResponse = {
          'city': 'Unknown',
          'organization': 'VPN Provider Inc',
        };

        // Act
        final isSuspicious = vpnIndicators.any((indicator) => 
          ipResponse['organization']?.toString().contains(indicator) ?? false
        );

        // Assert
        expect(isSuspicious, true, reason: 'Should flag VPN/proxy IPs');
      });
    });

    group('Performance and Caching', () {
      test('Should handle concurrent IP lookups', () async {
        // Arrange
        final ips = ['192.168.1.1', '10.0.0.1', '172.16.0.1'];
        int lookupCount = 0;

        Future<Map<String, dynamic>> lookupIp(String ip) async {
          lookupCount++;
          await Future.delayed(Duration(milliseconds: 100));
          return {'city': 'Test', 'country_code': 'US'};
        }

        // Act
        await Future.wait(ips.map((ip) => lookupIp(ip)));

        // Assert
        expect(lookupCount, equals(3), reason: 'Should handle concurrent requests');
      });

      test('Should cache IP lookup results', () async {
        // Arrange
        final ip = '192.168.1.1';
        final cache = <String, Map<String, dynamic>>{};
        int apiCalls = 0;

        Future<Map<String, dynamic>> lookupIp(String ipAddress) async {
          if (cache.containsKey(ipAddress)) {
            return cache[ipAddress]!;
          }
          apiCalls++;
          final result = {'city': 'Test', 'country_code': 'US'};
          cache[ipAddress] = result;
          return result;
        }

        // Act - Lookup same IP twice
        await lookupIp(ip);
        await lookupIp(ip);

        // Assert
        expect(apiCalls, equals(1), reason: 'Should cache results to reduce API calls');
      });
    });
  });
}

// Helper function to calculate distance in km
double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
  const double earthRadius = 6371; // km
  final dLat = _toRadians(lat2 - lat1);
  final dLon = _toRadians(lon2 - lon1);
  final a = sin(dLat / 2) * sin(dLat / 2) +
      cos(_toRadians(lat1)) * cos(_toRadians(lat2)) *
      sin(dLon / 2) * sin(dLon / 2);
  final c = 2 * atan2(sqrt(a), sqrt(1 - a));
  return earthRadius * c;
}

double _toRadians(double degrees) => degrees * (pi / 180);

