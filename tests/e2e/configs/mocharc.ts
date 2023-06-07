'use strict';

import { TestConstants } from '../constants/TestConstants';

module.exports = {
    timeout: 120000,
    setTimeout: 72000,
    slow: 60000,
    reporter: 'mocha-multi-reporters',
    reporterOptions: 'configFile=configs/reporters-config.json',
    ui: 'tdd',
    extension: ['js', 'cjs', 'mjs'],
    require: [
        'dist/specs/MochaHooks.js',
        'ts-node/register',
    ],
    bail: TestConstants.STOP_ON_TEST_FAIL,
    'full-trace': true,
    spec: TestConstants.ENVIRONMENT !== 'local run' ?
        `dist/suits/${process.env.ARCH_VERSION}/${process.env.OCP_VERSION}/${process.env.MOCHA_SUITE}.suite.js`
    // variable MOCHA_DIRECTORY uses in command "test-all-devfiles" and sets up automatically.
    // you can set it up to run files from specific directory with export environmental variable.
: process.env.MOCHA_DIRECTORY ?
        // to run one file (name without extension). uses in "test", "test-all-devfiles".
        process.env.USERSTORY ?
            `dist/specs/${process.env.MOCHA_DIRECTORY}/${process.env.USERSTORY}.spec.js`
            : `dist/specs/${process.env.MOCHA_DIRECTORY}/**.spec.js`
        : process.env.USERSTORY ?
            [`dist/specs/**/${process.env.USERSTORY}.spec.js`, `dist/specs/${process.env.USERSTORY}.spec.js`]
             : [`dist/specs/**/**.spec.js`, `dist/specs/**.spec.js`],
    retries: TestConstants.TS_SELENIUM_DEFAULT_ATTEMPTS,
};
