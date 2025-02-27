const express = require('express');
const router = express.Router();

const { twt } = require('../../configs/mysql');

const moment = require('moment');

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

// === get registration offer numbers ===
router.get('/getRegistrationsOfferNumbers', async (req, res) => {
    try {
        twt.query('SELECT offer_number FROM registrations ORDER BY offer_number DESC', (err, result) => {
            res.json({offer_numbers: result})
        })
    } catch (error) {
        console.error(error);
    }
})

// =======================================

// === get registration sample numbers ===
router.get('/getRegistrationsSampleNumbers', async (req, res) => {
    try {
        twt.query('SELECT sample_number FROM registrations ORDER BY offer_number DESC', (err, result) => {
            res.json({sample_numbers: result})
        })
    } catch (error) {
        console.error(error);
    }
})
// =======================================

// === get last sample number from registration  ===
router.get('/getLastSampleNumberFromRegistration', async (req, res) => {
    const date = req.query.date;
    console.log(date);
    try {
        let query = `SELECT DISTINCT reg.sample_number, reg.registration_id FROM registrations reg ORDER BY reg.registration_id DESC LIMIT 1`;
        twt.query(query, [date], (err, registration) => {
            res.json({lastSampleNumber: registration[0].sample_number})
        })
    } catch (error) {
        console.error(error);
    }
})
// =======================================


// === get registration sample numbers ===
router.get('/getSampleNumbersByDate', async (req, res) => {
    const date = req.query.date;
    console.log(date);
    try {
        // let query = `SELECT DISTINCT sample_number FROM registrations WHERE date=?`;
        let query = `SELECT DISTINCT reg.sample_number FROM registrations reg WHERE reg.date = ? AND reg.sample_number NOT IN (SELECT res.sample_number FROM results res)`;
        twt.query(query, [date], (err, result) => {
            res.json({sampleNumbers: result})
        })
    } catch (error) {
        console.error(error);
    }
})
// =======================================

