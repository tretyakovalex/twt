const express = require('express');
const router = express.Router();

const { twt } = require('../../configs/mysql');

// === Add to registrations table ===

router.get('/getAllMaterialDepotStats', async (req, res) => {
    try {
        let unparsedTaStats = await fetch('http://localhost:4000/getTaDepotStats');
        let taStats = await unparsedTaStats.json();

        let unparsedWStats = await fetch('http://localhost:4000/getWDepotStats');
        let wStats = await unparsedWStats.json();

        let unparsedSnStats = await fetch('http://localhost:4000/getSnDepotStats');
        let snStats = await unparsedSnStats.json();
        
        let unparsedBeStats = await fetch('http://localhost:4000/getBeDepotStats');
        let beStats = await unparsedBeStats.json();
        
        let unparsedLiStats = await fetch('http://localhost:4000/getLiDepotStats');
        let liStats = await unparsedLiStats.json();

        // let combinedStats = [taStats, wStats, snStats];
        let combinedStats = [taStats, wStats, snStats, beStats, liStats];

        res.json(combinedStats);
    } catch (error) {
        console.error(error);
    }
})

router.get('/getTaDepotStats', async (req, res) => {
    const data = req.body;
    console.log(data);

    try {
        const query = 'select * from detailed_lots where lot_number IS NULL AND material_name="Ta"';
        twt.query(query, async (err, detailed_lots) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }
            
            let sumMaterialPercentage = detailed_lots.reduce((acc, item) => acc + item.material_percentage, 0);
            let sumAveragePrice = detailed_lots.reduce((acc, item) => acc + item.price_per_kg, 0);
            let sumUsdPerPound = detailed_lots.reduce((acc, item) => acc + ((item.price_per_kg * 45.36) / item.material_percentage), 0);
            
            let ta_stats = {
                material_name: "Ta",
                totalMass: parseFloat(detailed_lots.reduce((acc, item) => acc + item.mass, 0).toFixed(1)),
                averageMaterialPercentage: parseFloat((sumMaterialPercentage / detailed_lots.length).toFixed(2)),
                totalAmount: parseFloat(detailed_lots.reduce((acc, item) => acc + item.amount_in_usd, 0).toFixed(2)),
                price_per_kg: parseFloat((sumAveragePrice / detailed_lots.length).toFixed(2)),
                usd_per_pound: parseFloat((sumUsdPerPound / detailed_lots.length).toFixed(2))
            };

            res.json(ta_stats);
        });
    } catch (error) {
        console.error(error);
    }
});

router.get('/getWDepotStats', async (req, res) => {
    const data = req.body;
    console.log(data);

    try {
        const query = 'select * from detailed_lots where lot_number IS NULL AND material_name="W"';
        twt.query(query, async (err, detailed_lots) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            let sumMaterialPercentage = detailed_lots.reduce((acc, item) => acc + item.material_percentage, 0);
            let sumAveragePrice = detailed_lots.reduce((acc, item) => acc + item.price_per_kg, 0);
            let sumMTU = detailed_lots.reduce((acc, item) => acc + item.mtu, 0);
            
            let w_stats = {
                material_name: "W",
                totalMass: parseFloat(detailed_lots.reduce((acc, item) => acc + item.mass, 0).toFixed(1)),
                averageMaterialPercentage: parseFloat((sumMaterialPercentage / detailed_lots.length).toFixed(2)),
                totalAmount: parseFloat(detailed_lots.reduce((acc, item) => acc + item.amount_in_usd, 0).toFixed(2)),
                price_per_kg: parseFloat((sumAveragePrice / detailed_lots.length).toFixed(2)),
                MTU: parseFloat((sumMTU / detailed_lots.length).toFixed(2))
            };

            res.json(w_stats);
        });
    } catch (error) {
        console.error(error);
    }
});

// router.get('/getSnDepotStats', async (req, res) => {
//     const data = req.body;
//     console.log(data);

//     try {
//         const query = 'select * from detailed_lots where lot_number IS NULL AND material_name="Sn"';
//         twt.query(query, async (err, detailed_lots) => {
//             if (err) {
//                 console.log(err);
//                 return res.status(500).send('Internal Server Error');
//             }

//             let sumMaterialPercentage = detailed_lots.reduce((acc, item) => acc + item.material_percentage, 0);
//             let sumAveragePrice = detailed_lots.reduce((acc, item) => acc + item.price_per_kg, 0);
//             let sumLME = detailed_lots.reduce((acc, item) => acc + item.lme, 0);
//             let sumTC = detailed_lots.reduce((acc, item) => acc + item.tc, 0);
            
