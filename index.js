const express = require('express');
const fs = require('fs');
const app = express();
const mysql = require('mysql2');
const bodyparser = require('body-parser');
const timeInfo = require('./dateTimeET');
const dateInfo = require('./dateTimeET');
const dbInfo = require('../../vp23config');
//Kuna rinde kasutab ajutiselt Inga andmebaasi, siis:
const dataBase = 'if23_inga_pe_ta';

app.set('view engine', 'ejs'); //view mootor, ejs on üks paljudest mootoritest 
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false}));

//loon andmebaasi ühenduse
const conn = mysql.createConnection({
    host: dbInfo.configData.host,
    user: dbInfo.configData.user,
    password: dbInfo.configData.password,
    database: dataBase
});

app.get('/', (req, res) => {
    //res.send('See töötab!');
    res.render('index');
});

app.get('/timenow', (req, res) => {
    const dateNow = timeInfo.dateETFormatted();
    const timeNow = timeInfo.timeFormatted();
    //res.render('timenow');
    res.render('timenow', {nowD: dateNow, nowT: timeNow});
});

app.get('/wisdom', (req, res) => {
    let folkWisdom = [];
    fs.readFile('public/txtfiles/vanasonad.txt', 'utf-8', (err, data) => {
        if (err) {
            throw err;
        } else {
            folkWisdom = data.split(';');
            res.render('justlist', {h1: 'Vanasõnad', wisdom: folkWisdom});
        }
    });
});

app.get('/namelist', (req, res) => {
    let userEntries = [];
    fs.readFile('public/txtfiles/log.txt', 'utf-8', (err, data) => {
        if (err) {
            throw err;
        } else {
            data = data.trim();
            userEntries = data.split(';');
            let userData = [];

            for (let value of userEntries){
                userData.push(value.split(',')); 
            }
            let formattedData = [];
            for (let entry of userData){
                if (entry && entry.length >= 3) {
                    const formattedEntry = {
                        firstName: entry[0],
                        lastName: entry[1],
                        date: dateInfo.dateConverter(entry[2], 'ET')
                    };
                    formattedData.push(formattedEntry);
                };
            };
            //console.log(formattedData);
            res.render('justlistnames', {h1: 'Nimekirjed', entries: formattedData});    
        }
    });
});

app.get('/eestifilm', (req, res) => {
    
    res.render('filmindex');
});

app.get('/eestifilm/filmiloend', (req, res) => {
    let sql = 'SELECT title, production_year, duration FROM movie';
    let sqlResult = [];
    conn.query(sql, (err, result)=>{
        if (err) {
            res.render('filmlist', {filmlist: sqlResult});
            throw err;
            //conn.end(); ei kasuta neid, sest kui uuesti leht avada, siis connetion ei avane uuesti
        } else {
            //console.log(result);
            res.render('filmlist', {filmlist: result});
            //conn.end();
        }
    });
    
});

app.get('/eestifilm/addfilmperson', (req, res) => {
    res.render('addfilmperson');
});

app.post('/eestifilm/addfilmperson', (req, res) => {
    //res.render('addfilmperson');
    //res.send(req.body);
    let notice = '';
    let sql = 'INSERT INTO person (first_name, last_name, birth_date) VALUES(?, ?, ?)';
    conn.query(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result)=>{
        if (err) {
            notice = 'Andmete salvestamine ebaõnnestus!';
            res.render('addfilmperson', {notice: notice});
            throw err;
        } else {
            notice = req.body.firstNameInput + ' ' + req.body.lastNameInput + ' salvestamine õnnestus!';
            res.render('addfilmperson', {notice: notice});
        }
    });
});

app.get('/eestifilm/singlemovie', (req, res) => {
    let notice = '';
    let maxSql = 'SELECT COUNT(id) AS maxCount FROM movie';
    conn.query(maxSql, (err, result)=>{
        if (err) {
            notice = 'Andmepäringu viga!';
            res.render('singlemovie', {notice: notice});
            throw err;
        } else {
            let maxCount = result[0].maxCount;
            let movieId = req.query.filmIdInput;
            let sql = 'SELECT title, production_year, duration, description FROM `movie` WHERE id=(?)';
            console.log(movieId)
            conn.query(sql, [movieId], (err, result) => {
                if (err) {
                    notice = 'Andmepäringu viga!';
                    res.render('singlemovie', { notice: notice });
                  } else {
                    console.log(result);
                    res.render('singlemovie',{maxSql: maxCount, film: result});
            }});
        }
    });
});
    //res.render('singlemovie', {maxSql: maxSql}); 
//});

//app.post('/eestifilm/singlemovie', (req,res) => {
    //let movieSql = 'SELECT title, production_year, duration, description FROM `movie` WHERE id=';
    //conn.query(sql, (err, result)=>{
        //if (err) {
            //res.render('singlemovie', {film: movieSql});
            //throw err;
        //} else {
            //console.log(result);
            //res.render('singlemovie', {film: result});
       // }
    //});
//});


//teha leht /eestifilm/singlemovie
//loendame, mitu filmi on ja teeme vormi inputi <input type="number" min="1" max="x" value="1"> ja lisada submit nupp
//x-ile tuleb väärtus index.js faili functionist SELECT COUNT(id) FROM movie
//POST: lugeda andmebaasist kõik valitud numbriga filmi andmed ja ekraanile tuua
//<h3>Pealkiri</h3>
//<p>pealkiri</p>
//<h3>Kestvus</h3>
//<p>kestvus</p>
//SELECT movie WHERE id=(vormis valitud number)

app.listen(5134);