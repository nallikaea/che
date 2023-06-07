/*********************************************************************
 * Copyright (c) 2019 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { LoginTests } from '../../tests-library/LoginTests';
import { e2eContainer } from '../../configs/inversify.config';
import { CLASSES } from '../../configs/inversify.types';
import { TestConstants } from '../../constants/TestConstants';
import { ProjectAndFileTests } from '../../tests-library/ProjectAndFileTests';
import { WorkspaceHandlingTests } from '../../tests-library/WorkspaceHandlingTests';
import { BrowserTabsUtil } from '../../utils/BrowserTabsUtil';
import { SideBarView, ViewSection } from 'monaco-page-objects';
import { registerRunningWorkspace } from '../MochaHooks';
import { Logger } from '../../utils/Logger';

const stackName: string = 'Java 11 with Quarkus';
const loginTests: LoginTests = e2eContainer.get(CLASSES.LoginTests);
const projectName: string = 'quarkus-quickstarts';
const projectAndFileTests: ProjectAndFileTests = e2eContainer.get(CLASSES.ProjectAndFileTests);
const workspaceHandlingTests: WorkspaceHandlingTests = e2eContainer.get(CLASSES.WorkspaceHandlingTests);
const browserTabsUtil: BrowserTabsUtil = e2eContainer.get(CLASSES.BrowserTabsUtil);

suite(`The ${stackName} userstory ${TestConstants.ENVIRONMENT}`, async function (): Promise<void> {
   let projectSection: ViewSection;
    loginTests.loginIntoChe();
    workspaceHandlingTests.createAndOpenWorkspace(stackName);
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
