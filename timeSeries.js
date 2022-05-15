/**
 * @fileoverview Redis time series client.
 * @author Joey Whelan
 */
'use strict'; 
import { createClient } from 'redis';


/**
 * Class encapsulating Redis functions for adding to a time series
 * @class
 */
export class TimeSeriesClient {
    
    /**
    * Class constructor
    * @param {string} username - Redis username.
    * @param {string} password - Redis password.
    * @param {string} url -  Redis
    * @throws {Error} propagates exceptions
    */
    constructor(username, password, url) {
        this.client = createClient({ 
            'url': `redis://${username}:${password}@${url}`
        });
        this.client.on('error', (err) => console.error('Redis error ' + err));
        this.client.on('ready', () => console.log('Redis connected'));
        this.client.on('end', () => console.log('Redis disconnected'));
    };

    async connect() {
        await this.client.connect();
    }

    /**
    * Function for adding a wind speed/direction reading to a Redis time series
    * @param {string} deviceId -  Tempest device ID
    * @param {string} time - timestamp (ms)
    * @param {string} speed - wind speed (mph)
    * @param {string} direction -  wind direction (degrees)
    * @throws {Error} propagates exceptions
    */
    async update(deviceId, time, speed, direction) {
        await this.client.ts.add(`wind_direction:${deviceId}`, time, direction);
        await this.client.ts.add(`wind_speed:${deviceId}`, time, speed);
    }

    async quit() {
        await this.client.quit();
    }
};