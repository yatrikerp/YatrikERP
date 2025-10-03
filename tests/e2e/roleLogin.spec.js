const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { runTests, ROLES, BASE_URL } = require('../roleLoginTests');

describe('Yatrik ERP - Role Login/Logout', function () {
    this.timeout(120000);

    it('runs the standalone role login/logout suite', async () => {
        await runTests();
    });
});


