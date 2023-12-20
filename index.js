const express = require('express');
const fs = require('fs');
const app = express();
//const mysql = require('mysql2'); //kui kõik db asjad poolis, siis pole seda enam vaja 
const bodyparser = require('body-parser');
const timeInfo = require('./src/dateTimeET');
const dateInfo = require('./src/dateTimeET');
//const dbInfo = require('../../vp23config'); //kui kõik db asjad poolis, siis pole seda enam vaja
const pool = require('./src/databasepool').pool;
//Kuna rinde kasutab ajutiselt Inga andmebaasi, siis:
//const dataBase = 'if23_inga_pe_ta';
//fotode laadimiseks
const multer = require('multer');
//seadistame vahevara (middleware), mis määrab üleslaadimise kataloogi
const upload = multer({dest: './public/gallery/orig/'});
const sharp = require('sharp');
const async = require('async');
//paroolide krüpteerimiseks
const bcrypt = require('bcrypt');
//sessioni jälgimine
const session = require('express-session');

app.use(session({secret: 'minuAbsoluutseltSalajaneVõti', saveUninitialized: true, resave: true}));
let mySession;

app.set('view engine', 'ejs'); //view mootor, ejs on üks paljudest mootoritest 
app.use(express.static('public')); //määrame põhikausta, et all pool ei peaks kirjutama "/public/xxx/xxx"
//Kui ainult teksti tahame serverisse saata, siis extended FALSE, kui ka pilte ja video tahame saata, siis TRUE
app.use(bodyparser.urlencoded({extended: true}));

//loon andmebaasi ühenduse
/*const conn = mysql.createConnection({ //kui kõik db asjad poolis, siis pole seda enam vaja
    host: dbInfo.configData.host,
    user: dbInfo.configData.user,
    password: dbInfo.configData.password,
    database: dbInfo.configData.database,
    //table: dbInfo.configData.table
});*/

//marsruudid (routes)

const newsRouter = require('./routes/news');
app.use('/news', newsRouter);

app.get('/', (req, res) => {
    //res.send('See töötab!');
    res.render('index');
});

app.post('/', (req, res) => {
    let notice = 'Sisesta oma kasutaja konto andmed!';
    if (!req.body.emailInput || !req.body.passwordInput) {
        notice = 'Tehnilise vea tõttu ei saa sisse logida!';
        console.log('Paha');
        res.render('index', {notice: notice});
    } 
    else {
        console.log('Hea');
		let sql = 'SELECT id,password FROM vpusers WHERE email = ?';
        //andmebaasi ühendus pooli kaudu
    pool.getConnection((err, conn)=>{
        if (err) {
            throw err;
        }
        else {
            conn.execute(sql, [req.body.emailInput], (err, result)=>{
			if(err) {
				notice = 'Tehnilise vea tõttu ei saa sisse logida!';
				console.log(notice);
                conn.release();
				res.render('index', {notice: notice});
			} 
            else {
				//console.log(result);
				if(result[0] != null){
					console.log(result[0].password);
					bcrypt.compare(req.body.passwordInput, result[0].password, (err, compareresult)=>{
						if(err){
								throw err;
                                conn.release();
						} 
                        else {
							if(compareresult){
                                mySession = req.session;
                                mySession.userName = req.body.emailInput;
                                mySession.userId = result[0].id;
								notice = mySession.userName + ' on sisse loginud!';
								console.log(notice);
                                conn.release();
								res.render('index', {notice: notice});
							} 
                            else {
								notice = 'Kasutajatunnus või parool oli vigane!';
								console.log(notice);
                                conn.release();
								res.render('index', {notice: notice});
							}
						}
					});
				} 
                else {
					notice = 'Kasutajatunnus või parool oli vigane!';
					console.log(notice);
                    conn.release();
					res.render('index', {notice: notice});
				}
			}
		});
        }
    });
    //pool.getConnection lõppeb
	}
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    mySession = null;
    console.log('Logi välja');
    res.redirect('/');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.post('/signup', (req, res) => {
    let notice = 'Ootan andmeid';
    console.log(req.body);
    if (!req.body.firstNameInput || !req.body.lastNameInput || !req.body.genderInput || !req.body.birthInput || !req.body.emailInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput){
        console.log('Andmeid on puudu või pole korrektsed');
        notice = 'Andmeid on puudu või pole korrektsed!';
        res.render('signup', {notice: notice});
    } 
    else {
        console.log('OK');
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(req.body.passwordInput, salt, (err, pwdhash) => {
                let sql = 'INSERT INTO vpusers (firstname, lastname, birthdate, gender, email, password) VALUES(?, ?, ?, ?, ?, ?)';
                //andmebaasi ühendus pooli kaudu
                pool.getConnection((err, conn)=>{
                    if (err) {
                        throw err;
                    }
                    else {
                        conn.execute(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthInput, req.body.genderInput, req.body.emailInput, pwdhash], (err, result) => {
                        if (err) {
                            console.log(err);
                            notice = 'Tehnilistel põhjustel kasutajat ei loodud!'
                            res.render('signup', {notice: notice});
                        } 
                        else {
                            console.log('Kasutaja loodud');
                            notice = 'Kasutaja ' + req.body.emailInput + ' edukalt loodud!';
                            res.render('signup', {notice: notice});
                        }
                    }); 
                    }
                });
                //pool.getConnection lõppeb
            });
        });
    }
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
        } 
        else {
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
        } 
        else {
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
        } 
        else {
            //console.log(result);
            res.render('filmlist', {filmlist: result});
            //conn.end();
        }
    });
    
});

