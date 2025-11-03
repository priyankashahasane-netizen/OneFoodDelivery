import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'dart:io';
import 'package:path/path.dart' as path;

/// Tests to verify that the project uses OpenStreetMap (https://www.openstreetmap.org)
/// PRD Reference: Key Integrations - "OpenStreetMap (https://www.openstreetmap.org/) — map baselayer & geocoding"
void main() {
  group('OpenStreetMap Integration Verification', () {
    test('Flutter app should use OpenStreetMap tile URL in order_location_screen.dart', () async {
      // Arrange
      final filePath = path.join(
        Directory.current.path,
        'lib',
        'feature',
        'order',
        'screens',
        'order_location_screen.dart',
      );
      final file = File(filePath);

      // Assert - File should exist
      expect(file.existsSync(), isTrue, reason: 'order_location_screen.dart should exist');

      // Read file content
      final content = await file.readAsString();

      // Assert - Should contain OpenStreetMap tile URL
      expect(
        content.contains('tile.openstreetmap.org'),
        isTrue,
        reason: 'Should use OpenStreetMap tile server URL',
      );

      // Assert - Should use subdomains a, b, c
      expect(
        content.contains("subdomains: const ['a','b','c']"),
        isTrue,
        reason: 'Should use OSM subdomains for load distribution',
      );

      // Assert - URL template format should be correct
      expect(
        content.contains('{z}/{x}/{y}.png'),
        isTrue,
        reason: 'Should use OSM tile URL template format',
      );
    });

    test('OSM tile URL should match official OpenStreetMap domain', () async {
      // Arrange
      final filePath = path.join(
        Directory.current.path,
        'lib',
        'feature',
        'order',
        'screens',
        'order_location_screen.dart',
      );
      final file = File(filePath);
      final content = await file.readAsString();

      // Extract tile URL pattern
      final regex = RegExp(r'https://.*tile\.openstreetmap\.org/[^{}]*\{z\}/\{x\}/\{y\}\.png');
      final match = regex.firstMatch(content);

      // Assert
      expect(
        match,
        isNotNull,
        reason: 'Should contain OpenStreetMap tile URL pattern',
      );

      if (match != null) {
        final url = match.group(0);
        expect(
          url,
          isNotNull,
          reason: 'Tile URL should be extracted',
        );
        expect(
          url!.contains('tile.openstreetmap.org'),
          isTrue,
          reason: 'Tile URL should point to official OpenStreetMap tile server',
        );
      }
    });

    test('OSM tile URL should not use Google Maps or other mapping services', () async {
      // Arrange
      final filePath = path.join(
        Directory.current.path,
        'lib',
        'feature',
        'order',
        'screens',
        'order_location_screen.dart',
      );
      final file = File(filePath);
      final content = await file.readAsString();

      // Assert - Should not contain Google Maps URLs
      expect(
        content.contains('maps.googleapis.com'),
        isFalse,
        reason: 'Should not use Google Maps',
      );

      expect(
        content.contains('google.com/maps'),
        isFalse,
        reason: 'Should not use Google Maps',
      );

      // Assert - Should contain OpenStreetMap
      expect(
        content.contains('openstreetmap'),
        isTrue,
        reason: 'Should use OpenStreetMap',
      );
    });

    test('OSM tile URL format should be correct for Flutter Map', () async {
      // Arrange
      final filePath = path.join(
        Directory.current.path,
        'lib',
        'feature',
        'order',
        'screens',
        'order_location_screen.dart',
      );
      final file = File(filePath);
      final content = await file.readAsString();

      // Assert - Should use TileLayer widget
      expect(
        content.contains('TileLayer'),
        isTrue,
        reason: 'Should use Flutter Map TileLayer widget',
      );

      // Assert - URL template should be properly formatted
      expect(
        content.contains('urlTemplate:'),
        isTrue,
        reason: 'Should specify urlTemplate for TileLayer',
      );
    });
  });

  group('OpenStreetMap Configuration Verification', () {
    test('pubspec.yaml should include flutter_map package for OSM integration', () async {
      // Arrange
      final filePath = path.join(Directory.current.path, 'pubspec.yaml');
      final file = File(filePath);

      // Assert
      expect(file.existsSync(), isTrue, reason: 'pubspec.yaml should exist');

      final content = await file.readAsString();

      // Assert - Should include flutter_map or similar mapping package
      expect(
        content.contains('flutter_map:') || content.contains('flutter_map'),
        isTrue,
        reason: 'Should include flutter_map package for OSM tile rendering',
      );
    });

    test('OSM tile URLs should use HTTPS protocol', () async {
      // Arrange
      final filePath = path.join(
        Directory.current.path,
        'lib',
        'feature',
        'order',
        'screens',
        'order_location_screen.dart',
      );
      final file = File(filePath);
      final content = await file.readAsString();

      // Extract URLs
      final httpsRegex = RegExp(r'https://[^\s]+tile\.openstreetmap\.org[^\s]*');
      final httpRegex = RegExp(r'http://[^\s]+tile\.openstreetmap\.org[^\s]*');

      // Assert - Should use HTTPS
      expect(
        httpsRegex.hasMatch(content),
        isTrue,
        reason: 'OSM tile URLs should use HTTPS for security',
      );

      // Assert - Should not use HTTP
      expect(
        httpRegex.hasMatch(content),
        isFalse,
        reason: 'OSM tile URLs should not use insecure HTTP',
      );
    });
  });

  group('OpenStreetMap Attribution and Compliance', () {
    test('Project README should mention OpenStreetMap', () async {
      // Arrange
      final filePath = path.join(Directory.current.path, 'README.md');
      final file = File(filePath);

      if (file.existsSync()) {
        final content = await file.readAsString();

        // Assert - README should mention OpenStreetMap
        expect(
          content.toLowerCase().contains('openstreetmap') ||
              content.toLowerCase().contains('osm'),
          isTrue,
          reason: 'README should document OpenStreetMap usage',
        );
      }
    });

    test('PRD should reference OpenStreetMap integration', () async {
      // Arrange
      final filePath = path.join(Directory.current.path, 'prd.md');
      final file = File(filePath);

      if (file.existsSync()) {
        final content = await file.readAsString();

        // Assert - PRD should mention OpenStreetMap
        expect(
          content.contains('openstreetmap.org') ||
              content.contains('OpenStreetMap'),
          isTrue,
          reason: 'PRD should document OpenStreetMap as a key integration',
        );
      }
    });
  });
}

