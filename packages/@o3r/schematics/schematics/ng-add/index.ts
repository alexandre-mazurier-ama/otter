import type {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';
import {lastValueFrom} from 'rxjs';

/**
 * Add Otter schematics to an Angular Project
 *
 * @param options
 */
export function ngAdd(): Rule {
  const schematicsDependencies = ['@angular-devkit/schematics', '@angular-devkit/core', '@schematics/angular', 'comment-json', 'eslint'];
  return async (_tree: Tree, context: SchematicContext) => {
    schematicsDependencies.forEach(
      (dependency) => context.addTask(new NodePackageInstallTask({
        packageManager: 'yarn',
        packageName: dependency,
        hideOutput: false,
        quiet: false
      } as any))
    );
    await lastValueFrom(context.engine.executePostTasks());
    return () => _tree;
  };
}