app.get('/eestifilm/addfilmperson', (req, res) => {
    res.render('addfilmperson');
});

app.get('/eestifilm/addfilmrelation', (req, res) => {
    //kasutades async moodulit paneme mitu tegevust paralleelselt tööle
    //kõigepealt loome tegevuste loendi
    const myQueries = [
        function(callback) {
            conn.execute('SELECT id,first_name,last_name FROM person', (err, result) => {
                if (err) {
                    return callback(err);
                } 
                else {
                    return callback(null, result);
                }
            });
        }, 
        function(callback) {
            conn.execute('SELECT id,title FROM movie', (err, result) => {
                if (err) {
                    return callback(err);
                } 
                else {
                    return callback(null, result);
                }
            });
        } //siia saab juurde panna funktsioone komadega
    ];
//paneme kõik tegevused paralleelselt tööle, tulemuseks list ühendtulemustest
    async.parallel(myQueries, (err, results) => {
        if (err) {
            throw err;
        } 
        else {
            //siin kõik asjad, mis on vaja teha 
            console.log(results);
        }
    });

    res.render('addfilmrelation');
});

//kui on valitud näitleja, siis peab sisestama näitleja nime järgmises väljas
//kui on valitud resižöör, siis tegelase nime field on disabled

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
        } 
        else {
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
        } 
        else {
            let maxCount = result[0].maxCount;
            let movieId = req.query.filmIdInput;
            let sql = 'SELECT title, production_year, duration, description FROM `movie` WHERE id=(?)';
            //console.log(movieId)
            conn.query(sql, [movieId], (err, result) => {
                if (err) {
                    notice = 'Andmepäringu viga!';
                    res.render('singlemovie', { notice: notice });
                  } 
                  else {
                    //console.log(result);
                    res.render('singlemovie',{maxSql: maxCount, film: result});
            }});
        }
    });
});
 
/* app.get('/news', (req, res) => {
    res.render('news');
});

app.get('/news/add', (req, res) => {
    res.render('addnews');
});

app.post('/news/add', (req, res) => {
    //res.render('addnews');
    let notice = '';
    let newsAddSql = 'INSERT INTO vp_news (title, content, expire, userid) VALUES(?, ?, ?, ?)';
    const userid = 1;
    //andmebaasi ühendus pooli kaudu
    pool.getConnection((err, conn)=>{
        if (err) {
            throw err;
        }
        else {
            conn.query(newsAddSql, [req.body.titleInput, req.body.contentInput, req.body.expireInput, userid], (err, result) =>{
            if (err) {
                notice = 'Andmete salvestamine ebaõnnestus!';
                res.render('addnews', {notice: notice});
                throw err;
            } 
            else {
                notice = req.body.titleInput + ' pealkirjaga uudise salvestamine õnnestus!';
                res.render('addnews', {notice: notice});
            }
        });
        }
    });
    //pool.getConnection lõppeb
    
});

app.get('/news/read', (req, res) => {
    let today = new Date().toISOString().split('T')[0];
    let readNewsSql = 'SELECT * FROM vp_news WHERE expire > ? AND deleted IS NULL ORDER BY id DESC';
    conn.query(readNewsSql, [today], (err, result) => {
        if (err) {
            throw err;
        } 
        else {
            let newsList = result;
            res.render('readnews', {newsList: newsList});
        }
    });
});

app.get('/news/read/:id', (req, res) => {
    //res.render('readnews');
    let id = req.params.id;
    let newsSql = 'SELECT * FROM vp_news WHERE id = ? AND deleted IS NULL';
    conn.query(newsSql, [id], (err, result) => {
        if (err) {
            throw err;
        } 
        else {
            if (result.length > 0) {
                const newsItem = result[0];
                res.render('newsdetail', {news: newsItem});
            } 
            else {
                throw err;
            }
        }
    });
    //res.send('Tahame uudist, mille ID on: ' + req.params.id);
}); */

