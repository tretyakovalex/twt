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

router.get('/getSampleNumbersFromResultsByDate', async (req, res) => {
    const date = req.query.date;
    console.log(date);
    try {
        let query = `SELECT DISTINCT res.sample_number FROM results res WHERE res.date = ?`;
        twt.query(query, [date], (err, result) => {
            res.json({sampleNumbers: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.post('/addResults', async (req, res) => {
    try {
        const data = req.body;

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input: Expected a non-empty array of results.',
            });
        }

        // Extract columns from the first object in the array
        const columns = Object.keys(data[0]);

        // Construct the query for multiple rows
        const values = data.map((row) => columns.map((col) => row[col]));
        const placeholders = values.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');

        const query = `
            INSERT INTO results (${columns.join(', ')})
            VALUES ${placeholders}
        `;

        // Flatten the values array for parameterized query
        const flattenedValues = values.flat();

        console.log('Executing query:', query);

        twt.query(query, flattenedValues, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: 'Internal Server Error',
                });
            }

            res.json({
                success: true,
                message: 'Results inserted successfully',
                affectedRows: result.affectedRows,
            });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
});


router.put('/updateResults', async (req, res) => {
    try {
        const data = req.body;

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input: Expected a non-empty array of results.',
            });
        }

        console.log("data: ", data);

        // Extract columns from the first object in the array
        const columns = Object.keys(data[0]);

        // Construct the individual UPDATE queries
        const queries = data.map((row) => {
            const setClause = columns
                .filter((col) => col !== 'registration_id') // Exclude the WHERE column from SET clause
                .map((col) => `${col} = ?`)
                .join(', ');

            return {
                query: `UPDATE results SET ${setClause} WHERE registration_id = ?`,
                values: [...columns.filter((col) => col !== 'registration_id').map((col) => row[col]), row.registration_id],
            };
        });

        console.log("queries: ", queries);

        // Execute all queries in parallel using Promise.all
        const promises = queries.map((q) =>
            new Promise((resolve, reject) => {
                twt.query(q.query, q.values, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            })
        );

        const results = await Promise.all(promises);

        res.json({
            success: true,
            message: 'Results updated successfully',
            affectedRows: results.reduce((sum, res) => sum + res.affectedRows, 0),
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
        // let query = `SELECT DISTINCT sample_number FROM results AND sample_number WHERE date=?`;
        let query = `SELECT DISTINCT res.sample_number FROM results res WHERE res.date = ? AND res.sample_number NOT IN (SELECT pur.sample_number FROM purchases pur);`;
        twt.query(query, [date], (err, result) => {
            res.json({sampleNumbers: result})
        })
    } catch (error) {
        console.error(error);
    }
})
// =======================================

// === get missing results ===
router.get('/getMissingResults', async (req, res) => {
    try {
        let query = `
            SELECT DISTINCT reg.sample_number 
            FROM registrations reg 
            WHERE reg.sample_number NOT IN (SELECT sample_number FROM results)
        `;
        
        twt.query(query, (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database query error' });
            }
            res.json({ missing_results: result });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
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
