const express = require('express');
const router = express.Router();

const { snPool } = require('../configs/mysql');

// === purchase_contract_client_address ===
router.get('/getClientAddress', async (req, res) => {
    try {
        snPool.query('SELECT * FROM `purchase_contract_client_address`', (err, result) => {
            res.json({clientAddress: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.put('/updateClientAddress', async (req, res) => {
    try {
        const data = req.body;

        const tablename = 'purchase_contract_client_address';
        const query = `UPDATE ${tablename} SET name=?, street1=?, street2=?, city=?, country=?`;

        snPool.query(query, [data.name, data.street1, data.street2, data.city, data.country], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({"error": "Internal Server Error"});
            }

            res.status(201).json({"message": "client's address updated successfully!"});
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({"error": "Internal Server Error"});
    }
});
// ========================================

// === purchase_contract_seller_address ===
router.get('/getSellerAddress', async (req, res) => {
    try {
        snPool.query('SELECT * FROM `purchase_contract_seller_address`', (err, result) => {
            res.json({sellerAddress: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.put('/updateSellerAddress', async (req, res) => {
    try {
        const data = req.body;

        const tablename = 'purchase_contract_seller_address';
        const query = `UPDATE ${tablename} SET name=?, street1=?, street2=?, city=?, country=?`;

        snPool.query(query, [data.name, data.street1, data.street2, data.city, data.country], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({"error": "Internal Server Error"});
            }

            res.status(201).json({"message": "seller's address updated successfully!"});
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({"error": "Internal Server Error"});
    }
});

// ========================================

// === purchase_contract_seller_bank_details ===
router.get('/getSellerBankDetails', async (req, res) => {
    try {
        snPool.query('SELECT * FROM `purchase_contract_seller_bank_details`', (err, result) => {
            res.json({SellerBankDetails: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.put('/updateSellerBankDetails', async (req, res) => {
    try {
        const data = req.body;

        const tablename = 'purchase_contract_seller_bank_details';
        const query = `UPDATE ${tablename} SET bank=?, swiftCodeOrBIC=?, correspondentBank=?, accountNo=?`;

        snPool.query(query, [data.bank, data.swiftCodeOrBIC, data.correspondentBank, data.accountNo], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({"error": "Internal Server Error"});
            }

            res.status(201).json({"message": "seller bank details updated successfully!"});
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({"error": "Internal Server Error"});
    }
});

// =============================================

module.exports = router;

