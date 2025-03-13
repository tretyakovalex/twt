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
        let data = req.body;
        const query = `INSERT INTO purchases SET ?`;

        const params = {
            material_name: data.material_name
        };
        const queryString = new URLSearchParams(params).toString();

        console.log("data (26): ", data);

        let unparsedLastPurchase = await fetch(`http://localhost:4000/getLastPurchaseMaterialNumber?${queryString}`);
        let LastPurchase = await unparsedLastPurchase.json();

        console.log("LastPurchase[0]: ", LastPurchase[0]);

        if(LastPurchase[0].material_name === "Ta"){
            data.ta_purchase_id = LastPurchase[0].ta_purchase_id + 1;
        } else if(LastPurchase[0].material_name === "WO3" || LastPurchase[0].material_name === "W"){
            data.wo3_purchase_id = LastPurchase[0].wo3_purchase_id + 1;
        } else if(LastPurchase[0].material_name === "Sn" || LastPurchase[0].material_name === "SN"){
            data.sn_purchase_id = LastPurchase[0].sn_purchase_id + 1;
        } else if(LastPurchase[0].material_name === "Be"){
            data.be_purchase_id = LastPurchase[0].be_purchase_id + 1;
        } else if(LastPurchase[0].material_name === "Li"){
            data.li_purchase_id = LastPurchase[0].li_purchase_id + 1;
        }

        console.log('data: ', data);

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

            // Add data to detailed_lots
            let purchase_number = 0;
            if(data.material_name === "Ta"){
                purchase_number = data.ta_purchase_id;
            } else if(data.material_name === "W"){
                purchase_number = data.wo3_purchase_id;
            } else if(data.material_name === "Sn"){
                purchase_number = data.sn_purchase_id;
            } else if(data.material_name === "Be"){
                purchase_number = data.be_purchase_id;
            } else if(data.material_name === "Li"){
                purchase_number = data.li_purchase_id;
            }

            let detailed_lots_obj = {
                purchase_number: purchase_number,
                date: data.purchase_date,
                company_name: data.company_name,
                mass: data.mass,
                material_name: data.material_name,
                material_percentage: data.material_percentage,
                price_per_kg: data.price_per_kg,
                amount_in_usd: data.total_amount,
                Nb2o5: data.Nb2o5,
                bq_per_kg: data.bq_per_kg,
                mtu: data.mtu,
                lme: data.lme,
                tc: data.tc
            };

            await fetch('http://localhost:4000/createdDetailedLotsFromPurchase', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(detailed_lots_obj) // Convert the data to JSON
            });

            let raw_purchasing_settings_data = await fetch('http://localhost:4000/getLastPurchasingSettings');
            console.log("raw_purchasing_settings_data: ", raw_purchasing_settings_data);
            let purchasing_settings_data = await raw_purchasing_settings_data.json();
            let rma_fees_frw_per_kg = 0;
            console.log("data.material_name", data.material_name);
            if(data.material_name === "Ta"){
                rma_fees_frw_per_kg = purchasing_settings_data.settings[0].ta_rma_fees_frw_per_kg;
            } else if(data.material_name === "SN" || data.material_name === "Sn"){
                rma_fees_frw_per_kg = purchasing_settings_data.settings[0].sn_rma_fees_frw_per_kg;
            } else if(data.material_name === "W"){
                rma_fees_frw_per_kg = purchasing_settings_data.settings[0].w_rma_fees_frw_per_kg;
            } else if(data.material_name === "BE" || data.material_name === "Be"){
                rma_fees_frw_per_kg = purchasing_settings_data.settings[0].be_rma_fees_frw_per_kg;
            } else if(data.material_name === "LI" || data.material_name === "Li"){
                rma_fees_frw_per_kg = purchasing_settings_data.settings[0].li_rma_fees_frw_per_kg;
            }

            console.log("Printing purchasing_settings_data[0]: ", purchasing_settings_data.settings[0]);
            console.log("Printing rma_fees_frw_per_kg: ", rma_fees_frw_per_kg);

            let pdfData = {
                purchase_number: purchase_number,
                material_type: data.material_name,
                material_name: data.material_name,
                purchase_mass: data.mass,
                company_name: data.company_name,
                tin: data.tin,
                price_usd_per_kg: data.price_per_kg,
                total_amount_usd: data.total_amount,
                date: data.purchase_date,
                exchange_rate_rwf_usd: purchasing_settings_data.exchange_rate_frw_to_usd || "1335", // Change to get from last row from purchasing_settgins table
                rma_payment_rwf_per_kg: rma_fees_frw_per_kg || "125", // Change to get from last row from purchasing_settgins table
                rma_payment_total_rwf: data.rma_frw,
                rma_payment_three_percent_usd: "728.6",
                rma_payment_three_percent_rwf: "973 409.6",
                client_net_payment: data.total_minus_rma_usd,
            }

            try {
                // const pdfPath = await compilePurchaseReceipt.generatePdf(purchase.purchase[0], 'purchaseCertificate');
                let certificateName = `purchasingCert_${data.material_name}_${data.sample_and_company_number}`;
                // const pdfPath = await compilePurchaseReceipt.generatePdf(pdfData, 'purchaseCertificate');
                const pdfPath = await compilePurchaseReceipt.generatePdf(pdfData, certificateName);
        
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
            const selectQuery = `SELECT pur.purchase_id, pur.mass, pur.company_name, pur.price_per_kg, pur.total_amount, 
                                pur.purchase_date, pur.rma_frw, pur.total_minus_rma_usd, purSet.exchange_rate_frw_to_usd, 
                                purSet.ta_rma_fees_frw_per_kg, purSet.w_rma_fees_frw_per_kg, purSet.sn_rma_fees_frw_per_kg, purSet.be_rma_fees_frw_per_kg, purSet.li_rma_fees_frw_per_kg, 
                                comp.tin, reg.material, reg.number_of_bags 
                                FROM purchases pur INNER JOIN companies comp ON pur.company_name=comp.company_name 
                                INNER JOIN purchasing_settings purSet ON pur.purchase_date=purSet.date 
                                INNER JOIN registrations reg ON reg.sample_number=pur.sample_number 
                                WHERE pur.purchase_id=?`;
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
                result[0].rma_fees_frw_per_kg = lastPurchasingSettings.settings[0].ta_rma_fees_frw_per_kg;
                result[0].rma_fees_frw_per_kg = lastPurchasingSettings.settings[0].w_rma_fees_frw_per_kg;
                result[0].rma_fees_frw_per_kg = lastPurchasingSettings.settings[0].sn_rma_fees_frw_per_kg;
                result[0].rma_fees_frw_per_kg = lastPurchasingSettings.settings[0].be_rma_fees_frw_per_kg;
                result[0].rma_fees_frw_per_kg = lastPurchasingSettings.settings[0].li_rma_fees_frw_per_kg;

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

// router.put('/updatePurchases', async (req, res) => {
//     try {
//         const dataArray = req.body; // Expecting an array of objects

//         console.log(dataArray);

//         if (!Array.isArray(dataArray) || dataArray.length === 0) {
//             return res.status(400).json({ error: "Request body must be a non-empty array of objects" });
//         }

//         const updateQuery = `UPDATE purchases SET ? WHERE purchase_id=?`;
//         const selectQuery = `
//             SELECT pur.purchase_id, pur.mass, pur.sample_and_company_number, pur.company_name, pur.price_per_kg, pur.total_amount, pur.purchase_date, pur.rma_frw, pur.total_minus_rma_usd, pur.ta_purchase_id, 
//             COALESCE(purSet.exchange_rate_frw_to_usd, lastSet.exchange_rate_frw_to_usd) AS exchange_rate_frw_to_usd, 
//             COALESCE(purSet.ta_rma_fees_frw_per_kg, lastSet.ta_rma_fees_frw_per_kg) AS ta_rma_fees_frw_per_kg,
//             comp.tin, reg.material, reg.number_of_bags
//             FROM purchases pur
//             INNER JOIN companies comp ON pur.company_name = comp.company_name
//             INNER JOIN registrations reg ON reg.sample_number=pur.sample_number
//             LEFT JOIN purchasing_settings purSet 
//                 ON pur.purchase_date = purSet.date
//             LEFT JOIN (
//                 SELECT * 
//                 FROM purchasing_settings 
//                 ORDER BY date DESC 
//                 LIMIT 1
//             ) lastSet ON purSet.date IS NULL WHERE pur.purchase_id=?;
//         `;

//         let ta_purchase_id = 0;
//         for (const purchaseData of dataArray) {
//             try {
//                 // Update each purchase in the database
//                 await new Promise((resolve, reject) => {
//                     twt.query(updateQuery, [purchaseData, purchaseData.purchase_id], (err) => {
//                         if (err) {
//                             console.error(`Error updating purchase ID ${purchaseData.purchase_id}:`, err);
//                             return reject(err);
//                         }
//                         console.log("The purchase data was successfully updated!");
//                         resolve();
//                     });
//                 });

//                 // Fetch the updated purchase data
//                 let sample_and_company_number = "";
//                 const updatedPurchase = await new Promise((resolve, reject) => {
//                     twt.query(selectQuery, [purchaseData.purchase_id], (err, purchase) => {
//                         if (err) {
//                             console.error(`Error fetching updated data for purchase ID ${purchaseData.purchase_id}:`, err);
//                             return reject(err);
//                         }
//                         sample_and_company_number = purchase[0].sample_and_company_number;
//                         ta_purchase_id = purchase[0].ta_purchase_id;
//                         resolve(purchase[0]);
//                     });
//                 });

//                 console.log("updatedPurchase: ", updatedPurchase);

//                 // Add data to detailed_lots
//                 let purchase_number = 0;
//                 let rma_fees_frw_per_kg = 0;
//                 if(purchaseData.material_name === "Ta"){
//                     purchase_number = ta_purchase_id;
//                     rma_fees_frw_per_kg = updatedPurchase.ta_rma_fees_frw_per_kg
//                 } else if(purchaseData.material_name === "W"){
//                     purchase_number = purchaseData.wo3_purchase_id;
//                     rma_fees_frw_per_kg = updatedPurchase.w_rma_fees_frw_per_kg
//                 } else if(purchaseData.material_name === "Sn"){
//                     purchase_number = purchaseData.sn_purchase_id;
//                     rma_fees_frw_per_kg = updatedPurchase.sn_rma_fees_frw_per_kg
//                 } else if(purchaseData.material_name === "Be"){
//                     purchase_number = purchaseData.be_purchase_id;
//                     rma_fees_frw_per_kg = updatedPurchase.be_rma_fees_frw_per_kg
//                 } else if(purchaseData.material_name === "Li"){
//                     purchase_number = purchaseData.li_purchase_id;
//                     rma_fees_frw_per_kg = updatedPurchase.li_rma_fees_frw_per_kg
//                 }

//                 console.log("purchase_number: ", purchase_number);

//                 let pdfData = {
//                     purchase_number: purchase_number,
//                     material_type: purchaseData.material_name,
//                     material_name: purchaseData.material_name,
//                     purchase_mass: updatedPurchase.mass,
//                     company_name: updatedPurchase.company_name,
//                     tin: updatedPurchase.tin,
//                     price_usd_per_kg: purchaseData.price_per_kg,
//                     total_amount_usd: purchaseData.total_amount,
//                     date: moment(updatedPurchase.purchase_date).format('DD.MM.YYYY'),
//                     exchange_rate_rwf_usd: updatedPurchase.exchange_rate_frw_to_usd || "1335", // Change to get from last row from purchasing_settgins table
//                     rma_payment_rwf_per_kg: rma_fees_frw_per_kg || "125", // Change to get from last row from purchasing_settgins table
//                     rma_payment_total_rwf: updatedPurchase.rma_frw,
//                     rma_payment_three_percent_usd: "728.6",
//                     rma_payment_three_percent_rwf: "973 409.6",
//                     client_net_payment: updatedPurchase.total_minus_rma_usd,
//                 }

//                 console.log("pdfData: ", pdfData);

//                 // Generate PDF for the updated purchase
//                 let certificateName = `purchasingCert_${purchaseData.material_name}_${sample_and_company_number}`;
//                 // const pdfPath = await compilePurchaseReceipt.generatePdf(pdfData, 'purchaseCertificate');
//                 const pdfPath = await compilePurchaseReceipt.generatePdf(pdfData, certificateName);

//                 // Optionally send the PDF data to WebSocket clients or perform other actions
//                 if(pdfPath){
//                     console.log("Printing pdf path: ", pdfPath);
//                     console.log(`PDF generated successfully for purchase ID ${purchaseData.purchase_id}`);
//                     res.download(pdfPath);
//                 }
//             } catch (error) {
//                 console.error(`Error processing purchase ID ${purchaseData.purchase_id}:`, error);
//                 return res.status(500).json({ error: `Failed to update purchase ID ${purchaseData.purchase_id}` });
//             }
//         }

//         // res.status(200).json({ message: "All purchases updated and PDFs regenerated successfully!" });
//     } catch (error) {
//         console.error("Unexpected error:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });

// router.put('/updatePurchases', async (req, res) => {
//     try {
//         const dataArray = req.body; // Expecting an array of objects

//         console.log(dataArray);

//         if (!Array.isArray(dataArray) || dataArray.length === 0) {
//             return res.status(400).json({ error: "Request body must be a non-empty array of objects" });
//         }

//         // Database connection transaction
//         // const connection = await twt.getConnection();
//         // await connection.beginTransaction();

//         const updateQuery = `UPDATE purchases SET ? WHERE purchase_id=?`;
//         const selectQuery = `
//             SELECT pur.purchase_id, pur.mass, pur.sample_and_company_number, pur.company_name, pur.price_per_kg, pur.total_amount, pur.purchase_date, pur.rma_frw, pur.total_minus_rma_usd, pur.ta_purchase_id, 
//             COALESCE(purSet.exchange_rate_frw_to_usd, lastSet.exchange_rate_frw_to_usd) AS exchange_rate_frw_to_usd, 
//             COALESCE(purSet.ta_rma_fees_frw_per_kg, lastSet.ta_rma_fees_frw_per_kg) AS ta_rma_fees_frw_per_kg,
//             comp.tin, reg.material, reg.number_of_bags
//             FROM purchases pur
//             INNER JOIN companies comp ON pur.company_name = comp.company_name
//             INNER JOIN registrations reg ON reg.sample_number=pur.sample_number
//             LEFT JOIN purchasing_settings purSet 
//                 ON pur.purchase_date = purSet.date
//             LEFT JOIN (
//                 SELECT * FROM purchasing_settings 
//                 ORDER BY date DESC 
//                 LIMIT 1
//             ) lastSet ON purSet.date IS NULL WHERE pur.purchase_id=?;
//         `;

//         const materialMapping = {
//             "Ta": { idField: "ta_purchase_id", rmaField: "ta_rma_fees_frw_per_kg" },
//             "W": { idField: "wo3_purchase_id", rmaField: "w_rma_fees_frw_per_kg" },
//             "Sn": { idField: "sn_purchase_id", rmaField: "sn_rma_fees_frw_per_kg" },
//             "Be": { idField: "be_purchase_id", rmaField: "be_rma_fees_frw_per_kg" },
//             "Li": { idField: "li_purchase_id", rmaField: "li_rma_fees_frw_per_kg" },
//         };

//         let generatedPdfs = [];

//         for (const purchaseData of dataArray) {
//             try {
//                 // Update the purchase
//                 await new Promise((resolve, reject) => {
//                     twt.query(updateQuery, [purchaseData, purchaseData.purchase_id], (err) => {
//                         if (err) {
//                             console.error(`Error updating purchase ID ${purchaseData.purchase_id}:`, err);
//                             return reject(err);
//                         }
//                         console.log("The purchase data was successfully updated!");
//                         resolve();
//                     });
//                 });
//                 // await twt.query(updateQuery, [purchaseData, purchaseData.purchase_id]);

//                 // Fetch the updated purchase data
//                 // const [purchase] = await twt.query(selectQuery, [purchaseData.purchase_id]);
//                 let sample_and_company_number = "";
//                 const updatedPurchase = await new Promise((resolve, reject) => {
//                     twt.query(selectQuery, [purchaseData.purchase_id], (err, purchase) => {
//                         if (err) {
//                             console.error(`Error fetching updated data for purchase ID ${purchaseData.purchase_id}:`, err);
//                             return reject(err);
//                         }
//                         sample_and_company_number = purchase[0].sample_and_company_number;
//                         ta_purchase_id = purchase[0].ta_purchase_id;
//                         resolve(purchase[0]);
//                     });
//                 });

//                 if (!updatedPurchase || updatedPurchase.length === 0) {
//                     throw new Error(`No data found for purchase ID ${purchaseData.purchase_id}`);
//                 }

//                 // const updatedPurchase = purchase[0];
//                 // const sample_and_company_number = updatedPurchase.sample_and_company_number;

//                 console.log("Updated Purchase: ", updatedPurchase);

//                 // Add a check before accessing materialMapping[purchaseData.material_name]
//                 if (!purchaseData.material_name || !materialMapping[purchaseData.material_name]) {
//                     throw new Error(`Invalid or missing material name: ${purchaseData.material_name}`);
//                 }
                
//                 // Get correct purchase_number and rma_fees_frw_per_kg based on material
//                 const materialData = materialMapping[purchaseData.material_name];
//                 if (!materialData) {
//                     throw new Error(`Invalid material name: ${purchaseData.material_name}`);
//                 }

//                 const purchase_number = updatedPurchase[materialData.idField];
//                 const rma_fees_frw_per_kg = updatedPurchase[materialData.rmaField];

//                 console.log("Purchase Number: ", purchase_number);

//                 let pdfData = {
//                     purchase_number: purchase_number,
//                     material_type: purchaseData.material_name,
//                     material_name: purchaseData.material_name,
//                     purchase_mass: updatedPurchase.mass,
//                     company_name: updatedPurchase.company_name,
//                     tin: updatedPurchase.tin,
//                     price_usd_per_kg: purchaseData.price_per_kg,
//                     total_amount_usd: purchaseData.total_amount,
//                     date: moment(updatedPurchase.purchase_date).format('DD.MM.YYYY'),
//                     exchange_rate_rwf_usd: updatedPurchase.exchange_rate_frw_to_usd || "1335",
//                     rma_payment_rwf_per_kg: rma_fees_frw_per_kg || "125",
//                     rma_payment_total_rwf: updatedPurchase.rma_frw,
//                     rma_payment_three_percent_usd: "728.6",
//                     rma_payment_three_percent_rwf: "973 409.6",
//                     client_net_payment: updatedPurchase.total_minus_rma_usd,
//                 };

//                 // **Newly added detailed_lots_obj update**
//                 let detailed_lots_obj = {
//                     purchase_number: purchase_number,
//                     date: purchaseData.purchase_date,
//                     company_name: purchaseData.company_name,
//                     mass: purchaseData.mass,
//                     material_name: purchaseData.material_name,
//                     material_percentage: purchaseData.material_percentage,
//                     price_per_kg: purchaseData.price_per_kg,
//                     amount_in_usd: purchaseData.total_amount,
//                     Nb2o5: purchaseData.Nb2o5,
//                     bq_per_kg: purchaseData.bq_per_kg,
//                     mtu: purchaseData.mtu,
//                     lme: purchaseData.lme,
//                     tc: purchaseData.tc
//                 };

//                 try {
//                     await fetch('http://localhost:4000/updateDetailedLotsFromPurchase', {
//                         method: 'PUT',
//                         headers: { 'Content-Type': 'application/json' },
//                         body: JSON.stringify(detailed_lots_obj)
//                     });
//                 } catch (fetchError) {
//                     console.error(`Failed to update detailed lots for purchase ID ${purchaseData.purchase_id}:`, fetchError);
//                 }

//                 console.log("PDF Data: ", pdfData);

//                 let certificateName = `purchasingCert_${purchaseData.material_name}_${sample_and_company_number}`;
//                 const pdfPath = await compilePurchaseReceipt.generatePdf(pdfData, certificateName);

//                 if (pdfPath) {
//                     console.log("PDF generated successfully: ", pdfPath);
//                     generatedPdfs.push(pdfPath);
//                 }
//             } catch (error) {
//                 console.error(`Error processing purchase ID ${purchaseData.purchase_id}:`, error);
//                 // await twt.rollback();
//                 return res.status(500).json({ error: `Failed to update purchase ID ${purchaseData.purchase_id}` });
//             }
//         }

//         // await connection.commit();
//         // connection.release();

//         if (generatedPdfs.length > 0) {
//             return res.status(200).json({ message: "All purchases updated and PDFs generated successfully!", pdfs: generatedPdfs });
//         } else {
//             return res.status(200).json({ message: "All purchases updated, but no PDFs were generated." });
//         }

//     } catch (error) {
//         console.error("Unexpected error:", error);
//         return res.status(500).json({ error: "Internal Server Error" });
//     }
// });

router.put('/updatePurchase', async (req, res) => {
    try {
        const purchaseData = req.body; // Expecting a single object

        console.log(purchaseData);

        if (!purchaseData || typeof purchaseData !== "object") {
            return res.status(400).json({ error: "Request body must be a valid purchase object" });
        }

        const updateQuery = `UPDATE purchases SET ? WHERE purchase_id=?`;
        const selectQuery = `
            SELECT pur.purchase_id, pur.mass, pur.sample_and_company_number, pur.company_name, pur.price_per_kg, pur.total_amount, pur.purchase_date, pur.rma_frw, pur.total_minus_rma_usd, pur.ta_purchase_id, 
            COALESCE(purSet.exchange_rate_frw_to_usd, lastSet.exchange_rate_frw_to_usd) AS exchange_rate_frw_to_usd, 
            COALESCE(purSet.ta_rma_fees_frw_per_kg, lastSet.ta_rma_fees_frw_per_kg) AS ta_rma_fees_frw_per_kg,
            comp.tin, reg.material, reg.number_of_bags
            FROM purchases pur
            INNER JOIN companies comp ON pur.company_name = comp.company_name
            INNER JOIN registrations reg ON reg.sample_number=pur.sample_number
            LEFT JOIN purchasing_settings purSet 
                ON pur.purchase_date = purSet.date
            LEFT JOIN (
                SELECT * FROM purchasing_settings 
                ORDER BY date DESC 
                LIMIT 1
            ) lastSet ON purSet.date IS NULL WHERE pur.purchase_id=?;
        `;

        const materialMapping = {
            "Ta": { idField: "ta_purchase_id", rmaField: "ta_rma_fees_frw_per_kg" },
            "W": { idField: "wo3_purchase_id", rmaField: "w_rma_fees_frw_per_kg" },
            "Sn": { idField: "sn_purchase_id", rmaField: "sn_rma_fees_frw_per_kg" },
            "Be": { idField: "be_purchase_id", rmaField: "be_rma_fees_frw_per_kg" },
            "Li": { idField: "li_purchase_id", rmaField: "li_rma_fees_frw_per_kg" },
        };

        try {
            // Update the purchase
            await new Promise((resolve, reject) => {
                twt.query(updateQuery, [purchaseData, purchaseData.purchase_id], (err) => {
                    if (err) {
                        console.error(`Error updating purchase ID ${purchaseData.purchase_id}:`, err);
                        return reject(err);
                    }
                    console.log("The purchase data was successfully updated!");
                    resolve();
                });
            });

            // Fetch the updated purchase data
            let sample_and_company_number = "";
            const updatedPurchase = await new Promise((resolve, reject) => {
                twt.query(selectQuery, [purchaseData.purchase_id], (err, purchase) => {
                    if (err) {
                        console.error(`Error fetching updated data for purchase ID ${purchaseData.purchase_id}:`, err);
                        return reject(err);
                    }
                    if (!purchase || purchase.length === 0) {
                        return reject(new Error(`No data found for purchase ID ${purchaseData.purchase_id}`));
                    }

                    sample_and_company_number = purchase[0].sample_and_company_number;
                    resolve(purchase[0]);
                });
            });

            console.log("Updated Purchase: ", updatedPurchase);

            // Validate material name
            if (!purchaseData.material_name || !materialMapping[purchaseData.material_name]) {
                throw new Error(`Invalid or missing material name: ${purchaseData.material_name}`);
            }

            // Get correct purchase_number and rma_fees_frw_per_kg based on material
            const materialData = materialMapping[purchaseData.material_name];
            const purchase_number = updatedPurchase[materialData.idField];
            const rma_fees_frw_per_kg = updatedPurchase[materialData.rmaField];

            console.log("Purchase Number: ", purchase_number);

            let pdfData = {
                purchase_number: purchase_number,
                material_type: purchaseData.material_name,
                material_name: purchaseData.material_name,
                purchase_mass: updatedPurchase.mass,
                company_name: updatedPurchase.company_name,
                tin: updatedPurchase.tin,
                price_usd_per_kg: purchaseData.price_per_kg,
                total_amount_usd: purchaseData.total_amount,
                date: moment(updatedPurchase.purchase_date).format('DD.MM.YYYY'),
                exchange_rate_rwf_usd: updatedPurchase.exchange_rate_frw_to_usd || "1335",
                rma_payment_rwf_per_kg: rma_fees_frw_per_kg || "125",
                rma_payment_total_rwf: updatedPurchase.rma_frw,
                rma_payment_three_percent_usd: "728.6",
                rma_payment_three_percent_rwf: "973 409.6",
                client_net_payment: updatedPurchase.total_minus_rma_usd,
            };

            let detailed_lots_obj = {
                purchase_number: purchase_number,
                date: purchaseData.purchase_date,
                company_name: purchaseData.company_name,
                mass: purchaseData.mass,
                material_name: purchaseData.material_name,
                material_percentage: purchaseData.material_percentage,
                price_per_kg: purchaseData.price_per_kg,
                amount_in_usd: purchaseData.total_amount,
                Nb2o5: purchaseData.Nb2o5,
                bq_per_kg: purchaseData.bq_per_kg,
                mtu: purchaseData.mtu,
                lme: purchaseData.lme,
                tc: purchaseData.tc
            };

            try {
                await fetch('http://localhost:4000/updateDetailedLotsFromPurchase', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(detailed_lots_obj)
                });
            } catch (fetchError) {
                console.error(`Failed to update detailed lots for purchase ID ${purchaseData.purchase_id}:`, fetchError);
            }

            console.log("PDF Data: ", pdfData);

            let certificateName = `purchasingCert_${purchaseData.material_name}_${sample_and_company_number}`;
            const pdfPath = await compilePurchaseReceipt.generatePdf(pdfData, certificateName);

            if (pdfPath) {
                console.log("PDF generated successfully: ", pdfPath);
                res.download(pdfPath);
            } else {
                return res.status(200).json({ message: "Purchase updated, but no PDF was generated." });
            }
        } catch (error) {
            console.error(`Error processing purchase ID ${purchaseData.purchase_id}:`, error);
            return res.status(500).json({ error: `Failed to update purchase ID ${purchaseData.purchase_id}` });
        }
    } catch (error) {
        console.error("Unexpected error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});



router.get('/getLastPurchaseMaterialNumber', async (req, res) => {
    try {
        let material_name = req.query.material_name;
        let query = ``;

        console.log("Printing material_name (394): ", material_name);

        // Build the query based on the material name
        if (material_name === "Ta") {
            query = `SELECT purchase_id, material_name, ta_purchase_id FROM purchases WHERE ta_purchase_id IS NOT NULL ORDER BY purchase_id DESC LIMIT 1;`;
        } else if (material_name === "W") {
            query = `SELECT purchase_id, material_name, wo3_purchase_id FROM purchases WHERE wo3_purchase_id IS NOT NULL ORDER BY purchase_id DESC LIMIT 1;`;
        } else if (material_name === "Sn") {
            query = `SELECT purchase_id, material_name, sn_purchase_id FROM purchases WHERE sn_purchase_id IS NOT NULL ORDER BY purchase_id DESC LIMIT 1;`;
        } else if (material_name === "Be") {
            query = `SELECT purchase_id, material_name, be_purchase_id FROM purchases WHERE be_purchase_id IS NOT NULL ORDER BY purchase_id DESC LIMIT 1;`;
        } else if (material_name === "Li") {
            query = `SELECT purchase_id, material_name, li_purchase_id FROM purchases WHERE li_purchase_id IS NOT NULL ORDER BY purchase_id DESC LIMIT 1;`;
        }

        twt.query(query, async (err, purchase) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Database query error" });
            }

            // Check if purchase is an empty array
            if (!purchase || purchase.length === 0) {
                try {
                    // Fetch the last purchase_id from the table
                    const fallbackQuery = `SELECT purchase_id FROM purchases ORDER BY purchase_id DESC LIMIT 1;`;
                    twt.query(fallbackQuery, (err, fallbackResult) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ error: "Database query error for fallback" });
                        }

                        // If fallbackResult is empty, handle no purchases in table
                        const lastPurchaseId = fallbackResult.length > 0 ? fallbackResult[0].purchase_id : 0;

                        const fallbackPurchase = [
                            {
                                purchase_id: lastPurchaseId,
                                material_name: material_name,
                                [`${material_name.toLowerCase()}_purchase_id`]: 0
                            }
                        ];

                        return res.status(200).json(fallbackPurchase);
                    });
                } catch (error) {
                    console.error(error);
                    return res.status(500).json({ error: "Error fetching fallback purchase ID" });
                }
            } else {
                // Return the actual purchase result
                res.status(200).json(purchase);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/get_Purchase_Sample_Number_By_Date', async (req, res) => {
    const date = req.query.date;
    console.log(date);
    try {
        let query = `SELECT DISTINCT pur.sample_number FROM purchases pur WHERE pur.results_date = ?`;
        twt.query(query, [date], (err, result) => {
            res.json({sampleNumbers: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/get_Purchase_By_Sample_Number', async (req, res) => {
    const sample_number = req.query.sample_number;
    try {
        let query = `SELECT * FROM purchases WHERE sample_number=?`;
        twt.query(query, [sample_number], (err, purchase) => {
            if(err){
                console.error(err);
            }

            res.json({purchase: purchase})
        })
    } catch (error) {
        console.error(error);
    }
})

router.get('/get_Purchase_Info_By_Sample_Number', async (req, res) => {
    try {
        const sample_number = req.query.sample_number;
        const resultFromLab = req.query.resultFromLab || 'TWT'; // Default to TWT if not provided
        const labPrefix = resultFromLab.toLowerCase(); // Convert to lowercase for consistency

        // Construct the query dynamically
        const query = `
            SELECT
                reg.company_name, reg.mass, reg.material,
                res.${labPrefix}_ta2o5, res.${labPrefix}_wo3, res.${labPrefix}_sn, 
                res.${labPrefix}_be, res.${labPrefix}_li,
                c.tunnels, c.district
            FROM registrations reg
            JOIN results res ON reg.registration_id = res.registration_id
            JOIN companies c ON reg.company_name = c.company_name
            WHERE reg.sample_number = ?;
        `;

        // Execute query
        twt.query(query, [sample_number], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            let modifiedResult = [];

            result.forEach(item => {
                let material_percentage = 0;

                switch (item.material) {
                    case "Ta":
                        material_percentage = item[`${labPrefix}_ta2o5`] || 0;
                        break;
                    case "Sn":
                        material_percentage = item[`${labPrefix}_sn`] || 0;
                        break;
                    case "SN":
                        material_percentage = item[`${labPrefix}_sn`] || 0;
                        break;
                    case "WO3":
                        material_percentage = item[`${labPrefix}_wo3`] || 0;
                        break;
                    case "W":
                        material_percentage = item[`${labPrefix}_wo3`] || 0;
                        break;
                    case "Be":
                        material_percentage = item[`${labPrefix}_be`] || 0;
                        break;
                    case "Li":
                        material_percentage = item[`${labPrefix}_li`] || 0;
                        break;
                }

                modifiedResult.push({
                    company_name: item.company_name,
                    mass: item.mass,
                    material_name: item.material,
                    material_percentage: material_percentage,
                    tunnels: item.tunnels
                });
            });

            res.json({ purchases: modifiedResult });
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// === get purchases by date ===

router.get('/getPurchasesByDate', async (req, res) => {
    try {
        const date = req.query.date;
        const material_name = req.query.material_name;
        // const query = `select * from purchases where purchase_date=?;`
        const query = `SELECT pur.purchase_id, pur.sample_number, pur.sample_and_company_number, pur.purchase_date, pur.results_date, pur.company_name, pur.company_tunnel, pur.mass, pur.material_name, pur.material_percentage, pur.price_per_kg, pur.total_amount, pur.itsci_mine_site_number, pur.rma_frw, pur.rma_usd, pur.total_minus_rma_usd, pur.usd_per_pound, pur.ta_purchase_id, pur.wo3_purchase_id, pur.sn_purchase_id
                    FROM purchases pur WHERE material_name = '${material_name}' AND pur.purchase_date='${date}';`

        twt.query(query, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            let modifiedResult = [];
            

            res.json({purchases: result})
            // res.json({purchases: modifiedResult})
        })
    } catch (error) {
        console.error(error);
    }
});

// === Delete purchase for today by purchase ID ===
router.delete("/deletePurchaseForToday/:purchaseId", async (req, res) => {
    try {
        const purchaseId = req.params.purchaseId;

        if (!purchaseId) {
            return res.status(400).json({ error: "Missing purchase ID" });
        }

        const todayDate = moment().format("YYYY-MM-DD");

        // Step 1: Fetch the purchase_date and material_name for the given purchase_id
        const selectQuery = `SELECT purchase_date, material_name, ta_purchase_id, wo3_purchase_id, sn_purchase_id, be_purchase_id, li_purchase_id FROM purchases WHERE purchase_id = ?`;
        const purchase = await new Promise((resolve, reject) => {
            twt.query(selectQuery, [purchaseId], (err, results) => {
                if (err) {
                    console.error(`Error fetching purchase date for ID ${purchaseId}:`, err);
                    return reject(err);
                }
                resolve(results[0]);
            });
        });

        if (!purchase) {
            return res.status(404).json({ error: `No purchase found with ID ${purchaseId}` });
        }

        const purchaseDate = moment(purchase.purchase_date).format("YYYY-MM-DD");

        if (purchaseDate !== todayDate) {
            return res.status(403).json({ error: `Purchase ID ${purchaseId} has an earlier date (${purchaseDate}) and cannot be deleted.` });
        }

        // Determine the correct purchase number based on material_name
        let purchase_number = "";
        switch (purchase.material_name) {
            case "Ta":
                purchase_number = purchase.ta_purchase_id;
                break;
            case "W":
                purchase_number = purchase.wo3_purchase_id;
                break;
            case "Sn":
                purchase_number = purchase.sn_purchase_id;
                break;
            case "Be":
                purchase_number = purchase.be_purchase_id;
                break;
            case "Li":
                purchase_number = purchase.li_purchase_id;
                break;
            default:
                return res.status(400).json({ error: "Invalid material name" });
        }

        // Step 2: Proceed with deletion
        const deleteQuery = `DELETE FROM purchases WHERE purchase_id = ?`;
        await new Promise((resolve, reject) => {
            twt.query(deleteQuery, [purchaseId], (err) => {
                if (err) {
                    console.error(`Error deleting purchase ID ${purchaseId}:`, err);
                    return reject(err);
                }
                resolve();
            });
        });

        // Send request to delete detailed lots
        let detailed_lots_obj = {
            purchase_id: purchase_number,
            material_name: purchase.material_name
        };

        await fetch('http://localhost:4000/deleteDetailedLotsFromPurchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(detailed_lots_obj)
        });

        res.status(200).json({ message: `Purchase ID ${purchaseId} deleted successfully.` });

    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.delete("/deletePurchase/:purchaseId", async (req, res) => {
    try {
        const purchaseId = req.params.purchaseId;

        if (!purchaseId) {
            return res.status(400).json({ error: "Missing purchase ID" });
        }

        // Step 1: Fetch the purchase details
        const selectQuery = `SELECT purchase_id, material_name, ta_purchase_id, wo3_purchase_id, sn_purchase_id, be_purchase_id, li_purchase_id FROM purchases WHERE purchase_id = ?`;
        const purchase = await new Promise((resolve, reject) => {
            twt.query(selectQuery, [purchaseId], (err, results) => {
                if (err) {
                    console.error(`Error fetching purchase for ID ${purchaseId}:`, err);
                    return reject(err);
                }
                resolve(results[0]);
            });
        });

        if (!purchase) {
            return res.status(404).json({ error: `No purchase found with ID ${purchaseId}` });
        }

        // Determine the correct purchase number based on material_name
        let purchase_number = "";
        switch (purchase.material_name) {
            case "Ta":
                purchase_number = purchase.ta_purchase_id;
                break;
            case "W":
                purchase_number = purchase.wo3_purchase_id;
                break;
            case "Sn":
                purchase_number = purchase.sn_purchase_id;
                break;
            case "Be":
                purchase_number = purchase.be_purchase_id;
                break;
            case "Li":
                purchase_number = purchase.li_purchase_id;
                break;
            default:
                return res.status(400).json({ error: "Invalid material name" });
        }

        // Step 2: Proceed with deletion
        const deleteQuery = `DELETE FROM purchases WHERE purchase_id = ?`;
        await new Promise((resolve, reject) => {
            twt.query(deleteQuery, [purchaseId], (err) => {
                if (err) {
                    console.error(`Error deleting purchase ID ${purchaseId}:`, err);
                    return reject(err);
                }
                resolve();
            });
        });

        // Send request to delete detailed lots
        let detailed_lots_obj = {
            purchase_id: purchase_number,
            material_name: purchase.material_name
        };

        await fetch('http://localhost:4000/deleteDetailedLotsFromPurchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(detailed_lots_obj)
        });

        res.status(200).json({ message: `Purchase ID ${purchaseId} deleted successfully.` });

    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;