import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart' as ll;

class DirectionsHelper {
  // OSRM public server
  static const String _osrmBaseUrl = 'https://router.project-osrm.org/route/v1/driving';
  
  /// Get route between two points using OSRM
  static Future<List<ll.LatLng>> getRoute(
    double startLat,
    double startLng,
    double endLat,
    double endLng,
  ) async {
    try {
      // OSRM format: /route/v1/{profile}/{coordinates}?overview=full&geometries=geojson
      // Note: OSRM uses [lng, lat] format, not [lat, lng]
      final url = Uri.parse(
        '$_osrmBaseUrl/$startLng,$startLat;$endLng,$endLat?overview=full&geometries=geojson'
      );
      
      if (kDebugMode) {
        print('🔵 DirectionsHelper: Fetching route from OSRM');
        print('   URL: $url');
        print('   Start: $startLat, $startLng');
        print('   End: $endLat, $endLng');
      }
      
      final response = await http.get(url).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          if (kDebugMode) {
            print('❌ DirectionsHelper: Request timeout');
          }
          throw Exception('Request timeout');
        },
      );
      
      if (kDebugMode) {
        print('🔵 DirectionsHelper: Response status: ${response.statusCode}');
        print('   Response body length: ${response.body.length}');
      }
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        if (kDebugMode) {
          print('🔵 DirectionsHelper: Response code: ${data['code']}');
          print('   Routes count: ${data['routes']?.length ?? 0}');
        }
        
        if (data['code'] == 'Ok' && data['routes'] != null && data['routes'].isNotEmpty) {
          final route = data['routes'][0];
          final geometry = route['geometry'];
          
          if (geometry != null && geometry['coordinates'] != null) {
            // GeoJSON format: [lng, lat] pairs
            List<dynamic> coordinates = geometry['coordinates'];
            final points = coordinates.map((coord) {
              return ll.LatLng(coord[1].toDouble(), coord[0].toDouble());
            }).toList();
            
            if (kDebugMode) {
              print('✅ DirectionsHelper: Successfully decoded ${points.length} route points');
              if (points.isNotEmpty) {
                print('   First point: ${points.first.latitude}, ${points.first.longitude}');
                print('   Last point: ${points.last.latitude}, ${points.last.longitude}');
              }
            }
            
            return points;
          } else {
            if (kDebugMode) {
              print('❌ DirectionsHelper: No geometry in route response');
            }
          }
        } else {
          if (kDebugMode) {
            print('❌ DirectionsHelper: Route not found. Code: ${data['code']}');
            if (data['code'] == 'NoRoute') {
              print('   No route found between these points');
            }
          }
        }
      } else {
        if (kDebugMode) {
          print('❌ DirectionsHelper: HTTP error ${response.statusCode}');
          print('   Response: ${response.body}');
        }
      }
    } catch (e, stackTrace) {
      if (kDebugMode) {
        print('❌ DirectionsHelper: Exception occurred');
        print('   Error: $e');
        print('   Stack trace: $stackTrace');
      }
    }
    
    // Fallback: return straight line if API fails
    if (kDebugMode) {
      print('⚠️ DirectionsHelper: Falling back to straight line');
    }
    return [
      ll.LatLng(startLat, startLng),
      ll.LatLng(endLat, endLng),
    ];
  }
}

