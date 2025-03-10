const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');

const express = require('express');
const router = express.Router();

const moment = require('moment');

const ExcelJS = require('exceljs');

const { twt } = require('../../configs/mysql');

// === Import from excel ===
router.post('/downloadAllPurchases', async (req, res) => {
    try {
        // const material_name = req.body.material_name;
        const purchase_date = req.body.purchase_date;

        let currentDate = moment(new Date()).format('YYYY-MM-DD');
        // const query = `SELECT * FROM purchases WHERE material_name = '${material_name}' AND purchase_date = '${purchase_date}';`;
        const query = `SELECT * FROM detailed_lots;`;
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
    // const worksheet1 = workbook.addWorksheet('All Purchases');
    const worksheet2 = workbook.addWorksheet('Ta2o5');
    const worksheet3 = workbook.addWorksheet('Sno5');
    const worksheet4 = workbook.addWorksheet('Wo3');
    const worksheet5 = workbook.addWorksheet('Be');
    const worksheet6 = workbook.addWorksheet('Li');

    // Daily Purchases sheeet
    // worksheet1.columns = [
    //     { header: "Purchase No", key: 'purchase_number', width: 10 },
    //     { header: "Date", key: 'date', width: 10 },
    //     { header: "Name", key: 'company_name', width: 30 },
    //     { header: 'Mass, kg', key: 'mass', width: 10 },
    //     { header: 'Ta2o5', key: 'material_percentage', width: 10 },
    //     { header: 'Comments', key: 'comments', width: 20 },
    //     { header: 'Price, $/kg', key: 'price_per_kg', width: 10 },
    //     { header: 'Amount, $', key: 'amount_in_usd', width: 20 },
    //     { header: 'Lot #', key: 'lot_number', width: 10 }
    // ];

    // Ta2o5 sheet
    worksheet2.columns = [
        { header: "Purchase No", key: 'purchase_number', width: 10 },
        { header: "Date", key: 'date', width: 10 },
        { header: "Name", key: 'company_name', width: 30 },
        { header: 'Mass, kg', key: 'mass', width: 10 },
        { header: 'Ta2o5', key: 'material_percentage', width: 10 },
        { header: 'Comments', key: 'comments', width: 20 },
        { header: 'Price, $/kg', key: 'price_per_kg', width: 10 },
        { header: 'Amount, $', key: 'amount_in_usd', width: 20 },
        { header: 'Lot #', key: 'lot_number', width: 10 }
    ];

    // Sno2 sheet
    worksheet3.columns = [
        { header: "Purchase No", key: 'purchase_number', width: 10 },
        { header: "Date", key: 'date', width: 10 },
        { header: "Name", key: 'company_name', width: 30 },
        { header: 'Mass, kg', key: 'mass', width: 10 },
        { header: 'SnO2', key: 'material_percentage', width: 10 },
        { header: 'Comments', key: 'comments', width: 20 },
        { header: 'Price, $/kg', key: 'price_per_kg', width: 10 },
        { header: 'Amount, $', key: 'amount_in_usd', width: 20 },
        { header: 'Lot #', key: 'lot_number', width: 10 }
    ];

    //Wo3 sheet
    worksheet4.columns = [
        { header: "Purchase No", key: 'purchase_number', width: 10 },
        { header: "Date", key: 'date', width: 10 },
        { header: "Name", key: 'company_name', width: 30 },
        { header: 'Mass, kg', key: 'mass', width: 10 },
        { header: 'Wo3', key: 'material_percentage', width: 10 },
        { header: 'Comments', key: 'comments', width: 20 },
        { header: 'Price, $/kg', key: 'price_per_kg', width: 10 },
        { header: 'Amount, $', key: 'amount_in_usd', width: 20 },
        { header: 'Lot #', key: 'lot_number', width: 10 }
    ];
    
    //Beryllium sheet
    worksheet5.columns = [
        { header: "Purchase No", key: 'purchase_number', width: 10 },
        { header: "Date", key: 'date', width: 10 },
        { header: "Name", key: 'company_name', width: 30 },
        { header: 'Mass, kg', key: 'mass', width: 10 },
        { header: 'Beryllium', key: 'material_percentage', width: 10 },
        { header: 'Comments', key: 'comments', width: 20 },
        { header: 'Price, $/kg', key: 'price_per_kg', width: 10 },
        { header: 'Amount, $', key: 'amount_in_usd', width: 20 },
        { header: 'Lot #', key: 'lot_number', width: 10 }
    ];
    
    //Lithium sheet
    worksheet6.columns = [
        { header: "Purchase No", key: 'purchase_number', width: 10 },
        { header: "Date", key: 'date', width: 10 },
        { header: "Name", key: 'company_name', width: 30 },
        { header: 'Mass, kg', key: 'mass', width: 10 },
        { header: 'Lithium', key: 'material_percentage', width: 10 },
        { header: 'Comments', key: 'comments', width: 20 },
        { header: 'Price, $/kg', key: 'price_per_kg', width: 10 },
        { header: 'Amount, $', key: 'amount_in_usd', width: 20 },
        { header: 'Lot #', key: 'lot_number', width: 10 }
    ];

    // SELECT ta_purchase_id, company_name, mass, material_name, material_percentage, price_per_kg, total_amount, itsci_mine_site_number, rma_frw, rma_usd, usd_per_pound FROM purchases WHERE material_name = 'Ta' AND purchase_date = '2013-03-15';
    // Add columns to the worksheet

    // Adding rows to sheet1
    purchases.forEach(item => {
        if(item.material_name === "Ta"){
            // worksheet1.addRow({ 
            //     // purchase_id: item.ta_purchase_id,
            //     purchase_date: item.purchase_date,
            //     ta_material_percentage: Number(item.material_percentage),
            //     ta_mass: Number(item.mass),
            //     company_name: item.company_name,
            //     total_amount: Number(item.total_amount)
            // })
            worksheet2.addRow({
                purchase_number: item.purchase_number,
                date: item.date,
                company_name: item.company_name,
                mass: Number(item.mass),
                material_percentage: Number(item.material_percentage),
                price_per_kg: Number(item.price_per_kg),
                comments: "",
                amount_in_usd: Number(item.amount_in_usd),
                lot_number: Number(item.lot_number)
            })
        } else if (item.material_name === "Sn"){
            // worksheet1.addRow({ 
            //     // purchase_id: item.sn_purchase_id,
            //     purchase_date: item.purchase_date,
            //     company_name: item.company_name,
            //     sn_material_percentage: Number(item.material_percentage),
            //     sn_mass: Number(item.mass),
            //     total_amount: Number(item.total_amount),
            // })
            worksheet3.addRow({
                purchase_number: item.purchase_number,
                date: item.date,
                company_name: item.company_name,
                mass: Number(item.mass),
                material_percentage: Number(item.material_percentage),
                price_per_kg: Number(item.price_per_kg),
                comments: "",
                amount_in_usd: Number(item.amount_in_usd),
                lot_number: Number(item.lot_number)
            })
        } else if (item.material_name === "W"){
            // worksheet1.addRow({ 
            //     // purchase_id: item.w_purchase_id,
            //     purchase_date: item.purchase_date,
            //     company_name: item.company_name,
            //     w_material_percentage: Number(item.material_percentage),
            //     w_mass: Number(item.mass),
            //     total_amount: Number(item.total_amount)
            // })
            worksheet4.addRow({
                purchase_number: item.purchase_number,
                date: item.date,
                company_name: item.company_name,
                mass: Number(item.mass),
                material_percentage: Number(item.material_percentage),
                price_per_kg: Number(item.price_per_kg),
                comments: "",
                amount_in_usd: Number(item.amount_in_usd),
                lot_number: Number(item.lot_number)
            })
        } else if (item.material_name === "Be"){
            // worksheet1.addRow({ 
            //     // purchase_id: item.w_purchase_id,
            //     purchase_date: item.purchase_date,
            //     company_name: item.company_name,
            //     be_material_percentage: Number(item.material_percentage),
            //     be_mass: Number(item.mass),
            //     total_amount: Number(item.total_amount)
            // })
            worksheet5.addRow({
                purchase_number: item.purchase_number,
                date: item.date,
                company_name: item.company_name,
                mass: Number(item.mass),
                material_percentage: Number(item.material_percentage),
                price_per_kg: Number(item.price_per_kg),
                comments: "",
                amount_in_usd: Number(item.amount_in_usd),
                lot_number: Number(item.lot_number)
            })
        } else if (item.material_name === "Li"){
            // worksheet1.addRow({ 
            //     // purchase_id: item.w_purchase_id,
            //     purchase_date: item.purchase_date,
            //     company_name: item.company_name,
            //     li_material_percentage: Number(item.material_percentage),
            //     li_mass: Number(item.mass),
            //     total_amount: Number(item.total_amount)
            // })
            worksheet6.addRow({
                purchase_number: item.purchase_number,
                date: item.date,
                company_name: item.company_name,
                mass: Number(item.mass),
                material_percentage: Number(item.material_percentage),
                price_per_kg: Number(item.price_per_kg),
                comments: "",
                amount_in_usd: Number(item.amount_in_usd),
                lot_number: Number(item.lot_number)
            })
        }
    }); 

    // Save the workbook to a file
    let currentDate = moment(new Date()).format('YYYY-MM-DD');
    const filePath = path.join(__dirname, '..', '..', 'files', `AllPurchases_${currentDate}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    console.log(`Excel file created at ${filePath}`);

    return filePath;
}

module.exports = router;