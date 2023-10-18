const express = require('express');
const timeInfo = require('./dateTimeET');
const dateInfo = require('./dateTimeET');
const fs = require('fs');
const app = express();

app.set('view engine', 'ejs'); //view mootor, ejs on üks paljudest mootoritest 
app.use(express.static('public'));

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
            console.log(formattedData);
            res.render('justlistnames', {h1: 'Nimekirjed', entries: formattedData});    
        }
    });
});


/*              let allData = data.split(";");
                let allNames = [];
				listAndmedOut = '\n\t<ul>';
				for (person of allData){
					allNames.push(person.split(',')); 
				}
				//console.log(allNames);
				for (person of allNames){
					if(person[0]){   //küsib kas masiivi viimasel elemendil on nimi või mitte ja teeb ainult siis list itemi
						listAndmedOut += '\n\t\t<li>' + person[0] + ' ' + person[1] + ', salvestatud: ' + person[2] + '</li>';
					}
				}
				listAndmedOut += '\n\t</ul>'
				andmedPage(res, listAndmedOut);*/


app.listen(5134);