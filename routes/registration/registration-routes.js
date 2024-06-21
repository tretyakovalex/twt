const express = require('express');
const router = express.Router();

const { twt } = require('../../configs/mysql');

// === Add to registrations table ===

router.post('/addRegistration', async (req, res) => {
    const data = req.body;
    console.log(data);

    try {
        twt.query('INSERT INTO registrations SET ?', data, async (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            res.json('Successfully added data into registrations!');
        });
    } catch (error) {
        console.error(error);
    }
});

// ==================================


router.get('/getRegistrationsOfferNumbers', async (req, res) => {
    try {
        twt.query('SELECT offer_number FROM registrations', (err, result) => {
            res.json({offer_numbers: result})
        })
    } catch (error) {
        console.error(error);
    }
})


// === get last registration from table ===

router.get('/getLastRegistration', async (req, res) => {
    try {
        twt.query('SELECT * FROM registrations ORDER BY registration_id DESC LIMIT 1', (err, result) => {
            res.json({lastRegistration: result})
        })
    } catch (error) {
        console.error(error);
    }
})

// ========================================

// === get last registration from table ===

router.get('/getRegistrationByOfferNumber', async (req, res) => {
    const offer_number = req.query.offer_number;
    try {
        twt.query('SELECT * FROM registrations WHERE offer_number = ?', offer_number, (err, result) => {
            res.json({registration: result})
        })
    } catch (error) {
        console.error(error);
    }
})

// ========================================

// === get registration by date from table ===

router.get('/getRegistrationByDate', async (req, res) => {
    const date = req.query.date;
    try {
        twt.query('SELECT * FROM registrations WHERE date = ?', date, (err, result) => {
            res.json({registration: result})
        })
    } catch (error) {
        console.error(error);
    }
})

// ===========================================

// === Update Registration ===

router.put('/updateRegistrations', async (req, res) => {
    try {
        const data = req.body;

        const query = `UPDATE registrations SET offer_number=?, analysis_number=?, company_name=?, itsci_number=?, number_of_bags=?, material=?, mass=?, date=? WHERE registration_id=?`;

        twt.query(query, [data.offer_number, data.analysis_number, data.company_name, data.itsci_number, data.number_of_bags, data.material, data.mass, data.date, data.registration_id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({"error": "Internal Server Error"});
            }

            res.status(201).json({"message": "Registration was successfully updated!"});
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({"error": "Internal Server Error"});
    }
});

// ===========================



module.exports = router;

