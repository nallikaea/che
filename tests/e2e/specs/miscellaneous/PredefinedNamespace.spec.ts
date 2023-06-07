import { e2eContainer } from '../../configs/inversify.config';
import { assert } from 'chai';
import { CLASSES, TYPES } from '../../configs/inversify.types';
import { WorkspaceHandlingTests } from '../../tests-library/WorkspaceHandlingTests';
import { Logger } from '../../utils/Logger';
import { LoginTests } from '../../tests-library/LoginTests';
import { registerRunningWorkspace } from '../MochaHooks';
import { TestConstants } from '../../constants/TestConstants';
import { ITestWorkspaceUtil } from '../../utils/workspace/ITestWorkspaceUtil';
import { KubernetesCommandLineToolsExecutor } from '../../utils/KubernetesCommandLineToolsExecutor';
import { ShellExecutor } from '../../utils/ShellExecutor';

const loginTests: LoginTests = e2eContainer.get(CLASSES.LoginTests);
const workspaceHandlingTests: WorkspaceHandlingTests = e2eContainer.get(CLASSES.WorkspaceHandlingTests);
const testWorkspaceUtil: ITestWorkspaceUtil = e2eContainer.get(TYPES.WorkspaceUtil);

const predefinedNamespaceName: string = 'predefined-ns';

suite(`Create predefined workspace and check it ${TestConstants.ENVIRONMENT}`, async function (): Promise<void> {
    let workspaceName: string = '';
    let kubernetesCommandLineToolsExecutor: KubernetesCommandLineToolsExecutor;

    const setEditRightsForUser: string = `oc adm policy add-role-to-user edit user -n ${predefinedNamespaceName}`;
    const getDevWorkspaceFromPredefinedNameSpace: string = `oc get dw -n ${predefinedNamespaceName}`;
    const deletePredefinedNamespace: string = `oc delete project ${predefinedNamespaceName}`;
    const createPredefinedProjectCommand: string = 'cat <<EOF | oc apply -f - \n' +
        'kind: Namespace\n' +
        'apiVersion: v1\n' +
        'metadata:\n' +
        `  name: ${predefinedNamespaceName}\n` +
        '  labels:\n' +
        '    app.kubernetes.io/part-of: che.eclipse.org\n' +
        '    app.kubernetes.io/component: workspaces-namespace\n' +
        '  annotations:\n' +
        '    che.eclipse.org/username: user\n' +
        'EOF';
    // create a predefined namespace for user using shell script and login into user dashboard
    suiteSetup(async function (): Promise<void> {
        Logger.info('Test prerequisites:');
        Logger.info(' (1) there is OCP user with username and user password that have been set in the TS_SELENIUM_OCP_USERNAME and TS_SELENIUM_OCP_PASSWORD variables');
        Logger.info(' (2) \'oc\' client installed and logged into test OCP cluster with admin rights.');

        kubernetesCommandLineToolsExecutor = new KubernetesCommandLineToolsExecutor();
        kubernetesCommandLineToolsExecutor.loginToOcp('admin');

        ShellExecutor.execWithLog(createPredefinedProjectCommand);
        ShellExecutor.execWithLog(setEditRightsForUser);
    });

    suiteTeardown(async (): Promise<void> => {
        const workspaceName: string = WorkspaceHandlingTests.getWorkspaceName();
        testWorkspaceUtil.stopAndDeleteWorkspaceByName(workspaceName);
        try {
            ShellExecutor.execWithLog(deletePredefinedNamespace);
        } catch (e) {
            Logger.error(`Cannot remove the predefined project: ${workspaceName}, please fix it manually: ${e}`);
        }
    });

    loginTests.loginIntoChe('user');
    // create the Empty workspace using CHE Dashboard
    workspaceHandlingTests.createAndOpenWorkspace('Empty Workspace');
    workspaceHandlingTests.obtainWorkspaceNameFromStartingPage();

    // verify that just created workspace with unique name is present in the predefined namespace
    test('Validate the created workspace is present in predefined namespace', async function (): Promise<void> {
        workspaceName = WorkspaceHandlingTests.getWorkspaceName();
        registerRunningWorkspace(workspaceName);
        const ocDevWorkspaceOutput: string = ShellExecutor.execWithLog(getDevWorkspaceFromPredefinedNameSpace).stdout;
        await assert.isTrue(ocDevWorkspaceOutput.includes(workspaceName));
    });

    loginTests.logoutFromChe('user');
});


