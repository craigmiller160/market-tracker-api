import express from 'express';
// import { connect } from '@craigmiller160/covid-19-config-mongo';
import mongoose from 'mongoose';
import getConnectString from './connectString';
const { Schema, model } = mongoose;
// const getConnectString = require('./connectString')

const dataSchema = new Schema({
    name: String,
    age: Number
});
const DataModel = model('data', dataSchema, 'data');

const app = express();
app.get('/hello', (req, res) => {
    console.log('Hello request received');
    res.send('Hello World');
});

// app.get('/data', async (req, res) => {
//     console.log('Received data request');
//     const data = await connect(async (db) => {
//         return await db.collection('data').find().toArray();
//     });
//     console.log('Sending data response', data);
//     res.json(data);
// });

app.get('/mongooseData', async (req, res) => {
    console.log('Received request for Mongoose data');
    const data = await DataModel.find().exec();
    console.log('Sending mongoose data response', data);
    res.json(data);
});

mongoose.set('debug', true);

getConnectString()
    .then((connectionString) => {
        console.log('Connecting to Mongoose', connectionString)
        return mongoose.connect(connectionString);
    })
    .then(() => {
        app.listen(8080, () => {
            console.log('Express server running');
        })
    })
    .catch((ex) => {
        console.error('Critical error during startup');
        console.error(ex);
    })