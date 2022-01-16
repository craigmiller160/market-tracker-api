import {app} from './old/express';
import { connectToMongo } from './mongo';
import {pipe} from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither'

pipe(
    connectToMongo(),
    TE.map(() => {
        app.listen(8080, () => {
            console.log('Express server running');
        })
    }),
    TE.mapLeft((ex) => {
        console.error('Critical error during startup');
        console.error(ex);
    })
)()