// === get Registrations By Date Url ===
router.get('/getRegistrationsByDateUrl', async (req, res) => {
    const date = req.query.date;
    console.log(date);
    try {
        let query = `SELECT * FROM registrations reg WHERE reg.date = ? AND reg.sample_number NOT IN (SELECT res.sample_number FROM results res)`;
        twt.query(query, [date], (err, registrations) => {

            let results = [];
            registrations.forEach(item => {
                const material = item.material.toLowerCase(); // Normalize for case-insensitive comparison

                let material_ta = material.includes("ta");
                let material_sn = material.includes("sn");
                let material_w = material.includes("w");
                let material_be = material.includes("be");
                let material_li = material.includes("li");

                results.push({
                    date: moment(item.date).format('YYYY-MM-DD'),
                    sample_number: item.sample_number,
                    offer_number: item.offer_number,
                    material: item.material,
                    mass: item.mass,
                    company_name: item.company_name,
                    remarks: '', 
                    twt_ta2o5: '',
                    twt_nb2o5: '',
                    twt_sn: '',
                    twt_wo3: '',
                    twt_be: '',
                    twt_li: '',
                    twt_bq_per_gram: '',
                    gsaContractNumber: '',
                    gsa_ta2o5: '',
                    gsa_nb2o5: '',
                    gsa_sn: '',
                    gsa_wo3: '',
                    gsa_be: '',
                    gsa_li: '',
                    gsa_bq_per_gram: '',
                    gsa_moisture: '',
                    asi_ta2o5: '',
                    asi_nb2o5: '',
                    asi_sn: '',
                    asi_wo3: '',
                    asi_be: '',
                    asi_li: '',
                    asi_bq_per_gram: '',
                    registration_id: item.registration_id,
                    material_ta,
                    material_sn,
                    material_w,
                    material_be,
                    material_li
                });
            });
            res.json({ results });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// === get last registration from table ===

router.get('/getLastRegistration', async (req, res) => {
    try {
        twt.query('SELECT * FROM registrations ORDER BY registration_id DESC LIMIT 1', (err, result) => {
            res.json({lastRegistration: result})
        })
    } catch (error) {
        console.error(error);
    }
});

// ========================================

// === get last offer number from registration ===

router.get('/getLastOfferNumber', async (req, res) => {
    try {
        twt.query('SELECT offer_number FROM registrations ORDER BY offer_number DESC LIMIT 1', (err, result) => {
            res.json({lastOfferNumber: result})
        })
    } catch (error) {
        console.error(error);
    }
});

// ================================================

// === get registration by offer number ===

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

// === get registration by sample number ===

router.get('/getRegistrationBySampleNumber', async (req, res) => {
const sample_number = req.query.sample_number;
    try {
        twt.query('SELECT date, sample_number, material, company_name, mass, registration_id FROM registrations WHERE sample_number = ?', sample_number, (err, registrations) => {
            let results = [];
            registrations.forEach(item => {
                const material = item.material.toLowerCase(); // Normalize for case-insensitive comparison

                let material_ta = material.includes("ta");
                let material_sn = material.includes("sn");
                let material_w = material.includes("w");
                let material_be = material.includes("be");
                let material_li = material.includes("li");

                results.push({
                    date: moment(item.date).format('YYYY-MM-DD'),
                    sample_number: item.sample_number,
                    material: item.material,
                    company_name: item.company_name,
                    mass: item.mass,
                    remarks: '', 
                    twt_ta2o5: '',
                    twt_nb2o5: '',
                    twt_sn: '',
                    twt_wo3: '',
                    twt_be: '',
                    twt_li: '',
                    twt_bq_per_gram: '',
                    gsaContractNumber: '',
                    gsa_ta2o5: '',
                    gsa_nb2o5: '',
                    gsa_sn: '',
                    gsa_wo3: '',
                    gsa_be: '',
                    gsa_li: '',
                    gsa_bq_per_gram: '',
                    gsa_moisture: '',
                    asi_ta2o5: '',
                    asi_nb2o5: '',
                    asi_sn: '',
                    asi_wo3: '',
                    asi_be: '',
                    asi_li: '',
                    asi_bq_per_gram: '',
                    registration_id: item.registration_id,
                    material_ta,
                    material_sn,
                    material_w,
                    material_be,
                    material_li
                });
            });
            res.json({ results });
        })
    } catch (error) {
        console.error(error);
    }
})

// =========================================

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

        const query = `UPDATE registrations SET offer_number=?, sample_number=?, company_name=?, itsci_number=?, number_of_bags=?, material=?, mass=?, date=? WHERE registration_id=?`;

        twt.query(query, [data.offer_number, data.sample_number, data.company_name, data.itsci_number, data.number_of_bags, data.material, data.mass, data.date, data.registration_id], (err, result) => {
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


// === Delete Registration ===
// Testing out with purchasing_settings
router.delete('/deleteSelectedRegistration', async (req, res) => {
    try {
        const registration_id = req.query.registration_id;
        console.log("registration_id: ", registration_id );

        const query = `DELETE from registrations WHERE registration_id=?`;

        twt.query(query, registration_id, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({"error": "Internal Server Error"});
            }

            res.status(201).json({"message": "Registration was successfully removed!"});

            // twt.query('SELECT MAX(registration_id) AS max_id FROM registrations;', (err, lastId) => {
            //     if(err){
            //         console.error(err);
            //         return res.status(500).json({"error": "Internal Server Error"});    
            //     }

            //     console.log('Printing last registration_id: ', lastId[0]);
            //     console.log('Printing last registration_id: ', lastId[0].max_id);

            //     twt.query(`ALTER TABLE registrations AUTO_INCREMENT = ${lastId[0].max_id + 1};`, (err, response) =>{
            //         if(err){
            //             console.error(err);
            //             return res.status(500).json({"error": "Internal Server Error"});    
            //         }
            //     })
            // })
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({"error": "Internal Server Error"});
    }
});
// ===========================

module.exports = router;

