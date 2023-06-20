/*********************************************************************
 * Copyright (c) 2019 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/
import 'reflect-metadata';
import { injectable, inject } from 'inversify';
import { RedHatLoginPage } from './RedHatLoginPage';
import { CLASSES } from '../../configs/inversify.types';
import { By } from 'selenium-webdriver';
import { TimeoutConstants } from '../../constants/TimeoutConstants';
import { ICheLoginPage } from './ICheLoginPage';
import { OcpLoginPage } from '../openshift/OcpLoginPage';
import { DriverHelper } from '../../utils/DriverHelper';
import { Logger } from '../../utils/Logger';

@injectable()
export class OcpRedHatLoginPage implements ICheLoginPage {

    private readonly OPEN_SHIFT_LOGIN_LANDING_PAGE_LOCATOR: string = `//div[@class='panel-login']`;
    private readonly OPEN_SHIFT_LOGIN_LANDING_PAGE_BUTTON_LOCATOR: string = `${this.OPEN_SHIFT_LOGIN_LANDING_PAGE_LOCATOR}/div[contains(@class, 'panel-content')]/form/button`;

    constructor(
        @inject(CLASSES.OcpLoginPage) private readonly ocpLogin: OcpLoginPage,
        @inject(CLASSES.RedHatLoginPage) private readonly redHatLogin: RedHatLoginPage,
        @inject(CLASSES.DriverHelper) private readonly driverHelper: DriverHelper) { }

    async login(ocpUsername?: string): Promise<void> {
        Logger.debug('OcpRedHatLoginPage.login');

        Logger.debug('OcpRedHatLoginPage.login wait for LogInWithOpenShift page and click button');
        await this.driverHelper.waitPresence(By.xpath(this.OPEN_SHIFT_LOGIN_LANDING_PAGE_LOCATOR), TimeoutConstants.TS_SELENIUM_LOAD_PAGE_TIMEOUT);
        await this.driverHelper.waitAndClick(By.xpath(this.OPEN_SHIFT_LOGIN_LANDING_PAGE_BUTTON_LOCATOR));

        await this.ocpLogin.isIdentityProviderLinkVisible();
        await this.ocpLogin.clickOnLoginProviderTitle();

        await this.redHatLogin.waitRedHatLoginWelcomePage();
        await this.redHatLogin.enterUserNameRedHat(ocpUsername);
        await this.redHatLogin.clickNextButton();
        await this.redHatLogin.enterPasswordRedHat();
        await this.redHatLogin.clickOnLoginButton();
        await this.redHatLogin.waitDisappearanceRedHatLoginWelcomePage();
    }
}
