import configuration from './configuration.js';
import { validationSchema } from './validation.js';

/**
 * OpenStreetMap Configuration Verification Tests
 * Verifies that backend configuration uses OpenStreetMap services
 * PRD Reference: Key Integrations - "OpenStreetMap (https://www.openstreetmap.org/) — map baselayer & geocoding"
 */
describe('OpenStreetMap Configuration Verification', () => {
  describe('Configuration Default Values', () => {
    it('should have default Nominatim URL pointing to OpenStreetMap', () => {
      // Arrange
      const config = configuration();

      // Assert
      expect(config.osm.nominatimUrl).toBe('https://nominatim.openstreetmap.org');
      expect(config.osm.nominatimUrl).toContain('nominatim.openstreetmap.org');
      expect(config.osm.nominatimUrl).toMatch(/^https:\/\//);
    });

    it('should have default OSM tiles URL pointing to OpenStreetMap', () => {
      // Arrange
      const config = configuration();

      // Assert
      expect(config.osm.tilesUrl).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
      expect(config.osm.tilesUrl).toContain('tile.openstreetmap.org');
      expect(config.osm.tilesUrl).toMatch(/^https:\/\//);
      expect(config.osm.tilesUrl).toContain('{z}/{x}/{y}.png');
    });

    it('should have OSM configuration object defined', () => {
      // Arrange
      const config = configuration();

      // Assert
      expect(config.osm).toBeDefined();
      expect(config.osm).toHaveProperty('nominatimUrl');
      expect(config.osm).toHaveProperty('tilesUrl');
    });
  });

  describe('Environment Variable Validation', () => {
    it('should validate NOMINATIM_URL defaults to OpenStreetMap', () => {
      // Arrange
      const schema = validationSchema;

      // Act
      const { error, value } = schema.validate({});

      // Assert
      expect(error).toBeUndefined();
      expect(value.NOMINATIM_URL).toBe('https://nominatim.openstreetmap.org');
    });

    it('should validate OSM_TILES_URL defaults to OpenStreetMap', () => {
      // Arrange
      const schema = validationSchema;

      // Act
      const { error, value } = schema.validate({});

      // Assert
      expect(error).toBeUndefined();
      expect(value.OSM_TILES_URL).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    });

    it('should reject invalid NOMINATIM_URL format', () => {
      // Arrange
      const schema = validationSchema;

      // Act
      const { error } = schema.validate({
        NOMINATIM_URL: 'not-a-valid-uri',
      });

      // Assert
      expect(error).toBeDefined();
      expect(error?.details[0].path).toContain('NOMINATIM_URL');
    });

    it('should accept valid OpenStreetMap Nominatim URL', () => {
      // Arrange
      const schema = validationSchema;

      // Act
      const { error, value } = schema.validate({
        NOMINATIM_URL: 'https://nominatim.openstreetmap.org',
      });

      // Assert
      expect(error).toBeUndefined();
      expect(value.NOMINATIM_URL).toBe('https://nominatim.openstreetmap.org');
    });
  });

  describe('OpenStreetMap URL Verification', () => {
    it('should use official OpenStreetMap Nominatim domain', () => {
      // Arrange
      const config = configuration();

      // Assert
      expect(config.osm.nominatimUrl).toMatch(/nominatim\.openstreetmap\.org$/);
      expect(config.osm.nominatimUrl).not.toContain('google');
      expect(config.osm.nominatimUrl).not.toContain('mapbox');
    });

    it('should use official OpenStreetMap tiles domain', () => {
      // Arrange
      const config = configuration();

      // Assert
      expect(config.osm.tilesUrl).toContain('tile.openstreetmap.org');
      expect(config.osm.tilesUrl).not.toContain('google');
      expect(config.osm.tilesUrl).not.toContain('mapbox');
    });

    it('should use HTTPS for all OpenStreetMap URLs', () => {
      // Arrange
      const config = configuration();

      // Assert
      expect(config.osm.nominatimUrl).toMatch(/^https:\/\//);
      expect(config.osm.tilesUrl).toMatch(/^https:\/\//);
    });
  });
});

