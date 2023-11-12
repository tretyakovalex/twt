const express = require('express');
const router = express.Router();
const mysql = require('mysql2');

const { snPool, taPool, wo3Pool } = require('../configs/mysql');

// === DB Sn ===
// =============
router.get('/getSnDepot', async (req, res) => {
    try {
        snPool.query('SELECT `Purchase No` AS `Purchase_No`, `Quantity`, `Date`, `Price`, `Amount`, `Lot #` AS `Lot_Num`, `Lot_id` FROM `Depot`', (err, result) => {
            res.json({SnDepot: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getSnDepotFiltered', async (req, res) => {
    try {
        snPool.query('SELECT `Price`, `Amount` FROM `Depot` WHERE `Lot #` = 0 AND `Purchase No` > 0', (err, result) => {
            res.json({SnDepotFiltered: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getSnLots', async (req, res) => {
    try {
        snPool.query('SELECT `Lot #` AS `Lot_Num`, `RangeBegining` AS `RangeBeginning`, `RangeEnding`, `Category`, `ListBegining` AS `ListBeginning`, `ListEnding`, `FormingDate`, `Formed`, `CalcMass`, `PriceLot`, `AmountLot`, `CalcSn`, `ShipmentDate`, `MassLot`, `RSn`, `ChimSn`, `Sent`, `Sacks`, `Lot_id` FROM `Lots`', (err, result) => {
            res.json({SnLot: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getSnRegistration', async (req, res) => {
    try {
        snPool.query('SELECT `Quantity`, `Analysis No` AS `Analysis_No`, `Date`, `Name`, `Mass`, `Sn`, `Comments` FROM `Registration`', (err, result) => {
            res.json({SnRegistration: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getSnRegistrationFiltered', async (req, res) => {
    try {
        snPool.query('SELECT `Sn`, `Mass` FROM `Registration` natural join Depot WHERE `Lot #` = 0', (err, result) => {
            res.json({SnRegistrationFiltered: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getSnPurchases', async (req, res) => {
    try {
        snPool.query('SELECT `Purchase No` AS `Purchase_No`, `Date`, `Name`, `Mass`, `Sn`, `Price`, `Amount`, `Lot #` AS `Lot_Num`, `Comments` FROM `Depot` natural join `Registration`', (err, result) => {
            res.json({SnPurchases: result})
        })
    } catch (error) {
        console.error(error);
    }
});
// ==============
// ==============


// === DB Ta ===
// =============
router.get('/getTaDepot', async (req, res) => {
    try {
        taPool.query('SELECT `Purchase No` AS `Purchase_No`, `Quantity`, `Date`, `Price`, `Amount`, `Lot #` AS `Lot_Num`, `Lot_id` FROM `Depot`', (err, result) => {
            res.json({TaDepot: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getTaDepotFiltered', async (req, res) => {
    try {
        taPool.query('SELECT `Price`, `Amount` FROM `Depot` WHERE `Lot #` = 0 AND `Purchase No` > 0', (err, result) => {
            res.json({TaDepotFiltered: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getTaLots', async (req, res) => {
    try {
        taPool.query('SELECT `Lot #` AS `Lot_Num`, `RangeBegining` AS `RangeBeginning`, `RangeEnding`, `Category`, `ListBegining` AS `ListBeginning`, `ListEnding`, `FormingDate`, `Formed`, `CalcMass`, `PriceLot`, `AmountLot`, `CalcSn`, `ShipmentDate`, `MassLot`, `RSn`, `ChimSn`, `Sent`, `Sacks`, `Lot_id` FROM `Lots`', (err, result) => {
            res.json({TaLot: result})
        })
    } catch (error) {
        console.error(error);
    }
});


router.get('/getTaRegistration', async (req, res) => {
    try {
        taPool.query('SELECT `Quantity`, `Analysis No` AS `Analysis_No`, `Date`, `Name`, `Mass`, `Sn`, `Comments`, `Nb`, `Bq` FROM `Registration`', (err, result) => {
            res.json({TaRegistration: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getTaRegistrationFiltered', async (req, res) => {
    try {
        taPool.query('SELECT `Sn`, `Mass`, `Nb`, `Bq` FROM `Registration` natural join Depot WHERE `Lot #` = 0', (err, result) => {
            res.json({TaRegistrationFiltered: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getTaPurchases', async (req, res) => {
    try {
        taPool.query('SELECT `Purchase No` AS `Purchase_No`, `Date`, `Name`, `Mass`, `Sn`, `Nb`, `Bq`, `Price`, `Amount`, `Lot #` AS `Lot_Num`, `Comments` FROM `Depot` natural join `Registration`', (err, result) => {
            res.json({TaPurchases: result})
        })
    } catch (error) {
        console.error(error);
    }
});
// ==============
// ==============

// === DB WO3 ===
// ==============
router.get('/getWo3Depot', async (req, res) => {
    try {
        wo3Pool.query('SELECT `Purchase No` AS `Purchase_No`, `Quantity`, `Date`, `Price`, `Amount`, `Lot #` AS `Lot_Num`, `Lot_id` FROM `Depot`', (err, result) => {
            res.json({wo3depot: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getWo3DepotFiltered', async (req, res) => {
    try {
        wo3Pool.query('SELECT `Price`, `Amount` FROM `Depot` WHERE `Lot #` = 0 AND `Purchase No` > 0', (err, result) => {
            res.json({Wo3DepotFiltered: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getWo3Lots', async (req, res) => {
    try {
        wo3Pool.query('SELECT `Lot #` AS `Lot_Num`, `RangeBegining` AS `RangeBeginning`, `RangeEnding`, `Category`, `ListBegining` AS `ListBeginning`, `ListEnding`, `FormingDate`, `Formed`, `CalcMass`, `PriceLot`, `AmountLot`, `CalcSn`, `ShipmentDate`, `MassLot`, `RSn`, `ChimSn`, `Sent`, `Sacks`, `Lot_id` FROM `Lots`', (err, result) => {
            res.json({wo3lot: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getWo3Registration', async (req, res) => {
    try {
        wo3Pool.query('SELECT `Quantity`, `Analysis No` AS `Analysis_No`, `Date`, `Name`, `Mass`, `Sn`, `Comments` FROM `Registration`', (err, result) => {
            res.json({wo3registration: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getWo3RegistrationFiltered', async (req, res) => {
    try {
        wo3Pool.query('SELECT `Sn`, `Mass` FROM `Registration` natural join Depot WHERE `Lot #` = 0', (err, result) => {
            res.json({Wo3RegistrationFiltered: result})
        })
    } catch (error) {
        console.error(error);
    }
});

router.get('/getWo3Purchases', async (req, res) => {
    try {
        wo3Pool.query('SELECT `Purchase No` AS `Purchase_No`, `Date`, `Name`, `Mass`, `Sn`, `Price`, `Amount`, `Lot #` AS `Lot_Num`, `Comments` FROM `Depot` natural join `Registration`', (err, result) => {
            res.json({Wo3Purchases: result})
        })
    } catch (error) {
        console.error(error);
    }
});
// ==============
// ==============

module.exports = router;