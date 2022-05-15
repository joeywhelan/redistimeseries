/**
 * @fileoverview Data feed from a Tempest weather station to Redis
 * @author Joey Whelan
 */

'use strict'; 
import { TempestClient } from './tempest.js';
import express from 'express';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const basicAuth = require('express-basic-auth');
const server = require('config').get('Server');

let tc;
const app = express();
app.use(basicAuth({
    users: { [server.user] : server.password }
}));

app.post('/start', async (req, res) => {
    try {
        if (!tc) {
            tc = new TempestClient();
            await tc.start();
            res.status(201).json({'message': 'success'});
        }
        else {
            throw new Error('tempest client already instantiated');
        }
    }
    catch (err) {
        res.status(400).json({error: err.message})
    };
});

app.post('/stop', async (req, res) => {
    try {
        if (tc) {
            await tc.stop();
            tc = null;
            res.status(201).json({'message': 'success'});
        }
        else {
            throw new Error('tempest client does not exist');    
        }
    }
    catch (err) {
        res.status(400).json({error: err.message})
    };
});

app.listen(server.port, () => {
    console.log(`Server listening on port ${server.port}`);
});