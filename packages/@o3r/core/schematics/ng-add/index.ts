import {chain, externalSchematic, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {lastValueFrom} from 'rxjs';
import {NgAddSchematicsSchema} from './schema';

/**
 * Add Otter library to an Angular Project
 *
 * @param options
 */
export function ngAdd(options: NgAddSchematicsSchema): Rule {
  return async (_tree: Tree, context: SchematicContext) => {
    const { prepareProject } = await import('./project-setup/index');
    const corePackageJsonContent = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', 'package.json'), {encoding: 'utf-8'}));
    const o3rCoreVersion = corePackageJsonContent?.version ? `@${corePackageJsonContent.version as string}` : '';
    const schematicsDependencies = ['@o3r/schematics', '@o3r/dev-tools'];
    for (const dependency of schematicsDependencies) {
      context.addTask(new NodePackageInstallTask({
        packageManager: 'yarn',
        packageName: dependency + o3rCoreVersion,
        hideOutput: false,
        quiet: false
      } as any));
      await lastValueFrom(context.engine.executePostTasks());
    }
    return chain([
      ...schematicsDependencies.map((dep) => externalSchematic(dep, 'ng-add', {})),
      prepareProject(options, __dirname)
    ]);
  };
}
