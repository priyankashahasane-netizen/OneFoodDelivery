import { Body, Controller, Get, Headers, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';

import { TrackingService } from './tracking.service.js';
import { TrackPointDto } from './dto/track-point.dto.js';
import { InjectRedisSub, REDIS_SUB_CLIENT } from '../../common/redis/redis.provider.js';
import { Public } from '../auth/public.decorator.js';

@Controller('track')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService, @InjectRedisSub() private readonly redisSub) {}

  // PRD: GET /api/track/:orderId/sse
  @Public()
  @Get(':orderId/sse')
  async sse(@Param('orderId') orderId: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Initial snapshot
    const recent = await this.trackingService.listRecent(orderId, 1);
    if (recent[0]) {
      send('position', recent[0]);
    }

    // Subscribe to Redis channel for live updates (optional - if Redis is unavailable, just send heartbeat)
    const channel = `track:${orderId}`;
    let isSubscribed = false;
    
    const onMessage = (_channel: string, message: string) => {
      try {
        const parsed = JSON.parse(message);
        if (parsed?.type === 'position') {
          send('position', parsed.data);
        }
      } catch {}
    };

    // Try to subscribe to Redis for real-time updates
    if (this.isRedisSubAvailable()) {
      try {
        this.redisSub.subscribe(channel);
        this.redisSub.on('message', onMessage);
        isSubscribed = true;
      } catch (error) {
        // Redis subscription failed, but we'll continue with heartbeat only
        // This allows the SSE endpoint to work even without Redis
      }
    }

    // Send heartbeat periodically (works even without Redis)
    const heartbeat = setInterval(() => send('heartbeat', { ts: Date.now() }), 15000);

    reqOnClose(res, () => {
      clearInterval(heartbeat);
      if (isSubscribed) {
        try {
          this.redisSub.off('message', onMessage);
          this.redisSub.unsubscribe(channel);
        } catch (error) {
          // Ignore unsubscribe errors
        }
      }
    });
  }

  private isRedisSubAvailable(): boolean {
    return this.redisSub && (this.redisSub.status === 'ready' || this.redisSub.status === 'connecting');
  }

  // PRD: POST /api/track/:orderId
  @Post(':orderId')
  async ingest(
    @Param('orderId') orderId: string,
    @Body() payload: TrackPointDto,
    @Headers('idempotency-key') idempotencyKey?: string
  ) {
    const rec = await this.trackingService.record(orderId, payload, idempotencyKey);
    return { ok: true, id: rec.id };
  }
}

function reqOnClose(res: Response, cb: () => void) {
  res.req.on('close', cb);
}

