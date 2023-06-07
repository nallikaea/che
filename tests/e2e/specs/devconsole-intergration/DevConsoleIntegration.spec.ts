/*********************************************************************
 * Copyright (c) 2019-2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { SideBarView, ViewItem, ViewSection } from 'monaco-page-objects';
import { registerRunningWorkspace } from '../MochaHooks';
import { LoginTests } from '../../tests-library/LoginTests';
import { e2eContainer } from '../../configs/inversify.config';
import { CLASSES } from '../../configs/inversify.types';
import { WorkspaceHandlingTests } from '../../tests-library/WorkspaceHandlingTests';
import { ProjectAndFileTests } from '../../tests-library/ProjectAndFileTests';
import { expect } from 'chai';
import { TestConstants } from '../../constants/TestConstants';
import { OcpMainPage } from '../../pageobjects/openshift/OcpMainPage';
import { OcpImportFromGitPage } from '../../pageobjects/openshift/OcpImportFromGitPage';
import { KubernetesCommandLineToolsExecutor } from '../../utils/KubernetesCommandLineToolsExecutor';
import { StringUtil } from '../../utils/StringUtil';
import { OcpApplicationPage } from '../../pageobjects/openshift/OcpApplicationPage';
import { BrowserTabsUtil } from '../../utils/BrowserTabsUtil';
import { Dashboard } from '../../pageobjects/dashboard/Dashboard';

const projectAndFileTests: ProjectAndFileTests = e2eContainer.get(CLASSES.ProjectAndFileTests);
const loginTests: LoginTests = e2eContainer.get(CLASSES.LoginTests);
const workspaceHandlingTests: WorkspaceHandlingTests = e2eContainer.get(CLASSES.WorkspaceHandlingTests);
const ocpMainPage: OcpMainPage = e2eContainer.get(CLASSES.OcpMainPage);
const browserTabsUtil: BrowserTabsUtil = e2eContainer.get(CLASSES.BrowserTabsUtil);
const dashboard: Dashboard = e2eContainer.get(CLASSES.Dashboard);

let ocpImportPage: OcpImportFromGitPage;
let ocpApplicationPage: OcpApplicationPage;
const kubernetesCommandLineToolsExecutor: KubernetesCommandLineToolsExecutor = new KubernetesCommandLineToolsExecutor();

// works only with no-admin user
suite(`DevConsole Integration ${TestConstants.ENVIRONMENT}`, async function (): Promise<void> {
    // test specific data
    const gitImportRepo: string = 'https://github.com/crw-qe/summit-lab-spring-music.git';
    const gitImportReference: string = 'pipeline';
    const projectLabel: string = 'app.openshift.io/runtime=spring';
    const projectName: string = 'devconsole-integration-test';

    suiteSetup('Create new empty project using ocp', async function (): Promise<void> {
        kubernetesCommandLineToolsExecutor.loginToOcp('user');
        kubernetesCommandLineToolsExecutor.createProject(projectName);
    });

    loginTests.loginIntoOcpConsole('user');

    test('Select test project and Developer role on DevConsole', async function (): Promise<void> {
        await ocpMainPage.selectDeveloperRole();
        await ocpMainPage.selectProject(projectName);
    });

    test('Open import from git project page', async function (): Promise<void> {
        ocpImportPage = await ocpMainPage.openImportFromGitPage();
    });

    test('Fill and submit import data', async function (): Promise<void> {
        ocpApplicationPage = await ocpImportPage.fitAndSubmitConfiguration(gitImportRepo, gitImportReference, projectLabel);
    });

    test('Wait until application creates', async function (): Promise<void> {
        await ocpApplicationPage.waitApplicationIcon();
    });

    test('Check if application has worked link "Open Source Code"', async function (): Promise<void> {
        await ocpApplicationPage.waitAndOpenEditSourceCodeIcon();
    });

    loginTests.loginIntoChe('user');

    if (!TestConstants.TS_SELENIUM_BASE_URL.includes('airgap')) {
        workspaceHandlingTests.obtainWorkspaceNameFromStartingPage();

        test('Registering the running workspace', async function (): Promise<void> {
            registerRunningWorkspace(WorkspaceHandlingTests.getWorkspaceName());
        });
        test('Check if application source code opens in workspace', async function (): Promise<void> {
            await projectAndFileTests.waitWorkspaceReadinessForCheCodeEditor();
        });

        test('Check if project and files imported', async function (): Promise<void> {
            const applicationSourceProjectName: string = StringUtil.getProjectNameFromGitUrl(gitImportRepo);
            const projectSection: ViewSection = await new SideBarView().getContent().getSection(applicationSourceProjectName);
            const isFileImported: ViewItem | undefined = await projectSection.findItem(TestConstants.TS_SELENIUM_PROJECT_ROOT_FILE_NAME);
            expect(isFileImported).not.eqls(undefined);
        });

        test('Stop the workspace', async function (): Promise<void> {
            await workspaceHandlingTests.stopWorkspace(WorkspaceHandlingTests.getWorkspaceName());
        });

        test('Delete the workspace', async function (): Promise<void> {
            await browserTabsUtil.closeAllTabsExceptCurrent();
            await workspaceHandlingTests.removeWorkspace(WorkspaceHandlingTests.getWorkspaceName());
        });

    } else {
        test(`Check that workspace cannot be created because disconnected env`, async function (): Promise<void> {
            const loaderAlert: string = await dashboard.getLoaderAlert();
            expect(loaderAlert).contains('403');
        });
    }

    loginTests.logoutFromChe('user');

    suiteTeardown('Delete project using ocp', async function (): Promise<void> {
        kubernetesCommandLineToolsExecutor.deleteProject(projectName);
    });
});
