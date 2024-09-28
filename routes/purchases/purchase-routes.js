const fs = require('fs-extra');
const path = require('path');

const express = require('express');
const router = express.Router();

const { twt } = require('../../configs/mysql');
const compilePurchaseReceipt = require('../../handlebars/compileHandlebars');
const { sendMessageToClients } = require('../../handlebars/websocket');

// === add purchase ===

router.post('/addPurchase', async (req, res) => {
    try {
        const data = req.body;
        const query = `INSERT INTO purchases SET ?`;

        let selectedPurchase;

        twt.query(query, data, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            const purchase_id = result.insertId;
            console.log(purchase_id);

            const selectQuery = `SELECT pur.purchase_id, pur.mass, pur.company_name, pur.price_per_kg, pur.total_amount, pur.purchase_date, pur.rma_frw, pur.total_minus_rma_usd, purSet.exchange_rate_frw_to_usd, purSet.rma_fees_frw_per_kg, comp.tin, reg.material, reg.number_of_bags FROM purchases pur INNER JOIN companies comp ON pur.company_name=comp.company_name INNER JOIN purchasing_settings purSet ON pur.purchase_date=purSet.date INNER JOIN registrations reg ON reg.sample_number=pur.sample_number WHERE purchase_id=?`;
            twt.query(selectQuery, purchase_id, async (err, purchase) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Internal Server Error');
                }

                // selectedPurchase = purchase[0];
                console.log("purchase[0]: ", purchase[0]);

                try {
                    const pdfPath = await compilePurchaseReceipt.generatePdf(purchase[0]);
            
                    // Read the PDF file
                    const pdfData = await fs.promises.readFile(pdfPath);
            
                    // Send the PDF file to all connected WebSocket clients
                    // sendMessageToClients(pdfData);
                    sendMessageToClients(pdfData);
            
                    res.status(200).json({ message: 'PDF generated and sent to clients' });
                } catch (error) {
                    console.error('Error generating PDF:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }

                // console.log(compilePurchaseReceipt.generatePdf(purchase[0]));
            })

            res.json('Successfully added data into purchases!');
        })

    } catch (error) {
        console.error(error);
    }
});
// ====================

// === Print purchase by ID ===
router.get('/print_purchase_by_id', async (req, res) => {

    const purchase_id = req.query.purchase_id;
    let material = '';

    try {
        console.log("priting purchase id: ", purchase_id);

        twt.query(`SELECT pur.purchase_id, reg.material FROM purchases pur INNER JOIN registrations reg ON reg.sample_number=pur.sample_number WHERE purchase_id=?`, [purchase_id], async (err, purchase) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            material = purchase[0].material;
            
            try {
                const pdfPath = await compilePurchaseReceipt.getPDF(purchase_id, material);
                const pdfData = await fs.promises.readFile(pdfPath);

                console.log("printing pdf path: ", pdfPath);
        
                sendMessageToClients(pdfData);
        
                res.status(200).json({ message: 'PDF found' });
            } catch (error) {
                if (error.code === 'ENOENT') {
                    const errorMessage = `Error: No PDF file found for purchase ID ${purchase_id} and material ${material}`;
                    return res.status(404).json({ message: errorMessage });
                } else {
                    console.error('Error generating PDF:', error);
                    res.status(500).json({ error: 'Internal Server Error' });    
                }
            }
        })
    
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });  
          
    }
    
});

// === Update purchases ===

router.put('/updatePurchases', async (req, res) => {
    try {
        const data = req.body;

        const query = `UPDATE purchases SET ? WHERE purchase_id=?`;

        twt.query(query, [data, data.purchase_id], async (err, purchase) => {
            if (err) {
                console.error(err);
                return res.status(500).json({"error": "Internal Server Error"});
            }

            res.json('Purchase was successfully updated!');

            try {
                const selectQuery = `SELECT pur.purchase_id, pur.mass, pur.company_name, pur.price_per_kg, pur.total_amount, pur.purchase_date, pur.rma_frw, pur.total_minus_rma_usd, purSet.exchange_rate_frw_to_usd, purSet.rma_fees_frw_per_kg, comp.tin, reg.material, reg.number_of_bags FROM purchases pur INNER JOIN companies comp ON pur.company_name=comp.company_name INNER JOIN purchasing_settings purSet ON pur.purchase_date=purSet.date INNER JOIN registrations reg ON reg.sample_number=pur.sample_number WHERE purchase_id=?`;
                twt.query(selectQuery, data.purchase_id, async (err, purchase) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send('Internal Server Error');
                    }
    
                    // selectedPurchase = purchase[0];
                    console.log("purchase[0]: ", purchase[0]);
    
                    try {
                        const pdfPath = await compilePurchaseReceipt.reGeneratePDF(purchase[0]);
                
                        // Read the PDF file
                        const pdfData = await fs.promises.readFile(pdfPath);
                
                        // Send the PDF file to all connected WebSocket clients
                        sendMessageToClients(pdfData);
                
                        res.status(200).json({ message: 'PDF regenerated successfully!' });
                    } catch (error) {
                        console.error('Error generating PDF:', error);
                        res.status(500).json({ error: 'Internal Server Error' });
                    }
                })
            } catch (error) {
                console.error('Error generating PDF:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({"error": "Internal Server Error"});
    }
});

// === get purchase info for ta by sample number ===

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

// === get purchase info for sn by sample number ===

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


module.exports = router;