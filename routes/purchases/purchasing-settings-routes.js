const express = require('express');
const router = express.Router();

const { twt } = require('../../configs/mysql');

// === get last purchasing settings ===

router.get('/getLastPurchasingSettings', async (req, res) => {
    try {
        const query = `SELECT * FROM purchasing_settings ORDER BY date DESC LIMIT 1;`
        twt.query(query, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            
            res.json({settings: result})
        })
    } catch (error) {
        console.error(error);
    }
});

// === get last purchasing settings ===

router.post('/addPurchasingSettings', async (req, res) => {
    try {
        const data = req.body;
        // const query = `INSERT INTO purchasing_settings SET ?`
        const query = `
            INSERT INTO purchasing_settings (date, coefficient, exchange_rate_frw_to_usd, rma_fees_frw_per_kg)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                coefficient = VALUES(coefficient),
                exchange_rate_frw_to_usd = VALUES(exchange_rate_frw_to_usd),
                rma_fees_frw_per_kg = VALUES(rma_fees_frw_per_kg)`;

        twt.query(query, [data.date, data.coefficient, data.exchange_rate_frw_to_usd, data.rma_fees_frw_per_kg], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            
            res.json("Successfully saved settings");
        })
    } catch (error) {
        console.error(error);
    }
});

module.exports = router;