const express = require('express');
//loome oma rakenduse sees toimiva miniäpi
const router = express.Router(); //Suur algustäht "R" on oluline
const pool = require('../src/databasepool').pool;

//Kuna siin on miniäpp router, siis kõik marsruudid on temaga, mite app'iga seotud
//Kuna kõik siinses marsruudid algavad "/news", siis selle jätame ära

router.get('/', (req, res) => {
    res.render('news');
});

router.get('/add', (req, res) => {
    res.render('addnews');
});

router.post('/add', (req, res) => {
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

router.get('/read', (req, res) => {
    let today = new Date().toISOString().split('T')[0];
    let readNewsSql = 'SELECT * FROM vp_news WHERE expire > ? AND deleted IS NULL ORDER BY id DESC';
    //andmebaasi ühendus pooli kaudu
    pool.getConnection((err, conn)=>{
        if (err) {
            throw err;
        }
        else {
            conn.query(readNewsSql, [today], (err, result) => {
            if (err) {
                throw err;
            } 
            else {
                let newsList = result;
                res.render('readnews', {newsList: newsList});
            }
        });
        }
    });
    //pool.getConnection lõppeb
    
});

router.get('/read/:id', (req, res) => {
    //res.render('readnews');
    let id = req.params.id;
    let newsSql = 'SELECT * FROM vp_news WHERE id = ? AND deleted IS NULL';
    //andmebaasi ühendus pooli kaudu
    pool.getConnection((err, conn)=>{
        if (err) {
            throw err;
        }
        else {
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
        }
    });
    //pool.getConnection lõppeb
});

module.exports = router;