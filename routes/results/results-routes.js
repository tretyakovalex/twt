const express = require('express');
const router = express.Router();

const { twt } = require('../../configs/mysql');

router.get('/getResultsBySampleNumber', async (req, res) => {
    const offer_number = req.query.offer_number;
    try {
        twt.query('SELECT * FROM registrations WHERE offer_number = ?', offer_number, (err, result) => {
            res.json({registration: result})
        })
    } catch (error) {
        console.error(error);
    }
})

module.exports = router;
