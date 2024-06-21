const express = require('express');
const router = express.Router();

const { twt } = require('../../configs/mysql');

// === get all company names ===

router.get('/getAllCompanyName', async (req, res) => {
    try {
        twt.query('SELECT company_id, company_name FROM `companies` WHERE blacklisted = 0', (err, result) => {
            res.json({companies: result})
        })
    } catch (error) {
        console.error(error);
    }
});

// =============================

// === get company by name ===

router.get('/getCompanyByName', async (req, res) => {
    const company_name = req.query.company_name;
    console.log(company_name);
    try {
        twt.query('SELECT company_id, company_name, tin FROM `companies` WHERE company_name = ?', company_name,(err, result) => {
            res.json({company: result})
        })
    } catch (error) {
        console.error(error);
    }
});

// ===========================
module.exports = router;

