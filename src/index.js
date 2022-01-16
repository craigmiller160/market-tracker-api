const express = require('express');

const app = express();
app.get('/hello', (req, res) => {
    console.log('Hello request received');
    res.send('Hello World');
});

app.listen(8080, () => {
    console.log('Express server running');
})