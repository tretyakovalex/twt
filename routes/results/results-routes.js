const express = require('express');
const router = express.Router();
const moment = require('moment');

const { twt } = require('../../configs/mysql');

router.get('/getResultsBySampleNumber', async (req, res) => {
    const sample_number = req.query.sample_number;
    try {
        twt.query('SELECT * FROM results WHERE sample_number = ?', sample_number, (err, result) => {
            if(err){
                console.error(err);
                res.status(500).json("Internal Server Error");
            }
            res.json({result: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.post('/addResults', async (req, res) => {
    // const data = req.body;
    try {
        const rows = req.body;
        // const columns = Object.keys(data);
        // const values = Object.values(data);

        // console.log("Printing columns: ");
        // console.log(columns);

        // console.log("Printing values: ");
        // console.log(values);

        // const query = `
        //     INSERT INTO results
        //     (${columns.join(', ')})
        //     VALUES
        //     (${Array(columns.length).fill('?').join(', ')})
        //     `;

        let insertQuery = ``;

        rows.forEach((row) => {
            const columns = Object.keys(row);
            // const values = Object.values(row);
            const values = Object.values(row).map(value => {
                return (value === '') ? "''" : `'${value}'`;
            });
            insertQuery += `INSERT INTO results (${columns.join(', ')}) VALUES (${values.join(', ')});`
        });

        console.log(insertQuery);

        twt.query(insertQuery, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({
                        success: false,
                        message: 'Duplicate entry: The sample_number already added to results.'
                    });
                } else {
                    console.log(err);
                    return res.status(500).send({message: 'Internal Server Error'});
                }
            }

            res.json({ results: result });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
});

router.put('/updateResults', async (req, res) => {
    try {
        const rows = req.body;
        console.log(rows);

        // Begin constructing the SQL transaction
        // let updateQuery = `START TRANSACTION;`;
        // let updateQuery = `SET SQL_SAFE_UPDATES = 0;`;
        let updateQuery = ``;

        // Add individual UPDATE queries for each row
        rows.forEach((row) => {
            updateQuery += `UPDATE results SET date = '${row.date}', sample_number = '${row.sample_number}', contract_number = '${row.contract_number}', material = '${row.material}', mass = '${row.mass}', company_name = '${row.company_name}', itsci_number = '${row.itsci_number}', remarks = '${row.remarks}', twt_ta2o5 = '${row.twt_ta2o5}', twt_nb2o5 = '${row.twt_nb2o5}', twt_sn = '${row.twt_sn}', twt_wo3 = '${row.twt_wo3}', twt_ra = '${row.twt_ra}', gsaContractNumber = '${row.gsaContractNumber}', gsa_ta2o5 = '${row.gsa_ta2o5}', gsa_nb2o5 = '${row.gsa_nb2o5}', gsa_sn = '${row.gsa_sn}', gsa_wo3 = '${row.gsa_wo3}', gsa_ra = '${row.gsa_ra}', gsa_moisture = '${row.gsa_moisture}', asi_ta2o5 = '${row.asi_ta2o5}', asi_nb2o5 = '${row.asi_nb2o5}', asi_sn = '${row.asi_sn}', asi_wo3 = '${row.asi_wo3}', asi_ra = '${row.asi_ra}' WHERE sample_number = '${row.sample_number}';`;
        });

        // Add the COMMIT statement
        // updateQuery += 'COMMIT;';

        // Output the combined query for debugging
        console.log("Printing updateQuery: ");
        console.table(updateQuery);
        // const query = `UPDATE results SET ? WHERE sample_number='${data.sample_number}';`;

        twt.query(updateQuery, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send({message: 'Internal Server Error'});
            }

            res.json({ results: result });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
});

// === get registration sample numbers ===
router.get('/getResultSampleNumbersByDate', async (req, res) => {
    const date = req.query.date;
    console.log(date);
    try {
        twt.query('SELECT DISTINCT sample_number FROM results WHERE date=?', [date], (err, result) => {
            res.json({sampleNumbers: result})
        })
    } catch (error) {
        console.error(error);
    }
})
// =======================================

router.get('/getResultsToAddByDate', async (req, res) => {
    let date;
    console.log("Printing date: ", date);
    if(req.query.date === undefined){
        date = moment().format('YYYY-MM-DD');
    } else {
        date = req.query.date;
    }
    console.log("Printing date: ", date);
    try {
        const query = `SELECT date, sample_number, material, company_name, mass FROM registrations WHERE date=?`;
        twt.query(query, date, (err, result) => {
            res.json({results: result})
        })
    } catch (error) {
        console.error(error);
    }
})

router.get('/getResultsToUpdateByDate', async (req, res) => {
    let date;
    console.log("Printing date: ", date);
    if(req.query.date === undefined){
        date = moment().format('YYYY-MM-DD');
    } else {
        date = req.query.date;
    }
    console.log("Printing date: ", date);
    try {
        const query = `SELECT * FROM results WHERE date=?`;
        twt.query(query, date, (err, result) => {
            res.json({results: result})
        })
    } catch (error) {
        console.error(error);
    }
})

module.exports = router;