app.get('/photoupload', checkLogin, (req, res) => {
    console.log('Sessiooni userid: ' + req.session.userId);
    res.render('photoupload');
});

app.post('/photoupload', upload.single('photoInput'), (req, res) => {
    let notice = '';
    console.log(req.file);
    console.log(req.body);
    //image/jpeg  image/png  image/gif
    const fileName = 'vp_' + Date.now() + '.jpg';
    /*fs.rename(req.file.path, './public/gallery/orig/' + req.file.originalname, (err) => {
        console.log('Faili laadimise viga: ' + err);
    });*/
    fs.rename(req.file.path, './public/gallery/orig/' + fileName, (err) => {
        console.log('Faili laadimise viga: ' + err);
    });
    //loome kaks väiksema mõõduga pildi varianti
    sharp('./public/gallery/orig/' + fileName).resize(800,600).jpeg({quality : 90}).toFile('./public/gallery/normal/' + fileName);
    sharp('./public/gallery/orig/' + fileName).resize(100,100).jpeg({quality : 90}).toFile('./public/gallery/thumbs/' + fileName);

    //foto andmed andmetabelisse
    let sql = 'INSERT INTO vp_gallery (filename, originalname, alttext, privacy, userid) VALUES(?, ?, ?, ?, ?)';
    //const userid = 1;
    //andmebaasi ühendus pooli kaudu
    pool.getConnection((err, conn)=>{
        if (err) {
            throw err;
        }
        else {
            //andmebaasi osa algab
            conn.query(sql, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, req.session.userId], (err, result) => {
            if (err) {
                throw err;
                notice = 'Foto andmete salvestamine ebaõnnestus!';
                res.render('photoupload', {notice: notice});
            } 
            else {
                notice = 'Foto ' + req.file.originalname + ' laeti edukalt üles!';
                res.render('photoupload', {notice: notice});
            }
        });
            //andmebaasi osa lõppeb
        }
    });
    //pool.getConnection lõppeb
    
});

app.get('/photogallery', (req, res) => {
	let photoList = [];
    let privacy = 3;
    if (req.session.userId) {
        privacy = 2;
    }
	let sql = 'SELECT id,filename,alttext FROM vp_gallery WHERE privacy >= ? AND deleted IS NULL ORDER BY id DESC';
    //if(req.session.userId)
    //andmebaasi ühendus pooli kaudu
    pool.getConnection((err, connection)=>{
        if (err) {
            throw err;
        }
        else {
            //andmebaasi osa algab
	        connection.execute(sql, [privacy], (err,result)=>{
		        if (err){
			        throw err;
			        res.render('photogallery', {photoList : photoList});
                    connection.release();
		        } 
                else {
			        photoList = result;
			        res.render('photogallery', {photoList : photoList});
                    connection.release();
		        }
	        });
            //andmebaasi osa lõppeb
        }
    });
    //pool.getConnection lõppeb
});

app.get('/throwingresults', (req, res) => {
    const date = timeInfo.dateSportFormatted();
    // Query to fetch the top three unique competitors with their best result
    let sqlTopThree = `SELECT number, MAX(result) as best_result
                       FROM throwing_results
                       GROUP BY number
                       ORDER BY best_result DESC
                       LIMIT 3`;

    pool.getConnection((err, connection) => {
        if (err) throw err;
        
        connection.query(sqlTopThree, (err, topResults) => {
            if (err) {
                // Handle error, possibly render with an error message
                res.render('throwingresults', { date: date, results: [], topResults: [], notice: "Viga parimate tulemuste laadimisel." });
            } else {
                // Render with top results
                res.render('throwingresults', { date: date, results: [], topResults: topResults, notice: "" });
            }
            connection.release();
        });
    });
});

