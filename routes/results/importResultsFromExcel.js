const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');

const express = require('express');
const router = express.Router();

const moment = require('moment');

const { twt } = require('../../configs/mysql');

// === Import from excel ===
router.post('/importResultsFromExcel', async (req, res) => {
    try {
        let results_data = await getExcelResultsData("../../results.xlsx");

        console.log("Printing results_data: ", results_data);
        let formattedResult = [];

        let materialType = {
            "TA": "Ta",
            "SN": "Sn",
            "W": "Ta",
            "BE": "Be",
            "LI": "Li"
        };

        for (const item of results_data) {
            formattedResult.push({
                date: item.Date || "",
                sample_number: item.Sample || "",
                contract_number: "",
                material: materialType[item.Type] || "",
                mass: item.Mass ? parseFloat(item.Mass) : 0,
                company_name: "",
                itsci_number: "",
                remarks: item.Remark || "",
                twt_ta2o5: item["TWTTa2O5"] || "",
                twt_nb2o5: item["TWTNb2O5"] || "",
                twt_sn: item["TWTSn"] || "",
                twt_wo3: item["TWTWO3"] || "",
                twt_be: item["TWTBe"] || "",
                twt_li: item["TWTLi"] || "",
                twt_bq_per_gram: item["TWTBq/g"] || "",
                gsaContractNumber: "",
                gsa_ta2o5: item["GSATa2O5"] || "",
                gsa_nb2o5: item["GSANb2O5"] || "",
                gsa_sn: item["GSASn"] || "",
                gsa_wo3: item["GSAWO3"] || "",
                gsa_be: item["GSABe"] || "",
                gsa_li: item["GSALi"] || "",
                gsa_bq_per_gram: item["GSABq/g"] || "",
                gsa_moisture: item["GSAH2O"] || "",
                asi_ta2o5: item["ASITa2O5"] || "",
                asi_nb2o5: item["ASINb2O5"] || "",
                asi_sn: item["ASISn"] || "",
                asi_wo3: item["ASIWO3"] || "",
                asi_be: item["ASIBe"] || "",
                asi_li: item["ASILi"] || "",
                asi_bq_per_gram: item["ASIBq/g"] || "",
            });
        }

        // console.log("Printing formattedResult: ", formattedResult);
        res.json({ success: true, data: formattedResult });

    } catch (error) {
        console.error("Error processing Excel file:", error);
        res.status(500).json({ success: false, message: "Failed to process file", error: error.message });
    }
});
    // const insertQuery = `INSERT INTO results (date, sample_number, contract_number, material, mass, company_name, itsci_number, remarks, twt_ta2o5, twt_nb2o5, twt_sn, twt_wo3, twt_bq_per_gram, gsaContractNumber, gsa_ta2o5, gsa_nb2o5, gsa_sn, gsa_wo3, gsa_bq_per_gram, gsa_moisture, asi_ta2o5, asi_nb2o5, asi_sn, asi_wo3, asi_bq_per_gram) VALUES ?`;

    // const values = formattedResult.map(result => [result.date, result.sample_number, result.contract_number, result.material, result.mass, result.company_name, result.itsci_number, result.remarks, result.twt_ta2o5, result.twt_nb2o5, result.twt_sn, result.twt_wo3, result.twt_bq_per_gram, result.gsaContractNumber, result.gsa_ta2o5, result.gsa_nb2o5, result.gsa_sn, result.gsa_wo3, result.gsa_bq_per_gram, result.gsa_moisture, result.asi_ta2o5, result.asi_nb2o5, result.asi_sn, result.asi_wo3, result.asi_bq_per_gram]);

    // twt.query(insertQuery, [values], (err, result) => {
    //     if(err){
    //         console.error(err);
    //     }

    //     res.json({"message": "successfully imported all results!"});
    // })
// =========================


async function getExcelResultsData(file_path) {
    const xlsx = require('xlsx');
    const path = require('path');

    // Read the Excel file
    const workbook = xlsx.readFile(path.join(__dirname, file_path));

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON with custom header formatting
    const jsonData = xlsx.utils.sheet_to_json(sheet, {
        raw: false,
        header: 1, // Get data as an array of arrays (to manually process headers)
    });

    // Extract headers and normalize them
    let headers = jsonData[0].map(header => header.replace(/\n/g, '').trim());

    // Convert data back to object format
    let formattedData = jsonData.slice(1).map(row => {
        let obj = {};
        headers.forEach((key, i) => {
            obj[key] = row[i];
        });
        return obj;
    });

    return formattedData;
}


module.exports = router;