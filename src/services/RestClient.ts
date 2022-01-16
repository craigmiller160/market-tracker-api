import axios from 'axios';
import https from 'https';

export const restClient = axios.create({
	httpsAgent: new https.Agent({
		rejectUnauthorized: false
	})
});
