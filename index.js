const express = require('express');
const app = express();

app.set('view engine', 'ejs'); //view mootor, ejs on üks paljudest mootoritest 

app.get('/', (req, res) => {
    //res.send('See töötab!');
    res.render('index');
});

app.get('/test', (req, res) => {
    res.send('Test töötab suurepäraselt!');
});

app.listen(5134);