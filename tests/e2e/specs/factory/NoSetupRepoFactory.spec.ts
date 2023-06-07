/*********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import 'reflect-metadata';
import { e2eContainer } from '../../configs/inversify.config';
import {
    ActivityBar,
    ContextMenu,
    EditorView,
    error,
    InputBox,
    Locators,
    ModalDialog,
    NewScmView,
    SideBarView,
    SingleScmProvider,
    TextEditor,
    ViewControl,
    ViewItem,
    ViewSection
} from 'monaco-page-objects';
import { expect } from 'chai';
import { StringUtil } from '../../utils/StringUtil';
import { CheCodeLocatorLoader } from '../../pageobjects/ide/CheCodeLocatorLoader';
import { registerRunningWorkspace } from '../MochaHooks';
import { BrowserTabsUtil } from '../../utils/BrowserTabsUtil';
import { CLASSES } from '../../configs/inversify.types';
import { WorkspaceHandlingTests } from '../../tests-library/WorkspaceHandlingTests';
import { ProjectAndFileTests } from '../../tests-library/ProjectAndFileTests';
import { DriverHelper } from '../../utils/DriverHelper';
import { Dashboard } from '../../pageobjects/dashboard/Dashboard';
import { Workspaces } from '../../pageobjects/dashboard/Workspaces';
import { GitProviderType, TestConstants } from '../../constants/TestConstants';
import { Logger } from '../../utils/Logger';
import { LoginTests } from '../../tests-library/LoginTests';
import WebDriverError = error.WebDriverError;

const browserTabsUtil: BrowserTabsUtil = e2eContainer.get(CLASSES.BrowserTabsUtil);
const workspaceHandlingTests: WorkspaceHandlingTests = e2eContainer.get(CLASSES.WorkspaceHandlingTests);
const projectAndFileTests: ProjectAndFileTests = e2eContainer.get(CLASSES.ProjectAndFileTests);
const webCheCodeLocators: Locators = new CheCodeLocatorLoader().webCheCodeLocators;
const driverHelper: DriverHelper = e2eContainer.get(CLASSES.DriverHelper);
const dashboard: Dashboard = e2eContainer.get(CLASSES.Dashboard);
const workspaces: Workspaces = e2eContainer.get(CLASSES.Workspaces);
const loginTests: LoginTests = e2eContainer.get(CLASSES.LoginTests);

const repositorySets: object[] = [
    {
        gitProvider: 'github',
        branchName: 'master',
        isPrivate: true,
        username: 'crw_test_user',
        password: process.env.GITHUB_PASS,
        repoUrl: 'https://github.com/crw_test_user/repo',
    },
    {
        gitProvider: 'github',
        branchName: 'master',
        isPrivate: false,
        username: 'crw_test_user',
        password: process.env.GITHUB_PASS,
        repoUrl: 'https://github.com/crw_test_user/repo',
    },
    {
        gitProvider: 'gitlab',
        branchName: 'master',
        username: 'crw_test_user',
        password: process.env.GITLAB_PASS,
        isPrivate: false,
        repoUrl: 'https://gitlab.com/crw_test_user/repo',
    },
    {
        gitProvider: 'gitlab',
        branchName: 'master',
        username: 'crw_test_user',
        password: '',
        isPrivate: true,
        repoUrl: 'https://gitlab.com/crw_test_user/repo',
    },
    {
        gitProvider: 'bitbucket',
        branchName: 'master',
        username: 'crw_test_user',
        password: '',
        isPrivate: true,
        repoUrl: 'https://bitbucket.org/crw_test_user/private-bb-repo.git',
    },
    {
        gitProvider: 'bitbucket',
        branchName: 'master',
        username: 'crw_test_user',
        password: '',
        isPrivate: false,
        repoUrl: 'https://bitbucket.org/crw_test_user/public-bb-repo.git',
    },
];
repositorySets.forEach((repository: any) => {
    const isPrivateRepo: string = repository.isPrivate ? 'private' : 'public';
    suite(`Create a workspace via launching a factory from the ${isPrivateRepo} ${repository.gitProvider} repository without OAuth setup ${TestConstants.ENVIRONMENT}`, async function (): Promise<void> {

        let projectSection: ViewSection;
        let scmProvider: SingleScmProvider;
        let rest: SingleScmProvider[];
        let scmContextMenu: ContextMenu;

        // test specific data
        let numberOfCreatedWorkspaces: number = 0;
        const timeToRefresh: number = 1500;
        const changesToCommit: string = (new Date()).getTime().toString();
        const fileToChange: string = 'Date.txt';
        const pushItemLabel: string = 'Push';
        const commitChangesButtonLabel: string = `Commit Changes on "${repository.branchName}"`;
        const refreshButtonLabel: string = 'Refresh';
        const label: string = 'devfile.yaml';
        let testRepoProjectName: string;

        loginTests.loginIntoChe();

        test('Get number of previously created workspaces', async function (): Promise<void> {
            await dashboard.clickWorkspacesButton();
            await workspaces.waitPage();
            numberOfCreatedWorkspaces = (await workspaces.getAllCreatedWorkspacesNames()).length;
        });

        test(`Navigate to the ${isPrivateRepo} repository factory URL`, async function (): Promise<void> {
            await browserTabsUtil.navigateTo(TestConstants.TS_SELENIUM_BASE_URL + '/dashboard/#/' + repository.repoUrl);
        });

        if (repository.isPrivate) {

            test(`Check that workspace cannot be created without OAuth for ${isPrivateRepo} repo`, async function (): Promise<void> {
                await dashboard.waitLoader();
                const loaderAlert: string = await dashboard.getLoaderAlert();
                expect(loaderAlert).contains.oneOf(['Cause: Unsupported OAuth provider', 'Cause: No PersonalAccessTokenFetcher configured']);
            });

            test(`Check that workspace was not created`, async function (): Promise<void> {
                await dashboard.openDashboard();
                await dashboard.clickWorkspacesButton();
                await workspaces.waitPage();
                const allCreatedWorkspacesNames: string[] = await workspaces.getAllCreatedWorkspacesNames();
                expect(allCreatedWorkspacesNames).has.length(numberOfCreatedWorkspaces);
            });

            loginTests.logoutFromChe();

        } else {
            workspaceHandlingTests.obtainWorkspaceNameFromStartingPage();

            test('Registering the running workspace', async function (): Promise<void> {
                registerRunningWorkspace(WorkspaceHandlingTests.getWorkspaceName());
            });

            test('Wait the workspace readiness', async function (): Promise<void> {
                await projectAndFileTests.waitWorkspaceReadinessForCheCodeEditor();
            });

            test('Check if a project folder has been created', async function (): Promise<void> {
                testRepoProjectName = StringUtil.getProjectNameFromGitUrl(repository.repoUrl);
                Logger.debug(`new SideBarView().getContent().getSection: get ${testRepoProjectName}`);
                projectSection = await new SideBarView().getContent().getSection(testRepoProjectName);
            });

            test('Accept the project as a trusted one', async function (): Promise<void> {
                // click somewhere to trigger "Welcome Content" dialog
                try {
                    await driverHelper.waitAndClick(webCheCodeLocators.Workbench.notificationItem);
                } catch (e) {
                    Logger.info(`Click on ${webCheCodeLocators.Workbench.notificationItem} to get "Welcome Content" dialog ${e as string}`);
                }
                // "Welcome Content" dialog can be shown before of after dialog with an error for private repo
                try {
                    const buttonYesITrustTheAuthors: string = `Yes, I trust the authors`;
                    await driverHelper.waitVisibility(webCheCodeLocators.WelcomeContent.text);
                    const welcomeContentDialog: ModalDialog = new ModalDialog();
                    Logger.debug(`trustedProjectDialog.pushButton: "${buttonYesITrustTheAuthors}"`);
                    await welcomeContentDialog.pushButton(buttonYesITrustTheAuthors);
                    await driverHelper.waitDisappearance(webCheCodeLocators.WelcomeContent.text);
                } catch (e) {
                    Logger.info(`"Accept the project as a trusted one" dialog was not shown firstly for "${isPrivateRepo}"`);
                    if (!repository.isPrivate) {
                        throw new WebDriverError(e as string);
                    }
                }
            });

            test('Check if the project files were imported', async function (): Promise<void> {
                Logger.debug(`projectSection.findItem: find ${label}`);
                const isFileImported: ViewItem | undefined = await projectSection.findItem(label);
                // projectSection.findItem(label) can return undefined but test will goes on
                expect(isFileImported).not.eqls(undefined);
            });

            test('Make changes to the file', async function (): Promise<void> {
                Logger.debug(`projectSection.openItem: "${fileToChange}"`);
                await projectSection.openItem(fileToChange);
                const editor: TextEditor = await new EditorView().openEditor(fileToChange) as TextEditor;
                await driverHelper.waitVisibility(webCheCodeLocators.Editor.inputArea);
                Logger.debug(`editor.clearText`);
                await editor.clearText();
                Logger.debug(`editor.typeTextAt: "${changesToCommit}"`);
                await editor.typeTextAt(1, 1, changesToCommit);
            });

            test('Open a source control manager', async function (): Promise<void> {
                const viewSourceControl: string = `Source Control`;
                const sourceControl: ViewControl = await new ActivityBar().getViewControl(viewSourceControl) as ViewControl;
                Logger.debug(`sourceControl.openView: "${viewSourceControl}"`);
                await sourceControl.openView();
                const scmView: NewScmView = new NewScmView();
                await driverHelper.waitVisibility(webCheCodeLocators.ScmView.actionConstructor(commitChangesButtonLabel));
                [scmProvider, ...rest] = await scmView.getProviders();
                Logger.debug(`scmView.getProviders: "${scmProvider}, ${scmProvider}"`);
            });

            test('Check if the changes are displayed in the source control manager', async function (): Promise<void> {
                await driverHelper.waitVisibility(webCheCodeLocators.ScmView.more);
                await driverHelper.wait(timeToRefresh);
                Logger.debug(`scmProvider.takeAction: "${refreshButtonLabel}"`);
                await scmProvider.takeAction(refreshButtonLabel);
                // wait while changes counter will be refreshed
                await driverHelper.wait(timeToRefresh);
                const changes: number = await scmProvider.getChangeCount();
                Logger.debug(`scmProvider.getChangeCount: number of changes is "${changes}"`);
                expect(changes).eql(1);
            });

            test('Stage the changes', async function (): Promise<void> {
                await driverHelper.waitVisibility(webCheCodeLocators.ScmView.more);
                Logger.debug(`scmProvider.openMoreActions`);
                scmContextMenu = await scmProvider.openMoreActions();
                await driverHelper.waitVisibility(webCheCodeLocators.ContextMenu.contextView);
                Logger.debug(`scmContextMenu.select: "Changes" -> "Stage All Changes"`);
                await scmContextMenu.select('Changes', 'Stage All Changes');
            });

            test('Commit the changes', async function (): Promise<void> {
                await driverHelper.waitVisibility(webCheCodeLocators.ScmView.actionConstructor(commitChangesButtonLabel));
                Logger.debug(`scmProvider.commitChanges: commit name "Commit ${changesToCommit}"`);
                await scmProvider.commitChanges('Commit ' + changesToCommit);
                await driverHelper.waitVisibility(webCheCodeLocators.ScmView.more);
                await driverHelper.wait(timeToRefresh);
                Logger.debug(`scmProvider.takeAction: "${refreshButtonLabel}"`);
                await scmProvider.takeAction(refreshButtonLabel);
                // wait while changes counter will be refreshed
                await driverHelper.wait(timeToRefresh);
                const changes: number = await scmProvider.getChangeCount();
                Logger.debug(`scmProvider.getChangeCount: number of changes is "${changes}"`);
                expect(changes).eql(0);
            });

            test('Push the changes', async function (): Promise<void> {
                await driverHelper.waitVisibility(webCheCodeLocators.ScmView.actionConstructor(`Push 1 commits to origin/${repository.branchName}`));
                await driverHelper.waitVisibility(webCheCodeLocators.ScmView.more);
                Logger.debug(`scmProvider.openMoreActions`);
                scmContextMenu = await scmProvider.openMoreActions();
                await driverHelper.waitVisibility(webCheCodeLocators.ContextMenu.itemConstructor(pushItemLabel));
                Logger.debug(`scmContextMenu.select: "${pushItemLabel}"`);
                await scmContextMenu.select(pushItemLabel);
            });

            if (repository.gitProvider === GitProviderType.GITHUB) {
                test('Decline GitHub Extension', async function (): Promise<void> {
                    await driverHelper.waitVisibility(webCheCodeLocators.Dialog.details);
                    const gitHaExtensionDialog: ModalDialog = new ModalDialog();
                    await gitHaExtensionDialog.pushButton('Cancel');
                });
            }

            test('Insert git credentials which were asked after push', async function (): Promise<void> {
                await driverHelper.waitVisibility(webCheCodeLocators.InputBox.message);
                const input: InputBox = new InputBox();
                await input.setText(repository.username);
                await driverHelper.wait(timeToRefresh);
                await input.confirm();
                await driverHelper.wait(timeToRefresh);
                await input.setText(repository.password);
                await input.confirm();
                await driverHelper.wait(timeToRefresh);
            });

            test('Check if the changes were pushed', async function (): Promise<void> {
                try {
                    Logger.debug(`scmProvider.takeAction: "${refreshButtonLabel}"`);
                    await scmProvider.takeAction(refreshButtonLabel);
                } catch (e) {
                    Logger.info('Check you use correct credentials.' +
                        'For bitbucket.org ensure you use an app password: https://support.atlassian.com/bitbucket-cloud/docs/using-app-passwordwords/;' +
                        'For github.com - personal access token instead of password.');
                }
                const isCommitButtonDisabled: string = await driverHelper.waitAndGetElementAttribute(webCheCodeLocators.ScmView.actionConstructor(commitChangesButtonLabel), 'aria-disabled');
                expect(isCommitButtonDisabled).eql('true');
            });

            test('Stop the workspace', async function (): Promise<void> {
                await workspaceHandlingTests.stopWorkspace(WorkspaceHandlingTests.getWorkspaceName());
                await browserTabsUtil.closeAllTabsExceptCurrent();
            });

            test('Delete the workspace', async function (): Promise<void> {
                await workspaceHandlingTests.removeWorkspace(WorkspaceHandlingTests.getWorkspaceName());
            });

            loginTests.logoutFromChe();
        }
    });
});
