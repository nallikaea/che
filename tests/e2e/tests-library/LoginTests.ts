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
import { ITestWorkspaceUtil } from '../utils/workspace/ITestWorkspaceUtil';
import { Logger } from '../utils/Logger';
import { registerRunningWorkspace } from '../specs/MochaHooks';

@injectable()
export class LoginTests {
    constructor(
        @inject(CLASSES.BrowserTabsUtil) private readonly browserTabsUtil: BrowserTabsUtil,
        @inject(TYPES.CheLogin) private readonly productLoginPage: ICheLoginPage,
        @inject(TYPES.OcpLogin) private readonly ocpLoginPage: IOcpLoginPage,
        @inject(CLASSES.Dashboard) private readonly dashboard: Dashboard,
        @inject(TYPES.WorkspaceUtil) private readonly workspaceUtil: ITestWorkspaceUtil) {
    }

    loginIntoChe(ocpUsername?: string): void {
        test('Login', async () => {
            if (!(await this.browserTabsUtil.getCurrentUrl()).includes(TestConstants.TS_SELENIUM_BASE_URL)) {
                await this.browserTabsUtil.navigateTo(TestConstants.TS_SELENIUM_BASE_URL);
            }
            await this.productLoginPage.login(ocpUsername);
            await this.browserTabsUtil.maximize();
            await this.dashboard.waitStartingPageLoaderDisappearance();
        });
    }

    loginIntoOcpConsole(ocpUsername?: string): void {
        test('Login into ocp console', async () => {
            const openshiftConsoleUrl: string =  TestConstants.TS_SELENIUM_BASE_URL.replace('devspaces', 'console-openshift-console');
            await this.browserTabsUtil.navigateTo(openshiftConsoleUrl);
            await this.ocpLoginPage.login(ocpUsername);
            await this.browserTabsUtil.maximize();
        });
    }

    logoutFromChe(ocpUser?: string): void {
        test('Logout', async () => {
            const namespace: string = ocpUser ?
                ocpUser + '-devspaces'
                : TestConstants.TS_SELENIUM_OCP_USERNAME + '-devspaces';
            try {
                await this.workspaceUtil.deleteAllWorkspaces(namespace);
            } catch (e) {
                Logger.error(`${this.constructor.name}.${this.logoutFromChe.name} - ${e}`);
            }
            await this.dashboard.logout(ocpUser);
        });
        registerRunningWorkspace('');
    }
}
