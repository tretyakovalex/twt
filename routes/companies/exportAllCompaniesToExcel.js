const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');

const express = require('express');
const router = express.Router();

const moment = require('moment');

const ExcelJS = require('exceljs');

const { twt } = require('../../configs/mysql');

// === Import from excel ===
router.post('/exportAllCompaniesToExcel', async (req, res) => {
    try {
        const query = `SELECT * FROM companies;`;
        
        let currentDate = moment(new Date()).format('YYYY-MM-DD');

        twt.query(query, async (err, companies) => {
            if(err){
                console.error(err);
            }

            let excelPath = await createCompaniesExcel(companies);
            // let excelPath = await createDailyPurchaseExcel(purchases, material_name);

            console.log("Printing excelPath: ", excelPath);
            
            res.download(excelPath, `allCompanies_${currentDate}.xlsx`, (err) => {
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

async function createCompaniesExcel(purchases){
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet1 = workbook.addWorksheet('All Purchases');

    // Companies sheet
    worksheet1.columns = [
        { header:"ID", key: 'id', width: 5 },
        { header:"Company Name", key: 'company_name', width: 20 },
        { header:"Mine", key: 'mine', width: 20 },
        { header:"District", key: 'district', width: 20 },
        { header:"Tunnels", key: 'tunnels', width: 10 },
        { header:"Tin", key: 'tin', width: 10 },
        { header:"Last Blacklisted", key: 'last_blacklisted', width: 15 },
        { header:"Last Blacklisted Reason", key: 'last_blacklisted_reason', width: 20 },
        { header:"Exit Last Blacklisted", key: 'exit_last_blacklisted', width: 20 },
        { header:"Exit Last Blacklisted Reason", key: 'exit_last_blacklisted_reason', width: 22 },
        { header:"Minirena Number", key: 'minirena_number', width: 20 },
        { header:"Minirena Expiration Date", key: 'minirena_expiration_date', width: 20 },
        { header:"Blacklisted", key: 'blacklisted', width: 10 }
    ];

    // Apply bold & center alignment to the header row (first row)
    const headerRow = worksheet1.getRow(1);
    headerRow.eachCell((cell) => {
        cell.font = { bold: true }; // Make text bold
        cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center-align text
    });

    // Commit the header row changes
    headerRow.commit();

    // Adding rows to sheet1
    purchases.forEach(item => {
        const row = worksheet1.addRow({
            id: item.id,
            company_name: item.company_name,
            mine: item.mine,
            district: item.district,
            tunnels: item.tunnels,
            tin: item.tin,
            last_blacklisted: item.last_blacklisted ? moment(item.last_blacklisted).format('DD-MM-YYYY') : "",
            last_blacklisted_reason: item.last_blacklisted_reason ? item.last_blacklisted_reason : "",
            exit_last_blacklisted: item.exit_last_blacklisted ? moment(item.exit_last_blacklisted).format('DD-MM-YYYY') : "",
            exit_last_blacklisted_reason: item.exit_last_blacklisted_reason ? item.exit_last_blacklisted_reason : "",
            minirena_number: item.minirena_number,
            minirena_expiration_date: item.minirena_expiration_date ? moment(item.minirena_expiration_date).format('DD-MM-YYYY') : "",
            blacklisted: item.blacklisted ? "TRUE" : "FALSE",
        });

        // Apply background color to the entire row ONLY if blacklisted is true
        if (item.blacklisted === 1) {
            row.eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFC9C9' } // Light Red for Blacklisted
                };
            });
        }
    }); 

    // Save the workbook to a file
    let currentDate = moment(new Date()).format('YYYY-MM-DD');
    const filePath = path.join(__dirname, '..', '..', 'files', `allCompanies_${currentDate}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    console.log(`Excel file created at ${filePath}`);

    return filePath;
}

module.exports = router;