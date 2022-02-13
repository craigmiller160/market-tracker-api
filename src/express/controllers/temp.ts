// TODO delete this
import * as tempService from '../../services/routes/TempService';
import { Controller } from './Controller';
import { secure2 } from '../auth/secure2';

export const hello: Controller = () => secure2(tempService.hello);
