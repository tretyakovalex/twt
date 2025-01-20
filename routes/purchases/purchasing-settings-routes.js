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
        console.log(data);

        const query = `
            INSERT INTO purchasing_settings (
            date,
            ta_coefficient,
            exchange_rate_frw_to_usd,
            ta_rma_fees_frw_per_kg,
            w_mtu,
            w_rma_fees_frw_per_kg,
            lme,
            tc,
            sn_rma_fees_frw_per_kg,
            be_mtu,
            be_rma_fees_frw_per_kg,
            li_mtu,
            li_rma_fees_frw_per_kg
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                ta_coefficient = VALUES(ta_coefficient),
                exchange_rate_frw_to_usd = VALUES(exchange_rate_frw_to_usd),
                ta_rma_fees_frw_per_kg = VALUES(ta_rma_fees_frw_per_kg),
                w_mtu = VALUES(w_mtu), 
                w_rma_fees_frw_per_kg = VALUES(w_rma_fees_frw_per_kg),
                lme = VALUES(lme),
                tc = VALUES(tc),
                sn_rma_fees_frw_per_kg = VALUES(sn_rma_fees_frw_per_kg),
                be_mtu = VALUES(be_mtu),
                be_rma_fees_frw_per_kg = VALUES(be_rma_fees_frw_per_kg),
                li_mtu = VALUES(li_mtu),
                li_rma_fees_frw_per_kg = VALUES(li_rma_fees_frw_per_kg)
                `;

        twt.query(query, [data.date, data.ta_coefficient, data.exchange_rate_frw_to_usd, data.ta_rma_fees_frw_per_kg, data.w_mtu, data.w_rma_fees_frw_per_kg, data.lme, data.tc, data.sn_rma_fees_frw_per_kg, data.be_mtu, data.be_rma_fees_frw_per_kg, data.li_mtu, data.li_rma_fees_frw_per_kg], (err, result) => {
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