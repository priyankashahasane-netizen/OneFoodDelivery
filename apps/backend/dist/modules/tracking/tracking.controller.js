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
import { Body, Controller, Get, Headers, Param, Post, Res } from '@nestjs/common';
import { TrackingService } from './tracking.service.js';
import { TrackPointDto } from './dto/track-point.dto.js';
import { InjectRedisSub } from '../../common/redis/redis.provider.js';
import { Public } from '../auth/public.decorator.js';
let TrackingController = class TrackingController {
    trackingService;
    redisSub;
    constructor(trackingService, redisSub) {
        this.trackingService = trackingService;
        this.redisSub = redisSub;
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
        const rec = await this.trackingService.record(orderId, payload, idempotencyKey);
        return { ok: true, id: rec.id };
    }
};
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
    Post(':orderId'),
    __param(0, Param('orderId')),
    __param(1, Body()),
    __param(2, Headers('idempotency-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TrackPointDto, String]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "ingest", null);
TrackingController = __decorate([
    Controller('track'),
    __param(1, InjectRedisSub()),
    __metadata("design:paramtypes", [TrackingService, Object])
], TrackingController);
export { TrackingController };
function reqOnClose(res, cb) {
    res.req.on('close', cb);
}
