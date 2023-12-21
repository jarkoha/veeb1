const express = require('express');
const fs = require('fs');
const app = express();
const bodyparser = require('body-parser');
const pool = require('./src/databasepool').pool;
//sessioni jälgimine
const session = require('express-session');

app.use(session({secret: 'minuAbsoluutseltSalajaneVõti', saveUninitialized: true, resave: true}));
let mySession;

app.set('view engine', 'ejs'); //view mootor, ejs on üks paljudest mootoritest 
app.use(express.static('public')); //määrame põhikausta, et all pool ei peaks kirjutama "/public/xxx/xxx"
//Kui ainult teksti tahame serverisse saata, siis extended FALSE, kui ka pilte ja video tahame saata, siis TRUE
app.use(bodyparser.urlencoded({extended: true}));


app.get('/', (req, res) => {
    let sql = `
        SELECT organizations.id, organizations.name, 
               SUM(donations.sum) AS total_donated, 
               COUNT(donations.id) AS donation_count,
               MAX(donations.sum) AS max_donated
        FROM organizations AS organizations
        LEFT JOIN donations AS donations ON organizations.id = donations.organizations_id
        GROUP BY organizations.id, organizations.name
    `;
    
    pool.getConnection((err, connection) => {
        if (err) {
            throw err;
        } else {
            connection.execute(sql, (err, result) => {
                if (err) {
                    throw err;
                    res.render('donations');
                    connection.release();
                } else {
                    //console.log(avg_donated)
                    const organizations = result;
                    res.render('donations', { organizations: organizations });
                    connection.release();
                }
            });
        }
    });
});

app.post('/', (req, res) => {
    let notice = '';
    let organizationId = req.body.organization;
    let donationAmount;

    if (req.body.donationAmount === 'custom') {
        //Kui valitakse muu summa
        donationAmount = req.body.customAmount;
    } else {
        //Kui valitakse etteantud summa
        donationAmount = req.body.donationAmount;
    }

    let sql = 'INSERT INTO donations (organizations_id, sum) VALUES (?, ?)';
    let sql2 = `
        SELECT
            organizations.id,
            organizations.name,
            SUM(donations.sum) AS total_donated,
            COUNT(donations.id) AS donation_count,
            MAX(donations.sum) AS max_donated
        FROM organizations AS organizations
        LEFT JOIN donations AS donations ON organizations.id = donations.organizations_id
        GROUP BY organizations.id, organizations.name;
    `;

    pool.getConnection((err, connection) => {
        if (err) {
            throw err;
        } else {
            connection.execute(sql2, (err, organizationsResult) => {
                if (err) {
                    throw err;
                    notice = 'Lehe laadimisel tekkis viga!';
                    res.render('donations', { notice: notice, });
                    connection.release();
                    throw err;
                } else {
                    const organizations = organizationsResult;
                    connection.execute(sql, [organizationId, donationAmount], (err, result) => {
                        if (err) {
                            notice = 'Annetuse saatmine ebaõnnestus!';
                            res.render('donations', { notice: notice, organizations: organizations });
                            connection.release();
                            throw err;
                        } else {
                            notice = 'Annetuse saatmine õnnestus! Tabel uueneb peale järgmise annetuse saatmist või refreshimist.';
                            res.render('donations', { notice: notice, organizations: organizations });
                            connection.release();
                        }
                    });
                }
            });
        }
    });
});


app.listen(5134);