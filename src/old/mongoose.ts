import mongoose, {model, Schema} from 'mongoose';
import {buildMongoConnectionString} from './connectString';

export const dataSchema = new Schema({
    name: String,
    age: Number
});
export const DataModel = model('data', dataSchema, 'data');

mongoose.set('debug', true);

export const connectToMongoose = () =>
    buildMongoConnectionString()
        .then((connectionString) => {
            console.log('Connecting to Mongoose', connectionString)
            return mongoose.connect(connectionString);
        })