/**
 * @fileoverview Data feed from a Tempest weather station to Redis
 * @author Joey Whelan
 */

'use strict'; 
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { TimeSeriesClient } from './timeSeries.js';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const redis = require('config').get('Redis');
const tempest = require('config').get('Tempest');

const MS_TO_MPH = 2.236936;

 /**
 * Class encapsulating websocket to Tempest station and redis client
 * @class
 */
export class TempestClient {
    constructor() {
        this.wsRequest = {
            'type': 'listen_rapid_start',
            'device_id': tempest.deviceId,
            'id': uuidv4()
        };
    };

    async start() {
        if (!this.ts && !this.ws) {
            this.ts = new TimeSeriesClient(redis.user, redis.password, redis.url);
            await this.ts.connect();
            this.ws = new WebSocket(`${tempest.url}?token=${tempest.password}`);

            this.ws.on('open', () => {
                console.log('Websocket opened');
                this.ws.send(JSON.stringify(this.wsRequest));
            });
        
            this.ws.on('message', async (data) => {
                const obj = JSON.parse(data);
                if ("ob" in obj) {
                    const time = Date.now()
                    const speed = Number(obj.ob[1] * MS_TO_MPH).toFixed(1);
                    const direction = obj.ob[2];
                    console.log(`time: ${time} speed: ${speed} direction: ${direction}`);
                    await this.ts.update(tempest.deviceId, time, speed, direction);                
                }
             });

            this.ws.on('close', async () => {
                console.log('Websocket closed')
                await this.ts.quit();
                this.ts = null;
                this.ws = null;
            });

            this.ws.on('error', async (err) => {
                await this.ts.quit();
                this.ws.close();
                this.ts = null;
                this.ws = null;
                console.error('ws err: ' + err);
            });
        }
    }

    async stop() {
        this.ws.close();
    }
} 