/*********************************************************************
 * Copyright (c) 2019-2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { CLASSES, TYPES } from '../configs/inversify.types';
import { ICheLoginPage } from '../pageobjects/login/ICheLoginPage';
import { TestConstants } from '../constants/TestConstants';
import { BrowserTabsUtil } from '../utils/BrowserTabsUtil';
import { inject, injectable } from 'inversify';
import { Dashboard } from '../pageobjects/dashboard/Dashboard';
import { IOcpLoginPage } from '../pageobjects/login/IOcpLoginPage';

@injectable()
export class LoginTests {
    constructor(
        @inject(CLASSES.BrowserTabsUtil) private readonly browserTabsUtil: BrowserTabsUtil,
        @inject(TYPES.CheLogin) private readonly productLoginPage: ICheLoginPage,
        @inject(TYPES.OcpLogin) private readonly ocpLoginPage: IOcpLoginPage,
        @inject(CLASSES.Dashboard) private readonly dashboard: Dashboard) {
    }

    public loginIntoChe(): void {
        test('Login', async () => {
            if (!(await this.browserTabsUtil.getCurrentUrl()).includes(TestConstants.TS_SELENIUM_BASE_URL)) {
                await this.browserTabsUtil.navigateTo(TestConstants.TS_SELENIUM_BASE_URL);
            }
            await this.productLoginPage.login();
            await this.browserTabsUtil.maximize();
            await this.dashboard.waitStartingPageLoaderDisappearance();
        });
    }

    public loginIntoOcpConsole(): void {
        test('Login into ocp console', async () => {
            const openshiftConsoleUrl: string =  TestConstants.TS_SELENIUM_BASE_URL.replace('devspaces', 'console-openshift-console');
            await this.browserTabsUtil.navigateTo(openshiftConsoleUrl);
            await this.ocpLoginPage.login();
            await this.browserTabsUtil.maximize();
        });
    }

    public logoutFromChe(): void {
        test('Logout', async () => {
            await this.dashboard.logout();
        });
    }
}
