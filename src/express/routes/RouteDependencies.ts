import { PortfolioRepository } from '../../data/repo/PortfolioRepository';
import { Express } from 'express';

export interface RouteDependencies {
	readonly portfolioRepository: PortfolioRepository;
	readonly expressApp: Express;
}
