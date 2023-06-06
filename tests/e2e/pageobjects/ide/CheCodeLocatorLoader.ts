/*********************************************************************
 * Copyright (c) 2019 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/
import { LocatorLoader } from 'monaco-page-objects/out/locators/loader';
import { getLocatorsPath } from 'vscode-extension-tester-locators';
import { LocatorDiff, Locators } from 'monaco-page-objects';
import { By } from 'selenium-webdriver';
import clone from 'clone-deep';
import { TestConstants } from '../../constants/TestConstants';

/**
 * This class allows us to change or add some specific locators base on "monaco-page-object" and "vscode-extension-tester-locators".
 * Use method webLocatorDiff(). To change place locator into field "locators", to add - "extras".
 * To see full locators list check "node_modules/vscode-extension-tester-locators/out/lib".
 */

export class CheCodeLocatorLoader extends LocatorLoader {
    readonly webCheCodeLocators: Locators;

    constructor() {
        super(TestConstants.TS_SELENIUM_MONACO_PAGE_OBJECTS_BASE_VERSION, TestConstants.TS_SELENIUM_MONACO_PAGE_OBJECTS_BASE_VERSION, getLocatorsPath());
        this.webCheCodeLocators = this.mergeLocators() as Locators;
    }

    private webLocatorDiff(): LocatorDiff {
        return {
            locators: {
                WelcomeContent: {
                    text: By.xpath('//*[@class="dialog-message-text" and contains(text(), "trust")]'),
                    button: By.xpath('//a[contains(., "trust")]')
                },
            },
            extras: {
                ExtensionsViewSection: {
                    requireReloadButton: By.xpath('//a[text()=\'Reload Required\']')
                }
            }
        };
    }

    private merge(target: any, obj: any): object {
        for (const key in obj) {
            if (!Object.prototype.hasOwnProperty.call(obj, key)) {
                continue;
            }

            let oldVal: any = obj[key];
            let newVal: any = target[key];

            if (typeof (newVal) === 'object' && typeof (oldVal) === 'object') {
                target[key] = this.merge(newVal, oldVal);
            } else {
                target[key] = clone(oldVal);
            }
        }
        return target;
    }

    private mergeLocators(): Locators {
        const target: Locators = super.loadLocators();

        this.merge(target, this.webLocatorDiff().locators as Locators);
        this.merge(target, this.webLocatorDiff().extras as Locators);

        return target;
    }
}