/*app.post('/throwingresults', (req, res) => {
    const date = timeInfo.dateSportFormatted();
    let notice = '';
    let sql = 'INSERT INTO throwing_results (number, result, date) VALUES(?, ?, ?)';
    let sqlFetch = 'SELECT * FROM throwing_results WHERE number = ? ORDER BY result DESC';
    pool.getConnection((err, connection)=>{
        if (err) {
            throw err;
        }
        else {
            connection.execute(sql, [req.body.athleteNumber, req.body.attemptResult, req.body.attemptDate], (err, result)=>{
                if (err) {
                    notice = 'Andmete salvestamine ebaõnnestus!';
                    res.render('throwingresults', {notice: notice, date: date});
                    connection.release();
                    throw err;
                } 
                else {
                    connection.execute(sqlFetch, [req.body.athleteNumber], (err, results) => {
                        if (err) {
                            notice = 'Tulemuste laadimine ebaõnnestus!';
                            res.render('throwingresults', { notice: notice, date: date });
                        } 
                        else{
                            notice = 'Salvestamine õnnestus!';
                            res.render('throwingresults', {notice: notice, date: date, results: results});
                            connection.release();
                        }
                    
                })
            }
        });
        }
    });
});*/

app.post('/throwingresults', (req, res) => {
    const date = timeInfo.dateSportFormatted();
    let notice = '';
    let sqlCheck = 'SELECT * FROM throwing_results WHERE number = ? AND date = ?';

    pool.getConnection((err, connection) => {
        if (err) throw err;

        connection.query(sqlCheck, [req.body.athleteNumber, req.body.attemptDate], (err, results) => {
            if (err) {
                notice = 'Andmete ebakõla!';
                res.render('throwingresults', { notice: notice, date: date, results: [] });
                connection.release();
            } else if (results.length > 0 && req.body.attemptResult > results[0].result) {
                let sqlUpdate = 'UPDATE throwing_results SET result = ? WHERE number = ? AND date = ?';
                connection.query(sqlUpdate, [req.body.attemptResult, req.body.athleteNumber, req.body.attemptDate], (err, updateResult) => {
                    fetchAndRenderResults();
                });
            } else if (results.length === 0) {
                let sqlInsert = 'INSERT INTO throwing_results (number, result, date) VALUES (?, ?, ?)';
                connection.query(sqlInsert, [req.body.athleteNumber, req.body.attemptResult, req.body.attemptDate], (err, insertResult) => {
                    fetchAndRenderResults();
                });
            } else {
                fetchAndRenderResults();
            }
        });

        function fetchAndRenderResults() {
            // Existing query to fetch individual results
            connection.query('SELECT * FROM throwing_results WHERE number = ? ORDER BY result DESC', [req.body.athleteNumber], (err, individualResults) => {
                if (err) {
                    // Handle error for individual results
                    notice = 'Tulemuste laadimine ebaõnnestus!';
                    res.render('throwingresults', { notice: notice, date: date, results: individualResults, topResults: [] });
                    connection.release();
                } else {
                    // New query to fetch top three unique competitors
                    let sqlTopThree = `SELECT number, MAX(result) as best_result
                                       FROM throwing_results
                                       GROUP BY number
                                       ORDER BY best_result DESC
                                       LIMIT 3`;
                    connection.query(sqlTopThree, (err, topResults) => {
                        if (err) {
                            // Handle error for top results
                            notice = 'Parimate tulemuste laadimine ebaõnnestus!';
                        } else {
                            // Success, render page with both individual and top results
                            notice = 'Salvestamine õnnestus!';
                            res.render('throwingresults', { notice: notice, date: date, results: individualResults, topResults: topResults });
                        }
                        connection.release();
                    });
                }
            });
        }
    });
});


function checkLogin(req, res, next){
    console.log('Kontrollime sisselogimist');
    if (mySession != null) {
        if (mySession.userName) {
            console.log('Sisse logitud!');
            next();
        } 
        else {
            console.log('Ei ole sessiooni');
            res.redirect('/');
        }
    }
    else {
        res.redirect('/');
    }
    next();
}

app.listen(5134);

//eksamil on vaja luua marsruut või mitu marsruuti
//kindlasti andmebaasist väljastamine ja andmebaasi kirjutamine
//SQL kohta võib küsimusi küsida eksami ajal
//HTML kohta ka??
//aega 10.00-14.30
//võib kasutada tundides tehtud materjale, kopeerida tundides tehtud asju
//Eksami teeme Veeb1 kataloogi
//SQL --- SELECT number, visketulemus ORDER BY visketulemus DESC LIMIT 3 (väljastab kolm tulemust ja paneb kahanevasse järekorda)