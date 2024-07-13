const express = require('express');
const router = express.Router();

const { twt } = require('../../configs/mysql');

// === add purchase ===

router.post('/addPurchase', async (req, res) => {
    try {
        const data = req.body;
        const query = `INSERT INTO purchases SET ?`
        twt.query(query, data, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            res.json('Successfully added data into purchases!');
        })
    } catch (error) {
        console.error(error);
    }
});
// ====================

// === get purchase infor for ta by sample number ===

router.get('/get_Purchase_Info_For_Ta_By_Sample_Number', async (req, res) => {
    try {
        const sample_number = req.query.sample_number;
        const query = `SELECT reg.company_name, reg.mass, res.twt_ta2o5, c.tunnels FROM registrations reg JOIN results res ON reg.sample_number=res.sample_number JOIN companies c ON reg.company_name=c.company_name WHERE reg.sample_number=?;`
        twt.query(query, [sample_number], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            res.json({purchases: result})
        })
    } catch (error) {
        console.error(error);
    }
});

// === get purchase infor for sn by sample number ===

router.get('/get_Purchase_Info_For_Sn_By_Sample_Number', async (req, res) => {
    try {
        const sample_number = req.query.sample_number;
        const query = `SELECT reg.company_name, reg.mass, res.twt_sn, c.tunnels FROM registrations reg JOIN results res ON reg.sample_number=res.sample_number JOIN companies c ON reg.company_name=c.company_name WHERE reg.sample_number=?;`
        twt.query(query, [sample_number], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            res.json({purchases: result})
        })
    } catch (error) {
        console.error(error);
    }
});

// === get purchase infor for Wo3 by sample number ===

router.get('/get_Purchase_Info_For_Wo3_By_Sample_Number', async (req, res) => {
    try {
        const sample_number = req.query.sample_number;
        const query = `SELECT reg.company_name, reg.mass, res.twt_wo3, c.tunnels FROM registrations reg JOIN results res ON reg.sample_number=res.sample_number JOIN companies c ON reg.company_name=c.company_name WHERE reg.sample_number=?;`
        twt.query(query, [sample_number], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            res.json({purchases: result})
        })
    } catch (error) {
        console.error(error);
    }
});

// === get purchases by date ===

router.get('/getPurchasesByDate', async (req, res) => {
    try {
        const date = req.query.date;
        const query = `select * from purchases where purchase_date=?;`
        twt.query(query, [date], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            res.json({purchases: result})
        })
    } catch (error) {
        console.error(error);
    }
});

// === Update purchases ===

router.put('/updatePurchases', async (req, res) => {
    try {
        const data = req.body;

        const query = `UPDATE purchases SET ? WHERE purchase_id=?`;

        twt.query(query, [data, data.purchase_id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({"error": "Internal Server Error"});
            }

            res.json('Purchase was successfully updated!');
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({"error": "Internal Server Error"});
    }
});
module.exports = router;