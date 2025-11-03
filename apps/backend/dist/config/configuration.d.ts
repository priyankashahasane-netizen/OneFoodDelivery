declare const _default: () => {
    http: {
        port: number;
    };
    database: {
        url: string;
        schema: string;
    };
    redis: {
        url: string;
    };
    optimoRoute: {
        baseUrl: string;
        apiKey: string;
    };
    ipstack: {
        baseUrl: string;
        apiKey: string;
    };
    osm: {
        nominatimUrl: string;
        tilesUrl: string;
    };
    tracking: {
        baseUrl: string;
    };
};
export default _default;
