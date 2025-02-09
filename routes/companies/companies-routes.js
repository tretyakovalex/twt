const express = require('express');
const router = express.Router();

const { twt } = require('../../configs/mysql');

// === get all company names ===

router.get('/getAllCompanyName', async (req, res) => {
    try {
        // twt.query('SELECT DISTINCT company_name FROM `companies` WHERE blacklisted = 0', (err, result) => {
        twt.query('SELECT DISTINCT company_name FROM `companies` WHERE blacklisted = 0', (err, result) => {
            res.json({companies: result})
        })
    } catch (error) {
        console.error(error);
    }
});

// =============================
// === get all non blacklisted companies ===

router.get('/get_all_non_blacklisted_companies', async (req, res) => {
    try {
        twt.query('SELECT * FROM companies WHERE blacklisted = 0', (err, result) => {
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
        // twt.query('INSERT INTO companies SET ?', data ,(err, result) => {
        twt.query('INSERT INTO companies SET ?', data ,(err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
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

        // const query = `UPDATE companies SET company_name=?, mine=?, district=?, tunnels=?, tin=?, blacklisted=?, last_blacklisted=?, last_blacklisted_reason=?, exit_last_blacklisted=?, exit_last_blacklisted_reason=? WHERE id=?`;
        const query = `UPDATE companies SET ? WHERE id=${data.id}`;

        // twt.query(query, [data.company_name, data.mine, data.district, data.tunnels, data.tin, data.blacklisted, data.last_blacklisted, data.last_blacklisted_reason, data.exit_last_blacklisted, data.exit_last_blacklisted_reason, data.id] ,(err, result) => {
        twt.query(query, data, (err, result) => {
            if(err){
                console.error(err);
                res.status(500).json("Internal Server Error");
            }
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

        const query = `DELETE FROM companies WHERE id=?`;

        twt.query(query, [data.id] ,(err, result) => {
            res.json("Company was successfully deleted!");
        });
    } catch (error) {
        console.error(error);
    }
});

// ===========================
module.exports = router;

