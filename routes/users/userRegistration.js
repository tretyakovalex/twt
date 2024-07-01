const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { twt } = require('../../configs/mysql');
const utils = require('../../lib/utils');

router.post('/register', async (req, res) => {
    try {
        const Data = req.body;

        const hashedPassword = await bcrypt.hash(Data.password, 12);

        const user = {
            username: Data.username,
            password: hashedPassword,
            role: Data.role
        }

        console.log(user);

        twt.query('INSERT INTO users SET ?', user, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            const jwt = utils.issueJWT(user);

            res.json({ message: "User Registered!" })
        });
    } catch (error) {
        console.error(error);
    }
});

module.exports = router;