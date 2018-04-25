const express = require('express');
const router = express.Router();
const amqp = require('amqplib/callback_api');
const config = require("../config");

const BASE_URL = 'api';
const queueName = 'message';

let channel = undefined;

amqp.connect(config.server_url, function (err, conn) {
    if (err)
        return;

    conn.createChannel(function (err, ch) {
        ch.assertQueue(queueName, {
            durable: true,
            messageTtl: 1000,
            maxLength: config.server_rate
        });

        channel = ch;
    });
});

router.post(`/${BASE_URL}/message`, function (req, res) {
    try {
        if (channel) {
            channel.sendToQueue(queueName, new Buffer(JSON.stringify(req.body)), {persistent: true});
        } else {
            return res.json({
                error: true,
                errorMessage: 'Channel is undefined.'
            });
        }

        res.json({
            error: false
        });
    } catch (e) {
        res.json({
            error: true,
            errorMessage: e.toString()
        });
    }
});

module.exports = router;
