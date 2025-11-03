import 'package:flutter_test/flutter_test.dart';
import 'dart:io';
import 'package:path/path.dart' as path;

/// Tests to verify OpenStreetMap configuration across all project files
/// PRD Reference: Key Integrations - "OpenStreetMap (https://www.openstreetmap.org/)"
void main() {
  group('OpenStreetMap Configuration File Verification', () {
    test('docker-compose.yml should contain OpenStreetMap tile URLs', () async {
      // Arrange
      final filePath = path.join(Directory.current.path, 'docker-compose.yml');
      final file = File(filePath);

      if (file.existsSync()) {
        final content = await file.readAsString();

        // Assert
        expect(
          content.contains('tile.openstreetmap.org'),
          isTrue,
          reason: 'docker-compose.yml should configure OpenStreetMap tiles',
        );

        expect(
          content.contains('NEXT_PUBLIC_OSM_TILES'),
          isTrue,
          reason: 'Should set OSM tiles environment variable',
        );
      }
    });

    test('docker-compose.prod.yml should contain OpenStreetMap tile URLs', () async {
      // Arrange
      final filePath = path.join(
        Directory.current.path,
        'docker-compose.prod.yml',
      );
      final file = File(filePath);

      if (file.existsSync()) {
        final content = await file.readAsString();

        // Assert
        expect(
          content.contains('tile.openstreetmap.org'),
          isTrue,
          reason: 'docker-compose.prod.yml should configure OpenStreetMap tiles',
        );
      }
    });

    test('USE_LOCAL_POSTGRES.sh should configure OpenStreetMap URLs', () async {
      // Arrange
      final filePath = path.join(
        Directory.current.path,
        'USE_LOCAL_POSTGRES.sh',
      );
      final file = File(filePath);

      if (file.existsSync()) {
        final content = await file.readAsString();

        // Assert
        expect(
          content.contains('NOMINATIM_URL') ||
              content.contains('nominatim.openstreetmap.org'),
          isTrue,
          reason: 'Should configure Nominatim URL',
        );

        expect(
          content.contains('OSM_TILES_URL') ||
              content.contains('tile.openstreetmap.org'),
          isTrue,
          reason: 'Should configure OSM tiles URL',
        );
      }
    });

    test('Environment variable names should follow OSM convention', () async {
      // Arrange
      final dockerComposeFile = File(
        path.join(Directory.current.path, 'docker-compose.yml'),
      );

      if (dockerComposeFile.existsSync()) {
        final content = await dockerComposeFile.readAsString();

        // Assert - Should use standard OSM environment variable names
        final hasOSMTiles = content.contains('NEXT_PUBLIC_OSM_TILES') ||
            content.contains('OSM_TILES_URL');
        expect(
          hasOSMTiles,
          isTrue,
          reason: 'Should use OSM-related environment variable names',
        );
      }
    });
  });

  group('OpenStreetMap URL Format Verification', () {
    test('All OSM URLs should use HTTPS protocol', () async {
      // Arrange
      final filesToCheck = [
        'docker-compose.yml',
        'docker-compose.prod.yml',
        'USE_LOCAL_POSTGRES.sh',
      ];

      for (final fileName in filesToCheck) {
        final filePath = path.join(Directory.current.path, fileName);
        final file = File(filePath);

        if (file.existsSync()) {
          final content = await file.readAsString();

          // Extract OSM URLs
          final osmUrlRegex = RegExp(
            r'https?://[^\s]*openstreetmap\.org[^\s]*',
            caseSensitive: false,
          );
          final matches = osmUrlRegex.allMatches(content);

          for (final match in matches) {
            final url = match.group(0)!;
            expect(
              url.startsWith('https://'),
              isTrue,
              reason: 'OSM URL in $fileName should use HTTPS: $url',
            );
          }
        }
      }
    });

    test('OSM tile URLs should use correct template format', () async {
      // Arrange
      final dockerComposeFile = File(
        path.join(Directory.current.path, 'docker-compose.yml'),
      );

      if (dockerComposeFile.existsSync()) {
        final content = await dockerComposeFile.readAsString();

        // Extract tile URLs
        final tileUrlRegex = RegExp(
          r'https://[^\s]*tile\.openstreetmap\.org[^\s]*',
        );
        final matches = tileUrlRegex.allMatches(content);

        for (final match in matches) {
          final url = match.group(0)!;
          // Should contain template variables
          expect(
            url.contains('{z}') && url.contains('{x}') && url.contains('{y}'),
            isTrue,
            reason: 'Tile URL should use template format with z, x, y: $url',
          );
        }
      }
    });
  });

  group('OpenStreetMap Service Integration Points', () {
    test('Backend configuration should reference OpenStreetMap', () async {
      // Arrange
      final configPath = path.join(
        Directory.current.path,
        'apps',
        'backend',
        'src',
        'config',
        'configuration.ts',
      );
      final file = File(configPath);

      if (file.existsSync()) {
        final content = await file.readAsString();

        // Assert
        expect(
          content.contains('nominatim.openstreetmap.org') ||
              content.contains('tile.openstreetmap.org'),
          isTrue,
          reason: 'Backend configuration should reference OpenStreetMap',
        );
      }
    });

    test('Admin dashboard should use OpenStreetMap tiles', () async {
      // Arrange
      final liveOpsPath = path.join(
        Directory.current.path,
        'apps',
        'admin-dashboard',
        'src',
        'app',
        'live-ops',
        'page.tsx',
      );
      final file = File(liveOpsPath);

      if (file.existsSync()) {
        final content = await file.readAsString();

        // Assert
        expect(
          content.contains('tile.openstreetmap.org') ||
              content.contains('NEXT_PUBLIC_OSM_TILES'),
          isTrue,
          reason: 'Admin dashboard should use OpenStreetMap tiles',
        );
      }
    });

    test('Tracking web should use OpenStreetMap tiles', () async {
      // Arrange
      final trackingMapPath = path.join(
        Directory.current.path,
        'apps',
        'tracking-web',
        'src',
        'components',
        'TrackingMap.tsx',
      );
      final file = File(trackingMapPath);

      if (file.existsSync()) {
        final content = await file.readAsString();

        // Assert
        expect(
          content.contains('tile.openstreetmap.org') ||
              content.contains('NEXT_PUBLIC_OSM_TILES'),
          isTrue,
          reason: 'Tracking web should use OpenStreetMap tiles',
        );
      }
    });
  });
}

