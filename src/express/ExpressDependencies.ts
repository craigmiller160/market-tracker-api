import { PortfolioRepository } from '../data/repo/PortfolioRepository';
import { Express } from 'express';

export interface ExpressDependencies {
	readonly portfolioRepository: PortfolioRepository;
	readonly expressApp: Express;
}
