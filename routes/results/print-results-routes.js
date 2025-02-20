const express = require('express');
const router = express.Router();
const moment = require('moment');

const compileResultsReceipt = require('../../handlebars/resultsReceiptTemplate');


router.get('/printResult', async (req, res) => {
    try {
        // Parse the JSON string back into an object
        const results = JSON.parse(req.query.results);
        console.log("Printing results: ", results);

        let filteredResult = filteredResults(results);
        console.log("Priting filteredResult: ", filteredResult);

        let resultReceiptName = 'resultReceipt';
        let pdfPath = await compileResultsReceipt.generatePdf(filteredResult, resultReceiptName);

        if (pdfPath) {
            console.log("Printing pdf path: ", pdfPath);
            res.download(pdfPath);
        }

        // res.json({ message: 'Results received', filteredResult });

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

function filteredResults(results) {
    const gsaFields = [
        "gsa_ta2o5", "gsa_nb2o5", "gsa_sn", "gsa_wo3",
        "gsa_be", "gsa_li", "gsa_bq_per_gram", "gsa_moisture"
    ];
    const asiFields = [
        "asi_ta2o5", "asi_nb2o5", "asi_sn", "asi_wo3",
        "asi_be", "asi_li", "asi_bq_per_gram"
    ];

    const renameMap = {
        gsa_ta2o5: "Ta2o5",
        gsa_nb2o5: "Nb2o5",
        gsa_sn: "Sn",
        gsa_wo3: "Wo3",
        gsa_be: "Be",
        gsa_li: "Li",
        gsa_bq_per_gram: "Radioactivity",
        gsa_moisture: "Moisture",

        asi_ta2o5: "Ta2o5",
        asi_nb2o5: "Nb2o5",
        asi_sn: "Sn",
        asi_wo3: "Wo3",
        asi_be: "Be",
        asi_li: "Li",
        asi_bq_per_gram: "Radioactivity"
    };

    let laboratory = "";

    let gsaResults = {};
    if (gsaFields.some(field => results[field] && results[field] !== "")) {
        laboratory = "GSA/TWT";
        gsaResults = Object.fromEntries(
            gsaFields
                .filter(field => results[field] && results[field] !== "")
                .map(field => [renameMap[field], results[field]])
        );
    }

    let asiResults = {};
    if (asiFields.some(field => results[field] && results[field] !== "")) {
        laboratory = "ASI/TWT";
        asiResults = Object.fromEntries(
            asiFields
                .filter(field => results[field] && results[field] !== "")
                .map(field => [renameMap[field], results[field]])
        );
    }

    if (Object.keys(gsaResults).length && Object.keys(asiResults).length) {
        laboratory = "GSA/ASI/TWT";
    }

    const materialTypeMap = {
        "Ta": "Tantalum",
        "Sn": "Tin",
        "W": "Tungsten",
        "Be": "Beryllium",
        "Li": "Lithium"
    };

    let material_type = materialTypeMap[results.material] || "Unknown";

    const twtResults = {
        Ta2o5: results.twt_ta2o5,
        Nb2o5: results.twt_nb2o5,
        Sn: results.twt_sn,
        Wo3: results.twt_wo3,
        Be: results.twt_be,
        Li: results.twt_li,
        Radioactivity: results.twt_bq_per_gram,
        Moisture: results.twt_moisture
    };

    const anotherMap = {
        "Ta": "Ta2o5",
        "Sn": "Sn",
        "W": "Wo3",
        "Be": "Be",
        "Li": "Li"
    };

    let finalResults = { ...twtResults };

    // If a GSA or ASI result exists for the selected material, remove the corresponding TWT result
    const elementKey = anotherMap[results.material];

    if (elementKey) {
        if (gsaResults[elementKey] || asiResults[elementKey]) {
            delete finalResults[elementKey]; // Remove TWT result for this material
        }
    }

    // Remove non-element values (Radioactivity, Moisture, etc.) from GSA and ASI results if they exist in TWT results
    const nonElementFields = ["Radioactivity", "Moisture"];
    nonElementFields.forEach(field => {
        if (twtResults[field]) {
            delete gsaResults[field]; // Remove from GSA if it's already in TWT
            delete asiResults[field]; // Remove from ASI if it's already in TWT
        }
    });

    const filteredResults = {
        date: moment(results.date).format('DD.MM.YYYY'),
        material_type: material_type,
        laboratory: laboratory || 'TWT',
        sample_number: results.sample_number,
        contract_number: results.contract_number,
        results: finalResults,
        gsa_results: Object.keys(gsaResults).length ? gsaResults : null,
        asi_results: Object.keys(asiResults).length ? asiResults : null
    };

    return filteredResults;
}



module.exports = router;
