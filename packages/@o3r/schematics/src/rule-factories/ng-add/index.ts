import {chain, externalSchematic, Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import type { logging } from '@angular-devkit/core';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';
import {lastValueFrom} from 'rxjs';
import {NgAddPackageOptions} from '../../tasks/index';
import * as path from 'node:path';

/**
 * Install via `ng add` a list of npm packages.
 *
 * @param packages List of packages to be installed via `ng add`
 * @param options install options
 */
export function ngAddPackages(packages: string[], options?: NgAddPackageOptions): Rule {
  const getInstalledVersion = async (packageName: string) => {
    try {
      return (await import(`${packageName}/package.json`)).version;
    } catch (e) {
      return;
    }
  };
  const getOptions = async (packageName: string, logger: logging.LoggerApi) => {
    try {
      const ngAddCollectionPath = (await import(`${packageName}/collection.json`)).schematics['ng-add'].schema;
      const schema = (await import(path.join(packageName, ngAddCollectionPath))).properties;
      return Object.entries(options || {}).reduce((accOptions, [key, value]: [string, any]) => {
        if (schema[key]) {
          accOptions[key] = value;
        }
        return accOptions;
      }, {});
    } catch (e) {
      logger.info(`Could not find schema for ${packageName}`);
      return {};
    }
  };
  return async (_tree: Tree, context: SchematicContext) => {
    const ngAddToRun: Rule[] = [];
    if (packages.length > 0) {
      context.logger.info(`'${options?.parentPackageInfo || ''}' - 'ng add' has been launched for the following packages:`);
      for (const packageName of packages) {
        context.logger.info(`Running ng add for: ${packageName}${options?.version ? ' with version: ' + options.version : ''}`);
        const version = options?.version ? '@' + options?.version : '';
        const installedVersion = await getInstalledVersion(packageName);
        if (!installedVersion || options?.version !== installedVersion) {
          context.logger.info(`Running ng add for: ${packageName}${options?.version ? ' with version: ' + options.version : ''}`);
          context.addTask(new NodePackageInstallTask({
            packageManager: 'yarn',
            packageName: packageName + version,
            hideOutput: false,
            quiet: false
          } as any));
          await lastValueFrom(context.engine.executePostTasks());
        }
        const ngAddOptions = await getOptions(packageName, context.logger);
        ngAddToRun.push(((t: Tree, c: SchematicContext) => {
          try {
            return externalSchematic(packageName, 'ng-add', ngAddOptions);
          } catch {
            c.logger.error(`Failed to run ng-add for ${packageName}`);
            return t;
          }
        }));
      }
    }
    return () => chain(ngAddToRun)(_tree, context);
  };
}
