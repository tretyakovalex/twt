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
        const data = req.body;
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

        const query = `INSERT INTO results SET ?`;

        console.log(query);

        twt.query(query, data, (err, result) => {
            if (err) {
                // if (err.code === 'ER_DUP_ENTRY') {
                //     return res.status(400).json({
                //         success: false,
                //         message: 'Duplicate entry: The sample_number already added to results.'
                //     });
                // } else {
                    console.log(err);
                    return res.status(500).send({message: 'Internal Server Error'});
                // }
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
            updateQuery += `UPDATE results SET date = '${row.date}', sample_number = '${row.sample_number}', contract_number = '${row.contract_number}', material = '${row.material}', mass = '${row.mass}', company_name = '${row.company_name}', itsci_number = '${row.itsci_number}', remarks = '${row.remarks}', twt_ta2o5 = '${row.twt_ta2o5}', twt_nb2o5 = '${row.twt_nb2o5}', twt_sn = '${row.twt_sn}', twt_wo3 = '${row.twt_wo3}', twt_be = '${row.twt_be}', twt_li = '${row.twt_li}', twt_bq_per_gram = '${row.twt_bq_per_gram}', gsaContractNumber = '${row.gsaContractNumber}', gsa_ta2o5 = '${row.gsa_ta2o5}', gsa_nb2o5 = '${row.gsa_nb2o5}', gsa_sn = '${row.gsa_sn}', gsa_wo3 = '${row.gsa_wo3}', gsa_be = '${row.gsa_be}', gsa_li = '${row.gsa_li}', gsa_bq_per_gram = '${row.gsa_bq_per_gram}', gsa_moisture = '${row.gsa_moisture}', asi_ta2o5 = '${row.asi_ta2o5}', asi_nb2o5 = '${row.asi_nb2o5}', asi_sn = '${row.asi_sn}', asi_wo3 = '${row.asi_wo3}', asi_be = '${row.asi_be}', asi_li = '${row.asi_li}', asi_bq_per_gram = '${row.asi_bq_per_gram}' WHERE sample_number = '${row.sample_number}';`;
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
        // const query = `SELECT offer_number, date, sample_number, material, company_name, mass FROM registrations WHERE date=?`;
        const query = `SELECT r.offer_number, r.date, r.sample_number, r.material, r.company_name, r.mass FROM registrations r WHERE date=? AND NOT EXISTS (SELECT 1 FROM results rs WHERE r.offer_number = rs.offer_number);`;
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
});



router.get('/getResultsForLots', async (req, res) => {
    try {
        let material_name = req.query.material_name;
        // const query = `select pur.purchase_id as purchase_number, pur.purchase_date as date, pur.company_name, pur.mass, pur.material_name, pur.material_percentage, pur.price_per_kg, pur.total_amount, res.remarks from purchases pur INNER JOIN results res ON pur.sample_number=res.sample_number;`;
        const query = `select pur.purchase_id as purchase_number, pur.ta_purchase_id, pur.wo3_purchase_id, pur.sn_purchase_id, pur.purchase_date as date, pur.company_name, pur.mass, pur.material_name, pur.material_percentage, pur.price_per_kg, pur.total_amount, res.remarks from purchases pur INNER JOIN results res ON pur.sample_number=res.sample_number where material_name='${material_name}';`;
        twt.query(query, async (err, result) => {
            if(err){
                console.error(err);
            }

            const unparsedLots = await fetch('http://localhost:4000/getDetailedLots');
            let lots = await unparsedLots.json();

            let finalArray = [];

            // console.log("Printing lots:");
            // console.table(lots.lots);

            result.forEach(item1 => {
                // Find the matching object in the second array
                if(lots.lots.some(item => item.material_name === "TA")){
                    // console.log("Inside TA if statement:");
                    // const matchingItem = lots.lots.find(item2 => item2.purchase_number === item1.ta_purchase_id);
                    const matchingItem = lots.lots.find(item2 => item2.purchase_number === item1.ta_purchase_id);
                    console.log("Printing matchingItem: ", matchingItem);
                    // If a match is found, add it to array3
                    if (matchingItem) {
                        
                        // finalArray.push({
                        //     ...matchingItem
                        // });
                    } else if(!matchingItem){
                        console.log("Printing not matching item: ", !matchingItem);
                        finalArray.push({
                            ...item1
                        });
                    }
                } else if(material_name === "W"){
                    const matchingItem = lots.lots.find(item2 => item2.purchase_number === item1.wo3_purchase_id);
                    console.log("Printing matchingItem: ", matchingItem);
                    // If a match is found, add it to array3
                    if (matchingItem) {
                        // finalArray.push({
                        //     ...matchingItem
                        // });
                    } else if(!matchingItem){
                        finalArray.push({
                            ...item1
                        });
                    }
                } else if(material_name === "Sn"){
                    const matchingItem = lots.lots.find(item2 => item2.purchase_number === item1.sn_purchase_id);
                    console.log("Printing matchingItem: ", matchingItem);
                    // If a match is found, add it to array3
                    if (matchingItem) {
                        // finalArray.push({
                        //     ...matchingItem
                        // });
                    } else if(!matchingItem){
                        finalArray.push({
                            ...item1
                        });
                    }
                }
                
              });

            // console.log(lots);
            res.json({results: finalArray})
        })
    } catch (error) {
        console.error(error);
    }
})

module.exports = router;
