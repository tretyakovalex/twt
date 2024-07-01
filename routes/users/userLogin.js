const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { twt } = require('../../configs/mysql');
const utils = require('../../lib/utils');

router.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        twt.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length === 0) {
                return res.status(401).send('Could not find user');
            }

            const user = results[0];

            // Compare the password with the hash stored in the database
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                const tokenObject = utils.issueJWT(user);
                console.log("Login successful");

                return res.status(200).json({ success: true, user: user, token: tokenObject.token, expiresIn: tokenObject.expires });
            } else {
                return res.status(401).send("Username or password is incorrect");
            }
        })
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
});

module.exports = router;