const express = require('express');
const router = express.Router();
const moment = require('moment');

const { twt } = require('../../configs/mysql');

// === Lots Table ===

router.get('/getLots', async (req, res) => {
    try {
        // const query = `select * from detailed_lots;`;
        const query = `select lot_id, category, purchase_numbers, forming_date, company_name, calc_mass, material_name, material_percentage_average, radiation_percentage_average, comments, price_per_kg, amount_in_usd from lots;`;
        twt.query(query, (err, lot) => {
            res.json({lots: lot})
        })
    } catch (error) {
        console.error(error);
    }
});

router.post('/createLots', async (req, res) => {
    try {
        const data = req.body;
        console.log(data);

        const insertQuery = `INSERT INTO lots SET ?`;

        twt.query(insertQuery, data, (err, result) => {
            if(err){
                console.error(err);
            }

            res.json({"message": "successfully added purchases to lot!"});
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getLotsByDate', async (req, res) => {
    try {
        let material_name = req.query.material_name;
        let year = req.query.year;
        let month = req.query.month;

        console.log("Printing selected material_name: ", material_name);

        console.log("year: ", year, ", month: ", month);
        let query = ``;
        if(year){
            if(month){
                query = `select lot_number, category, purchase_numbers, forming_date, calc_mass, material_name, material_percentage_average, radiation_percentage_average, comments, price_per_kg, amount_in_usd from lots WHERE material_name = '${material_name}' AND YEAR(forming_date) = ${year} AND MONTH(forming_date) = ${month} ORDER BY lot_number ASC;`;
            } else if (!month){
                query = `select lot_number, category, purchase_numbers, forming_date, calc_mass, material_name, material_percentage_average, radiation_percentage_average, comments, price_per_kg, amount_in_usd from lots WHERE material_name = '${material_name}' AND YEAR(forming_date) = ${year} ORDER BY lot_number ASC;`;
            }
        } else if (!year) {
            if(month){
                query = `select lot_number, category, purchase_numbers, forming_date, calc_mass, material_name, material_percentage_average, radiation_percentage_average, comments, price_per_kg, amount_in_usd from lots WHERE material_name = '${material_name}' AND MONTH(forming_date) = ${month} ORDER BY lot_number ASC;`;
            } else if (!month){
                query = `select lot_number, category, purchase_numbers, forming_date, calc_mass, material_name, material_percentage_average, radiation_percentage_average, comments, price_per_kg, amount_in_usd from lots WHERE material_name = '${material_name}' ORDER BY lot_number ASC;`;
            }
        }
        twt.query(query, (err, lot) => {
            if(err){
                console.error(err);
            }

            res.json({lots: lot})
        })
    } catch (error) {
        console.error(error);
    }
})

// ==================

// === Detailed Lots Table ===

router.get('/getDetailedLots', async (req, res) => {
    try {
        // const query = `select * from detailed_lots;`;
        const query = `select lot_number, purchase_number, date, company_name, mass, material_name, material_percentage, price_per_kg, comments as remarks, amount_in_usd as total_amount from detailed_lots;`;
        twt.query(query, (err, lot) => {
            res.json({lots: lot})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getDetailedLotsWithoutLotNumber', async (req, res) => {
    try {
        let material_name = req.query.material_name;
        
        // Add MTU for Tungsten, LME and TC for Tin in query
        // Split into differenet queries based on the material_name
        let query = ``;

        if(material_name === "Ta"){
            query = `select lot_number, purchase_number, date, company_name, mass, material_name, material_percentage, price_per_kg, mtu, comments as remarks, amount_in_usd as total_amount from detailed_lots where lot_number IS NULL AND material_name='${material_name}'`;
        } else if(material_name === "W"){
        query = `select lot_number, purchase_number, date, company_name, mass, material_name, material_percentage, price_per_kg, mtu, lme, tc, comments as remarks, amount_in_usd as total_amount from detailed_lots where lot_number IS NULL AND material_name='${material_name}';`;
        } else if(material_name === "Sn"){
            query = `select lot_number, purchase_number, date, company_name, mass, material_name, material_percentage, price_per_kg, mtu, lme, tc, comments as remarks, amount_in_usd as total_amount from detailed_lots where lot_number IS NULL AND material_name='${material_name}';`;
        }

        twt.query(query, (err, lotNumber) => {
            res.json({lots: lotNumber})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getLastLotNumber', async (req, res) => {
    try {
        let material_name = req.query.material_name;
        const query = `select lot_number from detailed_lots where material_name='${material_name}' ORDER BY lot_number DESC LIMIT 1;`;
        twt.query(query, (err, lot) => {
            res.json({lots: lot})
        })
    } catch (error) {
        console.error(error);
    }
});

router.post('/createdDetailedLotsFromPurchase', async (req, res) => {
    try {
        const data = req.body;

        // const query = `INSERT INTO detailed_purchases (purchase_number, date, company_name, mass, material_name, material_percentage, price_per_kg, comment, amount_in_usd, Nb2o5, bq_per_kg, mtu, lme, tc) VALUES ?`;
        const query = `INSERT INTO detailed_lots SET ?`;

        console.log(data);

        // twt.query(query, [data.purchase_number, data.date, data.company_name, data.mass, data.material_name, data.material_percentage, data.price_per_kg, data.comment, data.amount_in_usd, data.Nb2o5, data.bq_per_kg, data.mtu, data.lme, data.tc], async (err, detailed_lots) => {
        twt.query(query, data, (err, detailed_lots) => {
            if(err){
                console.error(err);
            }

            res.json("Successfully added data from purchase");
        })
    } catch (error) {
        console.error(error);
    }
});

router.put('/updateDetailedLotsFromPurchase', async (req, res) => {
    try {
        const data = req.body;

        const query = `UPDATE detailed_lots SET ? WHERE purchase_number=${data.purchase_number} AND material_name='${data.material_name}'`;

        console.log(data);

        // twt.query(query, [data.purchase_number, data.date, data.company_name, data.mass, data.material_name, data.material_percentage, data.price_per_kg, data.comment, data.amount_in_usd, data.Nb2o5, data.bq_per_kg, data.mtu, data.lme, data.tc], async (err, detailed_lots) => {
        twt.query(query, data, (err, detailed_lots) => {
            if(err){
                console.error(err);
            }

            res.json("Successfully added data from purchase");
        })
    } catch (error) {
        console.error(error);
    }
})

router.post('/deleteDetailedLotsFromPurchase', async (req, res) => {
    try {
        const data = req.body;
        
        console.log(data);

        const query = `DELETE FROM detailed_lots WHERE purchase_number=${data.purchase_id} AND material_name='${data.material_name}'`;

        twt.query(query, data, (err, detailed_lots) => {
            if(err){
                console.error(err)
            }

            res.json("Successfully added data from purchase");
        })
    } catch (error) {
        console.error(error);
    }
})

router.post('/createDetailedLots', async (req, res) => {
    try {
        const data = req.body;
        console.log("Printing lot data: ", data);

        let assignedLots = data.assignedLots;
        let lot_number = data.lot_number;
        let forming_date = data.forming_date;
        let material_name = data.material_name;

        let lot_data = await formatPurchasesData(assignedLots, lot_number, forming_date, material_name);
        console.log("Printing formatted lot_data: ", lot_data);

        const insertQuery = `INSERT INTO detailed_lots (lot_number, purchase_number, date, company_name, mass, material_name, material_percentage, price_per_kg, comments, amount_in_usd) VALUES ?`;

        // Convert the array of objects to an array of arrays (for bulk insert)
        const values = assignedLots.map(lot => [lot.lot_number, lot.purchase_number, lot.date, lot.company_name, lot.mass, lot.material_name, lot.material_percentage, lot.price_per_kg, lot.comments, lot.amount_in_usd]);

        twt.query(insertQuery, [values], async (err, result) => {
            if(err){
                console.error(err);
            }

            await fetch('http://localhost:4000/createLots', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(lot_data) // Convert the data to JSON
            });

            res.json({"message": "successfully added purchases to detailed lot"});
        })
    } catch (error) {
        console.error(error);
    }
})

router.get('/getDetailedLotsByDate', async (req, res) => {
    try {
        let year = req.query.year;
        let month = req.query.month;

        console.log("year: ", year, ", month: ", month);
        let query = ``;
        if(year){
            if(month){
                query = `select lot_number, purchase_number, date, company_name, mass, material_name, material_percentage, price_per_kg, comments as remarks, amount_in_usd as total_amount from detailed_lots WHERE YEAR(date) = ${year} AND MONTH(date) = ${month};`;
            } else if (!month){
                query = `select lot_number, purchase_number, date, company_name, mass, material_name, material_percentage, price_per_kg, comments as remarks, amount_in_usd as total_amount from detailed_lots WHERE YEAR(date) = ${year};`;
            }
        } else if (!year) {
            if(month){
                query = `select lot_number, purchase_number, date, company_name, mass, material_name, material_percentage, price_per_kg, comments as remarks, amount_in_usd as total_amount from detailed_lots WHERE MONTH(date) = ${month};`;
            } else if (!month){
                query = `select lot_number, purchase_number, date, company_name, mass, material_name, material_percentage, price_per_kg, comments as remarks, amount_in_usd as total_amount from detailed_lots;`;
            }
        }
        twt.query(query, (err, lot) => {
            if(err){
                console.error(err);
            }

            res.json({lots: lot})
        })
    } catch (error) {
        console.error(error);
    }
})

router.get('/getDetailedLotsByLotNumber', async (req, res) => {
    try {
        const lot_number = req.query.lot_number;
        const material_name = req.query.material_name;

        const query = `select lot_number, purchase_number, date, company_name, mass, material_name, material_percentage, price_per_kg, comments as remarks, amount_in_usd as total_amount from detailed_lots WHERE material_name = '${material_name}' AND lot_number=${lot_number};`;
        twt.query(query, (err, lot) => {
            res.json({lots: lot})
        })
    } catch (error) {
        console.error(error);
    }
});
// ===========================


// === Helper functions ===
function formatPurchasesData(data, lot_number, forming_date, material_name){
    let sum_of_percentages = 0;
    let obj = {
        lot_id: lot_number,
        category: "X",
        purchase_numbers: "",
        forming_date: forming_date,
        calc_mass: 0,
        material_name: material_name,
        material_percentage_average: 0,
        radiation_percentage_average: 0,
        comments: "",
        price_per_kg: 0,
        amount_in_usd: 0,
    };

    data.forEach(item => {
        obj.purchase_numbers += `${item.purchase_number} `;
        // obj.forming_date = item.forming_date;
        obj.calc_mass += Number(roundTo(item.mass, 2));
        sum_of_percentages += Number(roundTo(item.material_percentage, 2));
        obj.amount_in_usd += Number(roundTo(item.amount_in_usd, 2));
    });

    let material_percentage_average = Number(roundTo(sum_of_percentages, 2)) / data.length;
    obj.material_percentage_average = Number(roundTo(material_percentage_average, 2));
    
    let price_per_kg = Number(roundTo(obj.amount_in_usd, 2)) / obj.calc_mass;
    obj.price_per_kg = Number(roundTo(price_per_kg, 2));

    return obj;
}

function roundTo(n, digits) {
    var negative = false;
    if (digits === undefined) {
        digits = 0;
    }
    if (n < 0) {
        negative = true;
        n = n * -1;
    }
    var multiplicator = Math.pow(10, digits);
    n = parseFloat((n * multiplicator).toFixed(11));
    n = (Math.round(n) / multiplicator).toFixed(digits);
    if (negative) {
        n = (n * -1).toFixed(digits);
    }
    return n;
}
// ========================

module.exports = router;
