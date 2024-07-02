const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const { twt } = require('../../configs/mysql');
const utils = require('../../lib/utils');

router.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        const query = "SELECT u.username, u.password, r.role_name FROM users u JOIN user_roles ur ON u.user_id = ur.user_id JOIN roles r ON ur.role_id = r.role_id WHERE u.username = ?";
        // twt.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        twt.query(query, [username], async (err, results) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length === 0) {
                return res.status(401).send('Could not find user');
            }

            // const user = results[0];

            const user = {
                id: results[0].id,
                username: results[0].username,
                password: results[0].password,
                roles: results.map(row => row.role_name)
            };

            // Compare the password with the hash stored in the database
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                const tokenObject = utils.issueJWT(user);
                console.log("Login successful");

                // return res.status(200).json({ success: true, user: user, token: tokenObject.token, expiresIn: tokenObject.expires });
                return res.status(200).json({ success: true, user: { username: user.username, roles: user.roles }, token: tokenObject.token, expiresIn: tokenObject.expires });
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