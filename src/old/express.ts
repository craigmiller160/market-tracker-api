import express from 'express';
import {DataModel} from './mongoose';

const app = express();
app.get('/hello', (req, res) => {
    console.log('Hello request received');
    res.send('Hello World');
});

app.get('/mongooseData', async (req, res) => {
    console.log('Received request for Mongoose data');
    const data = await DataModel.find().exec();
    console.log('Sending mongoose data response', data);
    res.json(data);
});

export {
    app
}