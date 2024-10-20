const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');

const express = require('express');
const router = express.Router();

const moment = require('moment');

const { twt } = require('../../configs/mysql');

// === Import from excel ===
router.post('/importLotsFromExcel', async (req, res) => {
    let ta_data = await getExcelLotsData("../../formattedLotsTa.xlsx");
    let w_data = await getExcelLotsData("../../formattedLotsW.xlsx");
    let sn_data = await getExcelLotsData("../../formattedLotsSn.xlsx");

    let formattedLotsTa = [];
    let formattedLotsW = [];
    let formattedLotsSn = [];

    ta_data.forEach(item => {
        formattedLotsTa.push({
            category: item.Category,
            purchase_numbers: item.purchase_ids,
            forming_date: item.FormingDate,
            calc_mass: item.CalcMass,
            material_name: "TA",
            material_percentage_average: item.CalcTa2O5,
            radiation_percentage_average: item.RTa2O5,
            comments: "",
            price_per_kg: item.price_per_kg,
            amount_in_usd: item.total_amount,
            lot_number: item.lot_id,
            chim: 0
        })
    });

    w_data.forEach(item => {
        formattedLotsW.push({
            category: item.Category,
            purchase_numbers: item.purchase_ids,
            forming_date: item.FormingDate,
            calc_mass: item.CalcMass,
            material_name: "W",
            material_percentage_average: item.CalcWO3,
            radiation_percentage_average: item.RWO3,
            comments: "",
            price_per_kg: item.price_per_kg,
            amount_in_usd: item.total_amount,
            lot_number: item.lot_id,
            chim: 0
        })
    });

    sn_data.forEach(item => {
        formattedLotsSn.push({
            category: item.Category,
            purchase_numbers: item.purchase_ids,
            forming_date: item.FormingDate,
            calc_mass: item.CalcMass,
            material_name: "Sn",
            material_percentage_average: item.CalcSn,
            radiation_percentage_average: item.RSn,
            comments: "",
            price_per_kg: item.price_per_kg,
            amount_in_usd: item.total_amount,
            lot_number: item.lot_id,
            chim: 0
        })
    });

    let formattedLots = [...formattedLotsTa, ...formattedLotsW, ...formattedLotsSn];
    formattedLots.sort((a, b) => {
        return moment(a.forming_date).isBefore(moment(b.forming_date)) ? -1 : 1;
    });

    const insertQuery = `INSERT INTO lots (category, purchase_numbers, forming_date, calc_mass, material_name, material_percentage_average, radiation_percentage_average, comments, price_per_kg, amount_in_usd, lot_number, chim) VALUES ?`;

    const values = formattedLots.map(lot => [lot.category, lot.purchase_numbers, lot.forming_date, lot.calc_mass, lot.material_name, lot.material_percentage_average, lot.radiation_percentage_average, lot.comments, lot.price_per_kg, lot.amount_in_usd, lot.lot_number, lot.chim]);

    twt.query(insertQuery, [values], (err, lot) => {
        if(err){
            console.error(err);
        }

        res.json({"message": "successfully imported all purchases!"});
    })
})


router.post('/importDetailedLotsFromExcel', async (req, res) => {
    try {
        let ta_data = await getDetailedLotsData("../../formattedLotsTa.xlsx");
        let w_data = await getDetailedLotsData("../../formattedLotsW.xlsx");
        let sn_data = await getDetailedLotsData("../../formattedLotsSn.xlsx");

        let formattedDetailedLotsTa = [];
        let formattedDetailedLotsW = [];
        let formattedDetailedLotsSn = [];

        ta_data.forEach(item => {
            formattedDetailedLotsTa.push({
                lot_number: item.lot_id,
                purchase_number: item.purchase_id,
                date: item.date,
                company_name: item.company_name,
                mass: item.mass,
                material_name: "TA",
                material_percentage: item.TaO5,
                price_per_kg: item.price_per_kg,
                comments: item.Comments,
                amount_in_usd: item.total_amount,
                Nb2o5: item.Nb,
                bq_per_gram: item.Bq
            })
        });
        w_data.forEach(item => {
            formattedDetailedLotsW.push({
                lot_number: item.lot_id,
                purchase_number: item.purchase_id,
                date: item.date,
                company_name: item.company_name,
                mass: item.mass,
                material_name: "W",
                material_percentage: item.WO3,
                price_per_kg: item.price_per_kg,
                comments: item.Comments,
                amount_in_usd: item.total_amount
            })
        });
        sn_data.forEach(item => {
            formattedDetailedLotsSn.push({
                lot_number: item.lot_id,
                purchase_number: item.purchase_id,
                date: item.date,
                company_name: item.company_name,
                mass: item.mass,
                material_name: "Sn",
                material_percentage: item.SnO2,
                price_per_kg: item.price_per_kg,
                comments: item.Comments,
                amount_in_usd: item.total_amount
            })
        });

        let formattedDetailedLots = [...formattedDetailedLotsTa, ...formattedDetailedLotsW, ...formattedDetailedLotsSn];
        formattedDetailedLots.sort((a, b) => {
            return moment(a.date).isBefore(moment(b.date)) ? -1 : 1;
        });

        const insertQuery = `INSERT INTO detailed_lots (lot_number, purchase_number, date, company_name, mass, material_name, material_percentage, price_per_kg, comments, amount_in_usd, Nb2o5, bq_per_gram) VALUES ?`;

        const values = formattedDetailedLots.map(detailed_lot => [detailed_lot.lot_number, detailed_lot.purchase_number, detailed_lot.date, detailed_lot.company_name, detailed_lot.mass, detailed_lot.material_name, detailed_lot.material_percentage, detailed_lot.price_per_kg, detailed_lot.comments, detailed_lot.amount_in_usd, detailed_lot.Nb2o5, detailed_lot.bq_per_gram]);

        twt.query(insertQuery, [values], (err, lot) => {
            if(err){
                console.error(err);
            }

            res.json({"message": "successfully imported all detailed lots!"});
        })

    } catch (error) {
        console.error(error);
    }
})
// =========================

