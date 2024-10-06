const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');

const express = require('express');
const router = express.Router();

const moment = require('moment');

const { twt } = require('../../configs/mysql');
const compilePurchaseReceipt = require('../../handlebars/purchasingCertificateTemplate');
// const { sendMessageToClients } = require('../../handlebars/websocket');

// === add purchase ===

router.post('/addPurchase', async (req, res) => {
    try {
        const data = req.body;
        const query = `INSERT INTO purchases SET ?`;

        twt.query(query, data, async (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            const purchase_id = result.insertId;
            console.log("Printing purchase_id: ", purchase_id);
            console.log("Printing data (25): ", data);
            
            // const unparsedPurchase = await fetch(`http://localhost:4000/getPurchaseByID?purchase_id=22;`);
            const unparsedPurchase = await fetch(`http://localhost:4000/getPurchaseByID?purchase_id=${purchase_id}`);
            const purchase = await unparsedPurchase.json();
            console.log("Printing purchase: ", purchase.purchase[0]);

            try {
                const pdfPath = await compilePurchaseReceipt.generatePdf(purchase.purchase[0]);
        
                if(pdfPath){
                    console.log("Printing pdf path: ", pdfPath);
                    res.download(pdfPath);
                }

            } catch (error) {
                console.error('Error generating PDF:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }

        });
    } catch (error) {
        console.error(error);
    }
});
// ====================

router.get('/getPurchaseByID', async (req, res) => {
    try {
        const purchase_id = req.query.purchase_id;

        let currentDate = moment().format('YYYY-MM-DD');

        let unparsedLastPurchasingSettings = await fetch('http://localhost:4000/getLastPurchasingSettings');
        let lastPurchasingSettings = await unparsedLastPurchasingSettings.json();
        console.log("Printing lastPurchasingSettings: ", lastPurchasingSettings);
        let lastPurchasingSettingsDate = moment(lastPurchasingSettings.settings[0].date).format('YYYY-MM-DD');

        if(lastPurchasingSettingsDate === currentDate){
            // If the purchasing settings were updated today, get purchasing data with purchasing settings
            const selectQuery = `SELECT pur.purchase_id, pur.mass, pur.company_name, pur.price_per_kg, pur.total_amount, pur.purchase_date, pur.rma_frw, pur.total_minus_rma_usd, purSet.exchange_rate_frw_to_usd, purSet.rma_fees_frw_per_kg, comp.tin, reg.material, reg.number_of_bags FROM purchases pur INNER JOIN companies comp ON pur.company_name=comp.company_name INNER JOIN purchasing_settings purSet ON pur.purchase_date=purSet.date INNER JOIN registrations reg ON reg.sample_number=pur.sample_number WHERE pur.purchase_id=?`;
            twt.query(selectQuery, purchase_id, (err, result) => {
                if(err){
                    console.error(err);
                    res.status(500).json("Internal Server Error");
                }

                res.json({purchase: result});
            })
        } else if(lastPurchasingSettingsDate !== currentDate){
            // If the purchasing settings were not updated today, select from purchases table and separately add in last purchasing settings into results
            const selectQuery = `SELECT pur.purchase_id, pur.mass, pur.company_name, pur.price_per_kg, pur.total_amount, pur.purchase_date, pur.rma_frw, pur.total_minus_rma_usd, comp.tin, reg.material, reg.number_of_bags FROM purchases pur INNER JOIN companies comp ON pur.company_name=comp.company_name INNER JOIN registrations reg ON reg.sample_number=pur.sample_number WHERE pur.purchase_id=?`;
            twt.query(selectQuery, purchase_id, (err, result) => {
                if(err){
                    console.error(err);
                    res.status(500).json("Internal Server Error");
                }
                result[0].exchange_rate_frw_to_usd = lastPurchasingSettings.settings[0].exchange_rate_frw_to_usd;
                result[0].rma_fees_frw_per_kg = lastPurchasingSettings.settings[0].rma_fees_frw_per_kg;

                res.json({purchase: result});
            })
        }
        
    } catch (error) {
        console.error(error);
    }
})

// === Print purchase by ID ===
router.get('/print_purchase_by_id', async (req, res) => {

    const purchase_id = req.query.purchase_id;
    let material = '';

    try {
        console.log("priting purchase id: ", purchase_id);

        twt.query(`SELECT pur.purchase_id, reg.material FROM purchases pur INNER JOIN registrations reg ON reg.sample_number=pur.sample_number WHERE pur.purchase_id=?`, [purchase_id], async (err, purchase) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            material = purchase[0].material;
            
            try {
                const pdfPath = await compilePurchaseReceipt.getPDF(purchase_id, material);
                // const pdfData = await fs.promises.readFile(pdfPath);

                console.log("printing pdf path: ", pdfPath);
                res.download(pdfPath);
        
                // sendMessageToClients(pdfData);
        
                // res.status(200).json({ message: 'PDF found' });
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
                        // sendMessageToClients(pdfData);
                
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

router.get('/get_Purchase_Info_By_Sample_Number', async (req, res) => {
    try {
        const sample_number = req.query.sample_number;
        const query = `SELECT reg.company_name, reg.mass, reg.material, res.twt_ta2o5, res.twt_nb2o5, res.twt_sn, c.tunnels FROM registrations reg JOIN results res ON reg.sample_number=res.sample_number JOIN companies c ON reg.company_name=c.company_name WHERE reg.sample_number=?;`
        twt.query(query, [sample_number], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            let modifiedResult = [];
            console.log("printing result[0]: ", result[0]);

            if(result[0].material === "TA"){
                modifiedResult.push({
                    company_name: result[0].company_name,
                    mass: result[0].mass,
                    material_name: result[0].material,
                    material_percentage: result[0].twt_ta2o5 || 0,
                    tunnels: result[0].tunnels
                })
            } else if (result[0].material === "Sn" || result[0].material === "SN"){
                modifiedResult.push({
                    company_name: result[0].company_name,
                    mass: result[0].mass,
                    material_name: result[0].material,
                    material_percentage: result[0].twt_sn || 0,
                    tunnels: result[0].tunnels
                })
            } else if (result[0].material === "WO3" || result[0].material === "W"){
                modifiedResult.push({
                    company_name: result[0].company_name,
                    mass: result[0].mass,
                    material_name: result[0].material,
                    material_percentage: result[0].twt_nb2o5 || 0,
                    tunnels: result[0].tunnels
                })
            }
            
            res.json({purchases: modifiedResult})
        })
    } catch (error) {
        console.error(error);
    }
});

// // === get purchase info for ta by sample number ===

// router.get('/get_Purchase_Info_For_Ta_By_Sample_Number', async (req, res) => {
//     try {
//         const sample_number = req.query.sample_number;
//         const query = `SELECT reg.company_name, reg.mass, res.twt_ta2o5, c.tunnels FROM registrations reg JOIN results res ON reg.sample_number=res.sample_number JOIN companies c ON reg.company_name=c.company_name WHERE reg.sample_number=?;`
//         twt.query(query, [sample_number], (err, result) => {
//             if (err) {
//                 console.log(err);
//                 return res.status(500).send('Internal Server Error');
//             }

//             res.json({purchases: result})
//         })
//     } catch (error) {
//         console.error(error);
//     }
// });

// // === get purchase info for sn by sample number ===

// router.get('/get_Purchase_Info_For_Sn_By_Sample_Number', async (req, res) => {
//     try {
//         const sample_number = req.query.sample_number;
//         const query = `SELECT reg.company_name, reg.mass, res.twt_sn, c.tunnels FROM registrations reg JOIN results res ON reg.sample_number=res.sample_number JOIN companies c ON reg.company_name=c.company_name WHERE reg.sample_number=?;`
//         twt.query(query, [sample_number], (err, result) => {
//             if (err) {
//                 console.log(err);
//                 return res.status(500).send('Internal Server Error');
//             }

//             res.json({purchases: result})
//         })
//     } catch (error) {
//         console.error(error);
//     }
// });

// // === get purchase infor for Wo3 by sample number ===

// router.get('/get_Purchase_Info_For_Wo3_By_Sample_Number', async (req, res) => {
//     try {
//         const sample_number = req.query.sample_number;
//         const query = `SELECT reg.company_name, reg.mass, res.twt_wo3, c.tunnels FROM registrations reg JOIN results res ON reg.sample_number=res.sample_number JOIN companies c ON reg.company_name=c.company_name WHERE reg.sample_number=?;`
//         twt.query(query, [sample_number], (err, result) => {
//             if (err) {
//                 console.log(err);
//                 return res.status(500).send('Internal Server Error');
//             }

//             res.json({purchases: result})
//         })
//     } catch (error) {
//         console.error(error);
//     }
// });

// === get purchases by date ===

router.get('/getPurchasesByDate', async (req, res) => {
    try {
        const date = req.query.date;
        // const query = `select * from purchases where purchase_date=?;`
        const query = `select pur.purchase_id, pur.sample_number, pur.sample_and_company_number, pur.purchase_date, pur.results_date, pur.company_name, pur.company_tunnel, pur.mass, reg.sample_number, pur.material_name, pur.material_percentage, pur.price_per_kg, pur.total_amount, pur.itsci_mine_site_number, pur.rma_frw, pur.rma_usd, pur.total_minus_rma_usd, pur.usd_per_pound
                    from purchases pur INNER JOIN registrations reg ON pur.sample_number=reg.sample_number where pur.purchase_date=?;`
        twt.query(query, [date], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            let modifiedResult = [];

            // result.forEach(item => {
            //     modifiedResult = result.map(obj => {
            //         return {
            //             purchase_id: item.purchase_id,
            //             sample_number: item.sample_number,
            //             sample_and_company_number: item.sample_and_company_number,
            //             purchase_date: item.purchase_date,
            //             results_date: item.results_date,
            //             company_name: item.company_name,
            //             company_tunnel: item.company_tunnel,
            //             mass: item.mass,
            //             sample_number: item.sample_number,
            //             material_name: item.material,
            //             material_percentage: item.material_percentage,
            //             price_per_kg: item.price_per_kg,
            //             total_amount: item.total_amount,
            //             itsci_mine_site_number: item.itsci_mine_site_number,
            //             rma_frw: item.rma_frw,
            //             rma_usd: item.rma_usd,
            //             total_minus_rma_usd: item.total_minus_rma_usd,
            //             usd_per_pound: item.usd_per_pound
            //         };
            //     });
            // })
            

            res.json({purchases: result})
            // res.json({purchases: modifiedResult})
        })
    } catch (error) {
        console.error(error);
    }
});


module.exports = router;