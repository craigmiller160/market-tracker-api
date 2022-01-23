import { PortfolioRepository } from './PortfolioRepository';
import {
	findPortfoliosForUser,
	savePortfoliosForUser
} from './mongo/MongoPortfolioRepository';

export const portfolioRepository: PortfolioRepository = {
	findPortfoliosForUser,
	savePortfoliosForUser
};
