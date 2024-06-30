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

// === get all companies ===

router.get('/getAllCompanies', async (req, res) => {
    try {
        twt.query('SELECT * FROM companies', (err, result) => {
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

// === Add Company ===

router.post('/addCompany', async (req, res) => {
    const data = req.body;
    console.log(data);

    try {
        twt.query('INSERT INTO companies SET ?', data ,(err, result) => {
            res.json("Company added successfully!");
        });
    } catch (error) {
        console.error(error);
    }
});


// === Update Company ===

router.put('/updateCompany', async (req, res) => {
    try {
        const data = req.body;
        console.log(data);

        const query = `UPDATE companies SET company_name=?, tin=?, blacklisted=? WHERE company_id=?`;

        twt.query(query, [data.company_name, data.tin, data.blacklisted, data.company_id] ,(err, result) => {
            res.json("Company updated successfully!");
        });
    } catch (error) {
        console.error(error);
    }
});

// ===========================


// === Delete Company ===

router.put('/deleteCompany', async (req, res) => {
    try {
        const data = req.body;
        console.log(data);

        const query = `DELETE FROM companies WHERE company_id=?`;

        twt.query(query, [data.company_id] ,(err, result) => {
            res.json("Company was successfully deleted!");
        });
    } catch (error) {
        console.error(error);
    }
});

// ===========================
module.exports = router;

