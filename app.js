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
app.use(require('./routes/generated-contract-routes'));
app.use(require('./routes/registration/companies-routes'));
app.use(require('./routes/registration/registration-routes'));
app.use(require('./routes/results/results-routes'));
app.use(require('./routes/purchases/purchase-routes'));
app.use(require('./routes/purchases/purchasing-settings-routes'));

app.use(require('./routes/users/userLogin'));
app.use(require('./routes/users/userRegistration'));


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
