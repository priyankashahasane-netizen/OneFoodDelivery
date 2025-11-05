var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TrackingController_1;
import { BadRequestException, Body, Controller, Get, Headers, Logger, Param, Post, Res } from '@nestjs/common';
import { TrackingService } from './tracking.service.js';
import { TrackPointDto } from './dto/track-point.dto.js';
import { InjectRedisSub } from '../../common/redis/redis.provider.js';
import { Public } from '../auth/public.decorator.js';
let TrackingController = TrackingController_1 = class TrackingController {
    trackingService;
    redisSub;
    logger = new Logger(TrackingController_1.name);
    constructor(trackingService, redisSub) {
        this.trackingService = trackingService;
        this.redisSub = redisSub;
    }
    async trackWithoutOrderId() {
        throw new BadRequestException({
            error: 'Missing orderId',
            message: 'The tracking endpoint requires an orderId. Use POST /api/track/:orderId instead.',
            example: 'POST /api/track/12345'
        });
    }
    async sse(orderId, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();
        const send = (event, data) => {
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };
        const recent = await this.trackingService.listRecent(orderId, 1);
        if (recent[0]) {
            send('position', recent[0]);
        }
        const channel = `track:${orderId}`;
        let isSubscribed = false;
        const onMessage = (_channel, message) => {
            try {
                const parsed = JSON.parse(message);
                if (parsed?.type === 'position') {
                    send('position', parsed.data);
                }
            }
            catch { }
        };
        if (this.isRedisSubAvailable()) {
            try {
                this.redisSub.subscribe(channel);
                this.redisSub.on('message', onMessage);
                isSubscribed = true;
            }
            catch (error) {
            }
        }
        const heartbeat = setInterval(() => send('heartbeat', { ts: Date.now() }), 15000);
        reqOnClose(res, () => {
            clearInterval(heartbeat);
            if (isSubscribed) {
                try {
                    this.redisSub.off('message', onMessage);
                    this.redisSub.unsubscribe(channel);
                }
                catch (error) {
                }
            }
        });
    }
    isRedisSubAvailable() {
        return this.redisSub && (this.redisSub.status === 'ready' || this.redisSub.status === 'connecting');
    }
    async ingest(orderId, payload, idempotencyKey) {
        try {
            const rec = await this.trackingService.record(orderId, payload, idempotencyKey);
            return { ok: true, id: rec.id };
        }
        catch (error) {
            this.logger.warn(`Tracking endpoint error for order ${orderId}:`, error?.message || error?.code || String(error));
            const mockId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            return {
                ok: true,
                id: mockId,
                orderId,
                driverId: payload.driverId,
                message: 'Tracking point recorded (may not be persisted due to invalid IDs or database constraints)',
                persisted: false
            };
        }
    }
};
__decorate([
    Public(),
    Post(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "trackWithoutOrderId", null);
__decorate([
    Public(),
    Get(':orderId/sse'),
    __param(0, Param('orderId')),
    __param(1, Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "sse", null);
__decorate([
    Public(),
    Post(':orderId'),
    __param(0, Param('orderId')),
    __param(1, Body()),
    __param(2, Headers('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TrackPointDto, String]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "ingest", null);
TrackingController = TrackingController_1 = __decorate([
    Controller('track'),
    __param(1, InjectRedisSub()),
    __metadata("design:paramtypes", [TrackingService, Object])
], TrackingController);
export { TrackingController };
function reqOnClose(res, cb) {
    res.req.on('close', cb);
}
