import { KubernetesCommandLineToolsExecutor } from '../../utils/KubernetesCommandLineToolsExecutor';
import { expect } from 'chai';
import { ShellString } from 'shelljs';
import { TestConstants } from '../../constants/TestConstants';
import { DevWorkspaceConfigurationHelper } from '../../utils/DevWorkspaceConfigurationHelper';
import { DevfilesRegistryHelper } from '../../utils/DevfilesRegistryHelper';
import { suiteSetup } from 'mocha';
import YAML from 'yaml';

(async function (): Promise<void> {

    const devfilesRegistryHelper: DevfilesRegistryHelper = new DevfilesRegistryHelper();
    const samples: any[] = await devfilesRegistryHelper.getInbuiltDevfileContentForCheCodeLatest(['Python', 'Lombok', 'Express']);

    for (const sample of samples) {
        suite(`Podman operations API test for sample "${sample.name}" ${TestConstants.ENVIRONMENT}`, async function (): Promise<void> {
            this.bail(false);
            this.retries(0);
            const namespace: string = TestConstants.TS_API_TEST_NAMESPACE;
            let devWorkspaceConfigurationHelper: DevWorkspaceConfigurationHelper;
            let kubernetesCommandLineToolsExecutor: KubernetesCommandLineToolsExecutor;
            let devfileContext: any;
            let devWorkspaceName: string | undefined;
            let containerTerminal: KubernetesCommandLineToolsExecutor.ContainerTerminal;
            let podmanTestCommand: string;
            let testNumber: number;
            let image: string;

            suiteSetup('Generate test command', async function (): Promise<void> {
                testNumber = (new Date()).getTime();
                const containerImageRegistryURL: string = '';
                const containerImageRegistryUsername: string = TestConstants.PODMAN_LOGIN;
                const containerImageRegistryPassword: string = TestConstants.PODMAN_PASSWORD;
                const containerImageRegistryEndpoint: string = '';
                const testFolder: string = 'testfolder';

                image = `${containerImageRegistryURL}/${containerImageRegistryEndpoint}:${process.arch}`;
                podmanTestCommand = `cd "$PROJECT_SOURCE" && \\
                    podman login ${containerImageRegistryURL} -u ${containerImageRegistryUsername} -p ${containerImageRegistryPassword}  --tls-verify=false && \\
                    mkdir ${testFolder} && \\
                    cd ${testFolder} &&\\
                    touch Dockerfile && \\
                    echo "FROM ${containerImageRegistryURL}/${containerImageRegistryEndpoint}" >> Dockerfile && \\
                    echo 'COPY text.txt /' >> Dockerfile && \\
                    echo 'CMD ["/bin/bash", "-c", "cd / && ls"]' >> Dockerfile && \\
                    touch text.txt && \\
                    echo "Here is my data to check: ${testNumber}" >> text.txt && \\
                    cd .. && \\
                    podman build -t ${image} ./${testFolder}  --tls-verify=false && \\
                    podman push ${image}  --tls-verify=false && \\
                    podman image list -a && \\
                    podman image rm -a && \\
                    rm -rf ${testFolder}`;
            });

            suiteSetup('Get configuration', async function (): Promise<void> {
                devWorkspaceConfigurationHelper = new DevWorkspaceConfigurationHelper({});
                devfileContext = await devWorkspaceConfigurationHelper.getDevWorkspaceConfigurationsAsYaml(
                    sample.devWorkspaceConfigurationString);

                // added attributes to build containers
                devfileContext.DevWorkspace.spec.template.attributes = YAML.parse(`
                    controller.devfile.io/devworkspace-config:
                      name: devworkspace-config
                      namespace: openshift-devspaces
                    controller.devfile.io/scc: container-build
                    controller.devfile.io/storage-type: per-user`
                );
                devWorkspaceName = devfileContext.DevWorkspace.metadata.name;
                kubernetesCommandLineToolsExecutor = new KubernetesCommandLineToolsExecutor(devWorkspaceName, namespace);
                containerTerminal = new KubernetesCommandLineToolsExecutor.ContainerTerminal(kubernetesCommandLineToolsExecutor);
                kubernetesCommandLineToolsExecutor.loginToOcp();
            });

            test('Create and wait DevWorkspace', async function (): Promise<void> {
                kubernetesCommandLineToolsExecutor.applyYamlConfigurationAsStringOutput(YAML.stringify(devfileContext.DevWorkspaceTemplate));
                const output: ShellString = kubernetesCommandLineToolsExecutor.applyAndWaitDevWorkspace(YAML.stringify(devfileContext.DevWorkspace));
                expect(output.stdout).contains('condition met');
            });

            test('Check if podman commands are not forbidden', async function (): Promise<void> {
                const output: ShellString = containerTerminal.executeCommand(podmanTestCommand);
                expect(output.code).eqls(0);
            });

            test.skip('Check if container was updated', async function (): Promise<void> {
                const testImageCommand: string = `cat text.txt | grep $${testNumber}`;
                const output: ShellString = containerTerminal.testImage(image, testImageCommand);
                expect(output.stdout).contains(testNumber);
            });

            suiteTeardown('Delete DevWorkspace', async function (): Promise<void> {
                kubernetesCommandLineToolsExecutor.deleteDevWorkspace();
            });
        });
    }
    run();
})();
