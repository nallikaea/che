import { Main as Generator } from '@eclipse-che/che-devworkspace-generator/lib/main';
import { DevfileContext } from '@eclipse-che/che-devworkspace-generator/lib/api/devfile-context';
import { V1alpha2DevWorkspaceTemplate } from '@devfile/api';
import YAML from 'yaml';
import * as axios from 'axios';
import { Logger } from './Logger';
import { TestConstants } from '../constants/TestConstants';
import { ShellExecutor } from './ShellExecutor';

/**
 * to see more about IContextParams and generateDevfileContext(params) check README.md in "@eclipse-che/che-devworkspace-generator;
 * tests/e2e/node_modules/@eclipse-che/che-devworkspace-generator/README.md
 */

interface IContextParams {
    devfilePath?: string | undefined;
    devfileUrl?: string | undefined;
    devfileContent?: string | undefined;
    outputFile?: string | undefined;
    editorPath?: string | undefined;
    editorContent?: string | undefined;
    editorEntry?: string | undefined;
    pluginRegistryUrl?: string | undefined;
    projects?: {
        name: string;
        location: string;
    }[];
    injectDefaultComponent?: string | undefined;
    defaultComponentImage?: string | undefined;
}

export class DevWorkspaceConfigurationHelper {
    private generator: Generator = new Generator();
    private readonly params: IContextParams;

    constructor(params: IContextParams) {
        // check if all undefined
        if (!(params.editorPath || params.editorEntry || params.editorContent)) {
            if (TestConstants.TS_API_TEST_CHE_CODE_EDITOR_DEVFILE_URI && !params.editorContent) {
                params.editorContent = ShellExecutor.curl(TestConstants.TS_API_TEST_CHE_CODE_EDITOR_DEVFILE_URI).stdout;
            } else {
                params.editorEntry = 'che-incubator/che-code/latest';
            }
        }
        // check if one or both has value
        if (TestConstants.TS_API_TEST_UDI_IMAGE() || params.defaultComponentImage) {
            params.injectDefaultComponent = 'true';
            // check if not explicitly passed than assign value from the constants
            if (!params.defaultComponentImage) {
                params.defaultComponentImage = TestConstants.TS_API_TEST_UDI_IMAGE();
            }
        }
        // assign value from the constants if not explicitly passed
        if (TestConstants.TS_API_TEST_PLUGIN_REGISTRY_URL && !params.pluginRegistryUrl) {
            params.pluginRegistryUrl = TestConstants.TS_API_TEST_PLUGIN_REGISTRY_URL;
        }
        this.params = params;
    }

    async generateDevfileContext(): Promise<DevfileContext> {
        Logger.debug(`${this.constructor.name}.${this.generateDevfileContext.name}`);
        if (!this.params.projects) {
            this.params.projects = [];
        }
        const devfileContext: DevfileContext = await this.generator.generateDevfileContext(
            {
                ...this.params,
                projects: this.params.projects
            },
            axios.default as any
        );
        // if (TestConstants.TS_API_TEST_UDI_IMAGE()) { devfileContext.devfile.components['0'].container.image = TestConstants.TS_API_TEST_UDI_IMAGE; }
        //
        // // added attributes to build containers
        // devfileContext.devWorkspace.spec!.template!.attributes = YAML.parse(`
        //     controller.devfile.io/devworkspace-config:
        //       name: devworkspace-config
        //       namespace: openshift-devspaces
        //     controller.devfile.io/scc: container-build
        //     controller.devfile.io/storage-type: per-user`
        // );

        return devfileContext;
    }

    // write templates and then DevWorkspace in a single file
    async getDevWorkspaceConfigurationYamlAsString(context: DevfileContext): Promise<string> {
        Logger.debug(`${this.constructor.name}.${this.getDevWorkspaceConfigurationYamlAsString.name}`);
        const allContentArray: any[] = context.devWorkspaceTemplates.map(
            (template: V1alpha2DevWorkspaceTemplate) => YAML.stringify(template)
        );
        allContentArray.push(
            YAML.stringify(context.devWorkspace)
        );

        return allContentArray.join('---\n');
    }

    async getDevWorkspaceConfigurationsAsYaml(allContentString: string): Promise<string> {
        Logger.debug(`${this.constructor.name}.${this.getDevWorkspaceConfigurationsAsYaml.name}`);
        let content: any  = {};
        const contentArray: string[] = allContentString.split('---\n');
        contentArray.forEach((e: any) => {
            e = YAML.parse(e);
            e.kind === 'DevWorkspace' ? content.DevWorkspace = e
                : e.kind === 'DevWorkspaceTemplate' ? content.DevWorkspaceTemplate = e
                    : Logger.error(`${this.constructor.name}.${this.getDevWorkspaceConfigurationsAsYaml.name} - Problems with configuration parsing, string should be in format "DevWorkspace\\n---\\nDevWorkspaceTemplate"`);
        });

        return content;
    }
}
