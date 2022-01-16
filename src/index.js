const express = require('express');
const { connect } = require('@craigmiller160/covid-19-config-mongo');

const app = express();
app.get('/hello', (req, res) => {
    console.log('Hello request received');
    res.send('Hello World');
});

app.get('/data', async (req, res) => {
    const count = await connect(async (db) => {
        return await db.collection('data').count();
    });
    res.send(`Count: ${count}`);
});

app.listen(8080, () => {
    console.log('Express server running');
})