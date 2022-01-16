const jestConfig = require('@craigmiller160/jest-config');
const jestTsConfig = require('@craigmiller160/jest-config-ts');
const merge = require('@craigmiller160/config-merge');
const path = require('path');

module.exports = merge(jestConfig, jestTsConfig, {
    testEnvironment: 'node',
    setupFilesAfterEnv: [
        path.join(process.cwd(), 'test', 'setup.ts')
    ]
});
