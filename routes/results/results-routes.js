const express = require('express');
const router = express.Router();

const { twt } = require('../../configs/mysql');

router.get('/getResultsBySampleNumber', async (req, res) => {
    const offer_number = req.query.offer_number;
    try {
        twt.query('SELECT * FROM registrations WHERE offer_number = ?', offer_number, (err, result) => {
            res.json({registration: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.post('/addResults', async (req, res) => {
    const data = req.body;
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);

        console.log("Printing columns: ");
        console.log(columns);

        console.log("Printing values: ");
        console.log(values);

        const query = `
            INSERT INTO results
            (${columns.join(', ')})
            VALUES
            (${Array(columns.length).fill('?').join(', ')})
            `;

        console.log(query);

        twt.query(query, values, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            res.json({ results: result });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }
});


module.exports = router;
