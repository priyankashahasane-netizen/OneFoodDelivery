export default () => ({
  http: {
    port: parseInt(process.env.PORT ?? '3000', 10)
  },
  database: {
    url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/stack_delivery',
    schema: process.env.DATABASE_SCHEMA ?? 'public'
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379'
  },
  optimoRoute: {
    baseUrl: process.env.OPTIMOROUTE_BASE_URL ?? 'https://api.optimoroute.com/v1',
    apiKey: process.env.OPTIMOROUTE_API_KEY ?? ''
  },
  ipstack: {
    baseUrl: process.env.IPSTACK_BASE_URL ?? 'http://api.ipstack.com',
    apiKey: process.env.IPSTACK_API_KEY ?? ''
  },
  osm: {
    nominatimUrl: process.env.NOMINATIM_URL ?? 'https://nominatim.openstreetmap.org',
    tilesUrl: process.env.OSM_TILES_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  tracking: {
    baseUrl: process.env.TRACKING_BASE_URL ?? 'http://localhost:3001/track'
  }
});

