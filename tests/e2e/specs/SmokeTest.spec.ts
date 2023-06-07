/*********************************************************************
 * Copyright (c) 2023 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/
import { SideBarView, ViewSection } from 'monaco-page-objects';
import { ProjectAndFileTests } from '../tests-library/ProjectAndFileTests';
import { CLASSES } from '../configs/inversify.types';
import { e2eContainer } from '../configs/inversify.config';
import { WorkspaceHandlingTests } from '../tests-library/WorkspaceHandlingTests';
import { registerRunningWorkspace } from './MochaHooks';
import { Logger } from '../utils/Logger';
import { LoginTests } from '../tests-library/LoginTests';
import { BrowserTabsUtil } from '../utils/BrowserTabsUtil';
import { TestConstants } from '../constants/TestConstants';

const factoryUrl: string = 'https://github.com/nallikaea/hello-world';
const projectName: string = 'hello-world';
const projectAndFileTests: ProjectAndFileTests = e2eContainer.get(CLASSES.ProjectAndFileTests);
const workspaceHandlingTests: WorkspaceHandlingTests = e2eContainer.get(CLASSES.WorkspaceHandlingTests);
const loginTests: LoginTests = e2eContainer.get(CLASSES.LoginTests);
const browserTabsUtil: BrowserTabsUtil = e2eContainer.get(CLASSES.BrowserTabsUtil);
let projectSection: ViewSection;

suite(`Import from a Git repository to create workspace using "Create Workspace" dashboard page ${TestConstants.ENVIRONMENT}`, async function (): Promise<void> {
    loginTests.loginIntoChe();
    workspaceHandlingTests.createAndOpenWorkspaceFromGitRepository(factoryUrl);
    workspaceHandlingTests.obtainWorkspaceNameFromStartingPage();
    test('Register running workspace', async () => {
        registerRunningWorkspace(WorkspaceHandlingTests.getWorkspaceName());
    });
    test('Wait workspace readiness', async function (): Promise<void> {
        await projectAndFileTests.waitWorkspaceReadinessForCheCodeEditor();
    });
    test('Check a project folder has been created', async function (): Promise<void> {
        projectSection = await new SideBarView().getContent().getSection(projectName);
        Logger.debug(`new SideBarView().getContent().getSection: get ${projectName}`);
    });
    test('Check the project files was imported', async function (): Promise<void> {
        const label: string = 'devfile.yaml';
        await projectSection.findItem(label);
        Logger.debug(`projectSection.findItem: find ${label}`);
    });

    test('Stop the workspace', async function (): Promise<void> {
        await workspaceHandlingTests.stopWorkspace(WorkspaceHandlingTests.getWorkspaceName());
        await browserTabsUtil.closeAllTabsExceptCurrent();
    });

    test('Delete the workspace', async function (): Promise<void> {
        await workspaceHandlingTests.removeWorkspace(WorkspaceHandlingTests.getWorkspaceName());
    });

    loginTests.logoutFromChe();
});
