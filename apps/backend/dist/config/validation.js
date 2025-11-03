import Joi from 'joi';
export const validationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().uri().required(),
    DATABASE_SCHEMA: Joi.string().default('public'),
    REDIS_URL: Joi.string().uri().required(),
    OPTIMOROUTE_BASE_URL: Joi.string().uri().default('https://api.optimoroute.com/v1'),
    OPTIMOROUTE_API_KEY: Joi.string().required(),
    IPSTACK_BASE_URL: Joi.string().uri().default('http://api.ipstack.com'),
    IPSTACK_API_KEY: Joi.string().required(),
    NOMINATIM_URL: Joi.string().uri().default('https://nominatim.openstreetmap.org'),
    OSM_TILES_URL: Joi.string().default('https://tile.openstreetmap.org/{z}/{x}/{y}.png')
});
