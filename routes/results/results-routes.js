const express = require('express');
const router = express.Router();

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
    const data = req.body;
    try {
        const columns = Object.keys(data);
        const values = Object.values(data);

        // console.log("Printing columns: ");
        // console.log(columns);

        // console.log("Printing values: ");
        // console.log(values);

        const query = `
            INSERT INTO results
            (${columns.join(', ')})
            VALUES
            (${Array(columns.length).fill('?').join(', ')})
            `;

        // console.log(query);

        twt.query(query, values, (err, result) => {
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
        const data = req.body;
        console.log(data);

        const query = `UPDATE results SET ? WHERE sample_number='${data.sample_number}';`;

        twt.query(query, data, (err, result) => {
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


module.exports = router;