//             let sn_stats = {
//                 material_name: "Sn",
//                 totalMass: parseFloat(detailed_lots.reduce((acc, item) => acc + item.mass, 0).toFixed(1)),
//                 averageMaterialPercentage: parseFloat((sumMaterialPercentage / detailed_lots.length).toFixed(2)),
//                 totalAmount: parseFloat(detailed_lots.reduce((acc, item) => acc + item.amount_in_usd, 0).toFixed(2)),
//                 price_per_kg: parseFloat((sumAveragePrice / detailed_lots.length).toFixed(2)),
//                 LME: parseFloat((sumLME / detailed_lots.length).toFixed(2)),
//                 TC: parseFloat((sumTC / detailed_lots.length).toFixed(2))
//             };

//             res.json(sn_stats);
//         });
//     } catch (error) {
//         console.error(error);
//     }
// });

router.get('/getSnDepotStats', async (req, res) => {
    try {
        const query = 'select * from detailed_lots where lot_number IS NULL AND material_name="Sn"';
        twt.query(query, async (err, detailed_lots) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal Server Error');
            }

            if (detailed_lots.length === 0) {
                return res.json({
                    material_name: "Sn",
                    totalMass: 0,
                    averageMaterialPercentage: 0,
                    totalAmount: 0,
                    price_per_kg: 0,
                    LME: 0,
                    TC: 0
                });
            }

            let totalMass = detailed_lots.reduce((acc, item) => acc + item.mass, 0);
            let sumMaterialPercentage = detailed_lots.reduce((acc, item) => acc + item.material_percentage, 0);
            let totalAmount = detailed_lots.reduce((acc, item) => acc + item.amount_in_usd, 0);
            let sumAveragePrice = detailed_lots.reduce((acc, item) => acc + item.price_per_kg, 0);
            let sumLME = detailed_lots.reduce((acc, item) => acc + item.lme, 0);

            let averageMaterialPercentage = sumMaterialPercentage / detailed_lots.length;
            let price_per_kg = sumAveragePrice / detailed_lots.length;
            let LME = sumLME / detailed_lots.length;

            // Applying the new formula for TC
            let TC = parseFloat((LME * averageMaterialPercentage - (1000 * price_per_kg)).toFixed(2));

            let sn_stats = {
                material_name: "Sn",
                totalMass: parseFloat(totalMass.toFixed(1)),
                averageMaterialPercentage: parseFloat(averageMaterialPercentage.toFixed(2)),
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                price_per_kg: parseFloat(price_per_kg.toFixed(2)),
                LME: parseFloat(LME.toFixed(2)),
                TC
            };

            res.json(sn_stats);
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/getBeDepotStats', async (req, res) => {
    const data = req.body;
    console.log(data);

    try {
        const query = 'select * from detailed_lots where lot_number IS NULL AND material_name="Be"';
        twt.query(query, async (err, detailed_lots) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            let sumMaterialPercentage = detailed_lots.reduce((acc, item) => acc + item.material_percentage, 0);
            let sumAveragePrice = detailed_lots.reduce((acc, item) => acc + item.price_per_kg, 0);
            let sumMTU = detailed_lots.reduce((acc, item) => acc + item.mtu, 0);
            
            let w_stats = {
                material_name: "Be",
                totalMass: parseFloat(detailed_lots.reduce((acc, item) => acc + item.mass, 0).toFixed(1)),
                averageMaterialPercentage: parseFloat((sumMaterialPercentage / detailed_lots.length).toFixed(2)),
                totalAmount: parseFloat(detailed_lots.reduce((acc, item) => acc + item.amount_in_usd, 0).toFixed(2)),
                price_per_kg: parseFloat((sumAveragePrice / detailed_lots.length).toFixed(2)),
                MTU: parseFloat((sumMTU / detailed_lots.length).toFixed(2))
            };

            res.json(w_stats);
        });
    } catch (error) {
        console.error(error);
    }
});

router.get('/getLiDepotStats', async (req, res) => {
    const data = req.body;
    console.log(data);

    try {
        const query = 'select * from detailed_lots where lot_number IS NULL AND material_name="Li"';
        twt.query(query, async (err, detailed_lots) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            let sumMaterialPercentage = detailed_lots.reduce((acc, item) => acc + item.material_percentage, 0);
            let sumAveragePrice = detailed_lots.reduce((acc, item) => acc + item.price_per_kg, 0);
            let sumMTU = detailed_lots.reduce((acc, item) => acc + item.mtu, 0);
            
            let w_stats = {
                material_name: "Li",
                totalMass: parseFloat(detailed_lots.reduce((acc, item) => acc + item.mass, 0).toFixed(1)),
                averageMaterialPercentage: parseFloat((sumMaterialPercentage / detailed_lots.length).toFixed(2)),
                totalAmount: parseFloat(detailed_lots.reduce((acc, item) => acc + item.amount_in_usd, 0).toFixed(2)),
                price_per_kg: parseFloat((sumAveragePrice / detailed_lots.length).toFixed(2)),
                MTU: parseFloat((sumMTU / detailed_lots.length).toFixed(2))
            };

            res.json(w_stats);
        });
    } catch (error) {
        console.error(error);
    }
});


module.exports = router;