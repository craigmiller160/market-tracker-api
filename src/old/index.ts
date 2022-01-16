import {app} from './express';
import {connectToMongoose} from './mongoose';

connectToMongoose()
    .then(() => {
        app.listen(8080, () => {
            console.log('Express server running');
        })
    })
    .catch((ex) => {
        console.error('Critical error during startup');
        console.error(ex);
    })