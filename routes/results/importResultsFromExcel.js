const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');

const express = require('express');
const router = express.Router();

const moment = require('moment');

const { twt } = require('../../configs/mysql');

// === Import from excel ===
router.post('/importResultsFromExcel', async (req, res) => {
    let results_data = await getExcelResultsData("../../results.xlsx");

    let formattedResult = [];

    let response = await fetch(`http://localhost:4000/getCompanyNameAndITSCINumberBySampleNo`);
    let registrationData = await response.json();

    const sampleNumbers = results_data.map(item => item.Sample);

    const filteredAndSortedData = registrationData
    .filter(row => sampleNumbers.includes(row.sample_number)) // Filter only matching sample numbers


    // Using `for...of` loop to handle async/await properly
    for (const item of results_data) {
        // Check if the sample_number exists in filteredAndSortedData
        const matchedData = filteredAndSortedData.find(data => data.sample_number === item.Sample);

        if (matchedData) {
            // Add the formatted result if the sample_number is found
            formattedResult.push({
                date: item.Date,
                sample_number: item.Sample,
                contract_number: "",
                material: item.Type,
                mass: parseFloat(item.Mass),
                company_name: matchedData.company_name,
                itsci_number: matchedData.itsci_number,
                remarks: item.Remark || "",
                twt_ta2o5: item.twt_ta2o5 || "",
                twt_nb2o5: item.twt_nb2o5 || "",
                twt_sn: item.twt_sn || "",
                twt_wo3: item.twt_wo3 || "",
                twt_bq_per_gram: item.twt_bq_per_gram || "",
                gsaContractNumber: "",
                gsa_ta2o5: item.gsa_ta2o5 || "",
                gsa_nb2o5: "",
                gsa_sn: item.gsa_sn || "",
                gsa_wo3: item.gsa_wo3 || "",
                gsa_bq_per_gram: "",
                gsa_moisture: item.gsa_moisture || "",
                asi_ta2o5: "",
                asi_nb2o5: "",
                asi_sn: "",
                asi_wo3: "",
                asi_bq_per_gram: "",
            })
        } 
        else if (!matchedData){
            formattedResult.push({
                date: item.Date,
                sample_number: item.Sample,
                contract_number: "",
                material: item.Type,
                mass: parseFloat(item.Mass),
                company_name: "",
                itsci_number: "",
                remarks: item.Remark || "",
                twt_ta2o5: item.twt_ta2o5 || "",
                twt_nb2o5: item.twt_nb2o5 || "",
                twt_sn: item.twt_sn || "",
                twt_wo3: item.twt_wo3 || "",
                twt_bq_per_gram: item.twt_bq_per_gram || "",
                gsaContractNumber: "",
                gsa_ta2o5: item.gsa_ta2o5 || "",
                gsa_nb2o5: "",
                gsa_sn: item.gsa_sn || "",
                gsa_wo3: item.gsa_wo3 || "",
                gsa_bq_per_gram: "",
                gsa_moisture: item.gsa_moisture || "",
                asi_ta2o5: "",
                asi_nb2o5: "",
                asi_sn: "",
                asi_wo3: "",
                asi_bq_per_gram: "",
            })
        }
    }

    // console.table(formattedResult);
    // console.table(formattedResult.slice(0, 50));

    const insertQuery = `INSERT INTO results (date, sample_number, contract_number, material, mass, company_name, itsci_number, remarks, twt_ta2o5, twt_nb2o5, twt_sn, twt_wo3, twt_bq_per_gram, gsaContractNumber, gsa_ta2o5, gsa_nb2o5, gsa_sn, gsa_wo3, gsa_bq_per_gram, gsa_moisture, asi_ta2o5, asi_nb2o5, asi_sn, asi_wo3, asi_bq_per_gram) VALUES ?`;

    const values = formattedResult.map(result => [result.date, result.sample_number, result.contract_number, result.material, result.mass, result.company_name, result.itsci_number, result.remarks, result.twt_ta2o5, result.twt_nb2o5, result.twt_sn, result.twt_wo3, result.twt_bq_per_gram, result.gsaContractNumber, result.gsa_ta2o5, result.gsa_nb2o5, result.gsa_sn, result.gsa_wo3, result.gsa_bq_per_gram, result.gsa_moisture, result.asi_ta2o5, result.asi_nb2o5, result.asi_sn, result.asi_wo3, result.asi_bq_per_gram]);

    twt.query(insertQuery, [values], (err, result) => {
        if(err){
            console.error(err);
        }

        res.json({"message": "successfully imported all results!"});
    })
})
// =========================

async function fetchAllCompanyData(results_data){
    try {
        // Map over the results_data and fetch the company data for each sample
        const promises = results_data.map(async (item) => {
            const response = await fetch(`http://localhost:4000/getCompanyNameAndITSCINumberBySampleNo`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch data status: ${response.status}`);
            }

            const data = await response.json();
            return data; // Return the parsed data
        });

        // Wait for all the promises to resolve
        const registrationData = await Promise.all(promises);
        
        // Return the collected data
        return registrationData;
    } catch (error) {
        console.error('Error fetching company data:', error);
        throw error; // Re-throw the error if needed for further handling
    }
};


router.get('/getCompanyNameAndITSCINumberBySampleNo', async (req, res) => {
    try {
        twt.query(`select sample_number, company_name, itsci_number from registrations;`, (err, data) => {
            res.json(data);
        })
    } catch (error) {
        console.error(error);
    }
})

async function getExcelResultsData(file_path){
    // Read the Excel file
    const xlsx = require('xlsx');
    const workbook = xlsx.readFile(path.join(__dirname, file_path));

    // Get the first sheet
    const sheetName = workbook.SheetNames[0]; // Get the name of the first sheet
    const sheet = workbook.Sheets[sheetName];
    
    // Convert sheet to JSON
    const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

    return jsonData;
}

module.exports = router;