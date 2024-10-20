const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');

const express = require('express');
const router = express.Router();

const moment = require('moment');

const ExcelJS = require('exceljs');

const { twt } = require('../../configs/mysql');

// === Import from excel ===
router.post('/exportDailyPurchasesToExcel', async (req, res) => {
    try {
        // const material_name = req.body.material_name;
        const purchase_date = req.body.purchase_date;

        let currentDate = moment(new Date()).format('YYYY-MM-DD');
        // const query = `SELECT * FROM purchases WHERE material_name = '${material_name}' AND purchase_date = '${purchase_date}';`;
        const query = `SELECT * FROM purchases WHERE purchase_date = '${purchase_date}';`;
        twt.query(query, async (err, purchases) => {
            if(err){
                console.error(err);
            }

            let excelPath = await createDailyPurchaseExcel(purchases);
            // let excelPath = await createDailyPurchaseExcel(purchases, material_name);

            console.log("Printing excelPath: ", excelPath);
            
            res.download(excelPath, `dailyPurchases_${currentDate}.xlsx`, (err) => {
                if (err) {
                    console.error('Error downloading the file:', err);
                    res.status(500).send('Failed to download file.');
                }
            });
            
        })
    } catch (error) {
        console.error(error);
    }

    
})
// =========================

async function createDailyPurchaseExcel(purchases){
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet1 = workbook.addWorksheet('Daily Purchases');
    const worksheet2 = workbook.addWorksheet('Ta2o5');
    const worksheet3 = workbook.addWorksheet('Sno5');
    const worksheet4 = workbook.addWorksheet('Wo3');

    // Daily Purchases sheeet
    worksheet1.columns = [
        // { header: 'Number', key: 'purchase_id', width: 20 },
        { header: "Ta", key: 'ta_material_percentage', width: 10 },
        { header: "Sn", key: 'sn_material_percentage', width: 10 },
        { header: "W", key: 'w_material_percentage', width: 10 },
        { header: 'Name', key: 'company_name', width: 30 },
        { header: 'Coltan kg', key: 'ta_mass', width: 10 },
        { header: 'Sn kg', key: 'sn_mass', width: 10 },
        { header: 'Wolfram Kg', key: 'w_mass', width: 10 },
        { header: 'Credit Cash', key: 'total_amount', width: 30 }
    ];

    // Ta2o5 sheet
    worksheet2.columns = [
        // { header: 'Number', key: 'purchase_id', width: 20 },
        { header: "Purchase No", key: 'ta_purchase_id', width: 10 },
        { header: "Date", key: 'purchase_date', width: 10 },
        { header: "Name", key: 'company_name', width: 30 },
        { header: 'Mass, kg', key: 'mass', width: 10 },
        { header: 'Ta2o5', key: 'ta_material_percentage', width: 10 },
        { header: 'Price, $/kg', key: 'price_per_kg', width: 10 },
        { header: 'Comments', key: 'comments', width: 20 },
        { header: 'Amount, $', key: 'total_amount', width: 20 },
        { header: 'Nb', key: 'Nb2O5', width: 20 },
        { header: 'Bq', key: 'bq_per_gram', width: 20 }
    ];

    // Sno2 sheet
    worksheet3.columns = [
        // { header: 'Number', key: 'purchase_id', width: 20 },
        { header: "Purchase No", key: 'sn_purchase_id', width: 10 },
        { header: "Date", key: 'purchase_date', width: 10 },
        { header: "Name", key: 'company_name', width: 30 },
        { header: 'Mass, kg', key: 'mass', width: 10 },
        { header: 'SnO2', key: 'sn_material_percentage', width: 10 },
        { header: 'Price, $/kg', key: 'price_per_kg', width: 10 },
        { header: 'Comments', key: 'comments', width: 20 },
        { header: 'Amount, $', key: 'total_amount', width: 20 }
    ];

    //Wo3 sheet
    worksheet4.columns = [
        // { header: 'Number', key: 'purchase_id', width: 20 },
        { header: "Purchase No", key: 'w_purchase_id', width: 10 },
        { header: "Date", key: 'purchase_date', width: 10 },
        { header: "Name", key: 'company_name', width: 30 },
        { header: 'Mass, kg', key: 'mass', width: 10 },
        { header: 'Wo3', key: 'w_material_percentage', width: 10 },
        { header: 'Price, $/kg', key: 'price_per_kg', width: 10 },
        { header: 'Comments', key: 'comments', width: 20 },
        { header: 'Amount, $', key: 'total_amount', width: 20 }
    ];

    // SELECT ta_purchase_id, company_name, mass, material_name, material_percentage, price_per_kg, total_amount, itsci_mine_site_number, rma_frw, rma_usd, usd_per_pound FROM purchases WHERE material_name = 'TA' AND purchase_date = '2013-03-15';
    // Add columns to the worksheet

    // Adding rows to sheet1
    purchases.forEach(item => {
        if(item.material_name === "TA"){
            worksheet1.addRow({ 
                // purchase_id: item.ta_purchase_id,
                ta_material_percentage: Number(item.material_percentage),
                ta_mass: Number(item.mass),
                company_name: item.company_name,
                total_amount: Number(item.total_amount)
            })
            worksheet2.addRow({
                ta_purchase_id: item.ta_purchase_id,
                purchase_date: item.purchase_date,
                company_name: item.company_name,
                mass: Number(item.mass),
                ta_material_percentage: Number(item.material_percentage),
                price_per_kg: Number(item.price_per_kg),
                comments: "",
                total_amount: Number(item.total_amount),
                Nb2O5: Number(item.Nb2O5),
                bq_per_gram: Number(item.bq_per_gram)
            })
        } else if (item.material_name === "Sn"){
            worksheet1.addRow({ 
                // purchase_id: item.sn_purchase_id,
                company_name: item.company_name,
                sn_material_percentage: Number(item.material_percentage),
                sn_mass: Number(item.mass),
                total_amount: Number(item.total_amount),
            })
            worksheet3.addRow({
                sn_purchase_id: item.sn_purchase_id,
                purchase_date: item.purchase_date,
                company_name: item.company_name,
                mass: Number(item.mass),
                sn_material_percentage: Number(item.material_percentage),
                price_per_kg: Number(item.price_per_kg),
                comments: "",
                total_amount: Number(item.total_amount)
            })
        }else if (item.material_name === "W"){
            worksheet1.addRow({ 
                // purchase_id: item.w_purchase_id,
                company_name: item.company_name,
                w_material_percentage: Number(item.material_percentage),
                w_mass: Number(item.mass),
                total_amount: Number(item.total_amount)
            })
            worksheet4.addRow({
                w_purchase_id: item.w_purchase_id,
                purchase_date: item.purchase_date,
                company_name: item.company_name,
                mass: Number(item.mass),
                w_material_percentage: Number(item.material_percentage),
                price_per_kg: Number(item.price_per_kg),
                comments: "",
                total_amount: Number(item.total_amount)
            })
        }
    }); 

    // Save the workbook to a file
    let currentDate = moment(new Date()).format('YYYY-MM-DD');
    const filePath = path.join(__dirname, '..', '..', 'files', `dailyPurchases_${currentDate}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    console.log(`Excel file created at ${filePath}`);

    return filePath;
}

// async function createDailyPurchaseExcel(purchases, material_name){
//     // Create a new workbook and add a worksheet
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Daily Purchases');

//     if(material_name === "TA"){
//         worksheet.columns = [
//             { header: 'Purchase Number', key: 'purchase_id', width: 20 },
//             { header: 'Company', key: 'company_name', width: 30 },
//             { header: 'Mass (Kg)', key: 'mass', width: 10 },
//             { header: material_name, key: 'material_percentage', width: 10 },
//             { header: 'Nb2O5', key: 'Nb2O5', width: 10 },
//             { header: 'Bq/g', key: 'bq_per_gram', width: 10 },
//             { header: 'Price / Kg', key: 'price_per_kg', width: 10 },
//             { header: 'Total Amount', key: 'total_amount', width: 30 },
//             { header: 'iTSCI mine site number', key: 'itsci_mine_site_number', width: 30 },
//             { header: 'RMA FRW', key: 'rma_frw', width: 10 },
//             { header: 'RMA USD', key: 'rma_usd', width: 10 },
//             { header: 'USD / lb', key: 'usd_per_pound', width: 10 }
//         ];
//     } else if (material_name !== "TA"){
//         worksheet.columns = [
//             { header: 'Purchase Number', key: 'purchase_id', width: 20 },
//             { header: 'Company', key: 'company_name', width: 30 },
//             { header: 'Mass (Kg)', key: 'mass', width: 10 },
//             { header: material_name, key: 'material_percentage', width: 10 },
//             { header: 'Price / Kg', key: 'price_per_kg', width: 10 },
//             { header: 'Total Amount', key: 'total_amount', width: 30 },
//             { header: 'iTSCI mine site number', key: 'itsci_mine_site_number', width: 30 },
//             { header: 'RMA FRW', key: 'rma_frw', width: 10 },
//             { header: 'RMA USD', key: 'rma_usd', width: 10 },
//             { header: 'USD / lb', key: 'usd_per_pound', width: 10 }
//         ];
//     }

//     // SELECT ta_purchase_id, company_name, mass, material_name, material_percentage, price_per_kg, total_amount, itsci_mine_site_number, rma_frw, rma_usd, usd_per_pound FROM purchases WHERE material_name = 'TA' AND purchase_date = '2013-03-15';
//     // Add columns to the worksheet

//     purchases.forEach(item => {
//         if(material_name === "TA"){
//             worksheet.addRow({ 
//                 purchase_id: item.ta_purchase_id,
//                 company_name: item.company_name,
//                 mass: item.mass,
//                 material_percentage: item.material_percentage,
//                 Nb2O5: item.Nb2O5,
//                 bq_per_gram: item.bq_per_gram,
//                 price_per_kg: item.price_per_kg,
//                 total_amount: item.total_amount,
//                 itsci_mine_site_number: item.itsci_mine_site_number,
//                 rma_frw: item.rma_frw,
//                 rma_usd: item.rma_usd,
//                 usd_per_pound: item.usd_per_pound
//             })
//         } else if (material_name === "W"){
//             worksheet.addRow({ 
//                 purchase_id: item.w_purchase_id,
//                 company_name: item.company_name,
//                 mass: item.mass,
//                 material_percentage: item.material_percentage,
//                 price_per_kg: item.price_per_kg,
//                 total_amount: item.total_amount,
//                 itsci_mine_site_number: item.itsci_mine_site_number,
//                 rma_frw: item.rma_frw,
//                 rma_usd: item.rma_usd,
//                 usd_per_pound: item.usd_per_pound
//             })
//         } else if (material_name === "Sn"){
//             worksheet.addRow({ 
//                 purchase_id: item.sn_purchase_id,
//                 company_name: item.company_name,
//                 mass: item.mass,
//                 material_percentage: item.material_percentage,
//                 price_per_kg: item.price_per_kg,
//                 total_amount: item.total_amount,
//                 itsci_mine_site_number: item.itsci_mine_site_number,
//                 rma_frw: item.rma_frw,
//                 rma_usd: item.rma_usd,
//                 usd_per_pound: item.usd_per_pound
//             })
//         }
//     });

//     // Save the workbook to a file
//     let currentDate = moment(new Date()).format('YYYY-MM-DD');
//     const filePath = path.join(__dirname, '..', '..', 'files', `dailyPurchases_${currentDate}.xlsx`);
//     await workbook.xlsx.writeFile(filePath);
//     console.log(`Excel file created at ${filePath}`);

//     return filePath;
// }

module.exports = router;