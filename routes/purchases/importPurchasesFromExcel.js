const fs = require('fs-extra');
const path = require('path');
const fetch = require('node-fetch');

const express = require('express');
const router = express.Router();

const moment = require('moment');

const { twt } = require('../../configs/mysql');

// === Import from excel ===
router.post('/importPurchasesFromExcel', async (req, res) => {
    let ta_data = await getExcelPurchaseData("../../purchases_Ta.xlsx");
    // let w_data = await getExcelPurchaseData("../../purchases_W.xlsx");
    // let sn_data = await getExcelPurchaseData("../../purchases_Sn.xlsx");

    let formattedPurchaseTa = [];
    let formattedPurchaseW = [];
    let formattedPurchaseSn = [];

    console.log("ta_data", ta_data);

    ta_data.forEach(item => {
        let sample_no = moment(item.date).format("DDMMYYYY");
        formattedPurchaseTa.push({
            sample_number: `1-${sample_no}`,
            sample_and_company_number: `1-${sample_no}-(1)`,
            purchase_date: item.date,
            results_date: item.date,
            material_name: "TA",
            company_name: item.company_name,
            company_tunnel: "",
            mass: item.mass,
            material_percentage: item.TaO5,
            price_per_kg: item.price_per_kg,
            total_amount: item.total_amount,
            itsci_mine_site_number: "",
            rma_frw: null,
            rma_usd: null,
            total_minus_rma_usd: null,
            usd_per_pound: null,
            ta_purchase_id: item.purchase_id,
            wo3_purchase_id: null,
            sn_purchase_id: null,
            Nb2O5: item.Nb || null,
            bq_per_gram: item.Bq || null,
            be_purchase_id: null,
            li_purchase_id: null,
            w_mtu: null,
            lme: null,
            tc: null,
            company_district: ""
        })
    });

    // console.log("w_data", w_data);

    // w_data.forEach(item => {
    //     let sample_no = moment(item.date).format("DDMMYYYY");
    //     formattedPurchaseW.push({
    //         sample_number: `1-${sample_no}`,
    //         sample_and_company_number: `1-${sample_no}-(1)`,
    //         purchase_date: item.date,
    //         results_date: item.date,
    //         material_name: "W",
    //         company_name: item.company_name,
    //         company_tunnel: "",
    //         mass: item.mass,
    //         material_percentage: item.WO3,
    //         price_per_kg: item.price_per_kg,
    //         total_amount: item.total_amount,
    //         itsci_mine_site_number: "",
    //         rma_frw: null,
    //         rma_usd: null,
    //         total_minus_rma_usd: null,
    //         usd_per_pound: null,
    //         ta_purchase_id: null,
    //         wo3_purchase_id: item.purchase_id,
    //         sn_purchase_id: null,
    //         Nb2O5: null,
    //         bq_per_gram: null,
    //         be_purchase_id: null,
    //         li_purchase_id: null,
    //         w_mtu: item.MTU,
    //         lme: null,
    //         tc: null,
    //         company_district: ""
    //     })
    // });

    // console.log("sn_data: ", sn_data);

    // sn_data.forEach(item => {
    //     let sample_no = moment(item.date).format("DDMMYYYY");
    //     formattedPurchaseSn.push({
    //         sample_number: `1-${sample_no}`,
    //         sample_and_company_number: `1-${sample_no}-(1)`,
    //         purchase_date: item.date,
    //         results_date: item.date,
    //         material_name: "Sn",
    //         company_name: item.company_name,
    //         company_tunnel: "",
    //         mass: item.mass,
    //         material_percentage: item.SnO2,
    //         price_per_kg: item.price_per_kg,
    //         total_amount: item.total_amount,
    //         itsci_mine_site_number: "",
    //         rma_frw: null,
    //         rma_usd: null,
    //         total_minus_rma_usd: null,
    //         usd_per_pound: null,
    //         ta_purchase_id: null,
    //         wo3_purchase_id: null,
    //         sn_purchase_id: item.purchase_id,
    //         Nb2O5: null,
    //         bq_per_gram: null,
    //         be_purchase_id: null,
    //         li_purchase_id: null,
    //         w_mtu: null,
    //         lme: item.lme, 
    //         tc: item.tc,
    //         company_district: ""
    //     })
    // });

    let formattedPurchase = [...formattedPurchaseTa, ...formattedPurchaseW, ...formattedPurchaseSn];
    formattedPurchase.sort((a, b) => {
        return moment(a.purchase_date).isBefore(moment(b.purchase_date)) ? -1 : 1;
    });

    const insertQuery = `INSERT INTO purchases (sample_number, sample_and_company_number, purchase_date, results_date, company_name, company_tunnel, mass, material_percentage, price_per_kg, total_amount, itsci_mine_site_number, rma_frw, rma_usd, total_minus_rma_usd, usd_per_pound, material_name, ta_purchase_id, wo3_purchase_id, sn_purchase_id, Nb2O5, bq_per_gram, be_purchase_id, li_purchase_id, w_mtu, lme, tc, company_district) VALUES ?`;

    const values = formattedPurchase.map(purchase => [purchase.sample_number, purchase.sample_and_company_number, purchase.purchase_date, purchase.results_date, purchase.company_name, purchase.company_tunnel, purchase.mass, purchase.material_percentage, purchase.price_per_kg, purchase.total_amount, purchase.itsci_mine_site_number, purchase.rma_frw, purchase.rma_usd, purchase.total_minus_rma_usd, purchase.usd_per_pound, purchase.material_name, purchase.ta_purchase_id, purchase.wo3_purchase_id, purchase.sn_purchase_id, purchase.Nb2O5, purchase.bq_per_gram, purchase.be_purchase_id, purchase.li_purchase_id, purchase.w_mtu, purchase.lme, purchase.tc, purchase.company_district]);

    twt.query(insertQuery, [values], (err, purchase) => {
        if(err){
            console.error(err);
        }

        res.json({"message": "successfully imported all purchases!"});
    })
})
// =========================

async function getExcelPurchaseData(file_path){
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