async function getExcelLotsData(file_path){
    // Read the Excel file
    const xlsx = require('xlsx');
    const workbook = xlsx.readFile(path.join(__dirname, file_path));

    // Get the first sheet
    const sheetName = workbook.SheetNames[2]; // Get the name of the 3rd sheet
    const sheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON
    const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

    return jsonData;
}

async function combinePurchasesAndLotsData(file_path){
    const xlsx = require('xlsx');

    // Read the Excel file
    const workbook = xlsx.readFile(path.join(__dirname, file_path));

    // Get Sheet 1 and Sheet 2
    const sheet1Name = workbook.SheetNames[0]; // Adjust if the sheet order is different
    const sheet2Name = workbook.SheetNames[1];

    const sheet1 = workbook.Sheets[sheet1Name];
    const sheet2 = workbook.Sheets[sheet2Name];

    // Convert both sheets to JSON for easier manipulation
    const sheet1Data = xlsx.utils.sheet_to_json(sheet1);
    const sheet2Data = xlsx.utils.sheet_to_json(sheet2);

    // Create a mapping of lot_ids to purchase_ids (handling multiple purchase_ids)
    const lotIdToPurchaseIdsMap = {};
    sheet1Data.forEach(row => {
        const lotId = row['lot_id']; // Adjust column name if needed
        const purchaseId = row['purchase_id']; // Adjust column name if needed
        
        // If the lot_id already exists, push the new purchase_id to the array
        if (lotIdToPurchaseIdsMap[lotId]) {
            lotIdToPurchaseIdsMap[lotId].push(purchaseId);
        } else {
            // If the lot_id doesn't exist, initialize the array with the first purchase_id
            lotIdToPurchaseIdsMap[lotId] = [purchaseId];
        }
    });

    // Create a new array for Sheet 3 that includes the purchase_ids (joined by a space)
    const sheet3Data = sheet2Data.map(row => {
        const lotId = row['lot_id']; // Adjust column name if needed
        const newRow = { ...row }; // Create a copy of the row
        
        // If the lot_id exists in the map, join the purchase_ids with a space
        if (lotIdToPurchaseIdsMap[lotId]) {
            newRow['purchase_ids'] = lotIdToPurchaseIdsMap[lotId].join(' '); // Join purchase_ids by space
        } else {
            newRow['purchase_ids'] = null; // If no match, add null
        }
        
        return newRow;
    });

    // Convert the updated data for Sheet 3 back to worksheet format
    const sheet3 = xlsx.utils.json_to_sheet(sheet3Data);

    // Add the new sheet (Sheet 3) to the workbook
    const sheet3Name = 'Sheet3'; // You can name it anything
    xlsx.utils.book_append_sheet(workbook, sheet3, sheet3Name);

    // Write the updated workbook with the new sheet to a new file (or overwrite the existing one)
    xlsx.writeFile(workbook, path.join(__dirname, '../../formattedLotsW.xlsx'));
}


async function getDetailedLotsData(file_path){
    const xlsx = require('xlsx');
    const workbook = xlsx.readFile(path.join(__dirname, file_path));

    // Get the first sheet
    const sheetName = workbook.SheetNames[0]; // Get the name of the 1st sheet
    const sheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON
    const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

    return jsonData;
}
module.exports = router;