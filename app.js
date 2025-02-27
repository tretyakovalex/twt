const express = require('express');
const app = express();
const cors = require('cors')
const path = require('path');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 4000;

app.use(express.json());

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// === Routes: ===
// ===============

// app.use(require('./routes/mysql-routes'));
app.use(require('./routes/companies/companies-routes'));
app.use(require('./routes/companies/exportAllCompaniesToExcel'));
app.use(require('./routes/generated-contract-routes'));
app.use(require('./routes/registration/registration-routes'));
app.use(require('./routes/results/results-routes'));
app.use(require('./routes/purchases/purchase-routes'));
app.use(require('./routes/purchases/purchasing-settings-routes'));
app.use(require('./routes/purchases/importPurchasesFromExcel'));
app.use(require('./routes/purchases/exportDailyPurchasesToExcel'));
app.use(require('./routes/lots/lots-routes'));
app.use(require('./routes/lots/importLotsFromExcel'));
app.use(require('./routes/results/importResultsFromExcel'));
app.use(require('./routes/stats/depot-stats-routes'));

app.use(require('./routes/results/print-results-routes'));

app.use(require('./routes/users/userLogin'));
app.use(require('./routes/users/userRegistration'));

app.use(require('./routes/purchases/exportAllPurchasesToExcel'));


// === Frontend: ===
// =================

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// === Server: ===
// ===============

app.listen(PORT, () => {
    console.log(`listening on port: ${PORT}`)
});
