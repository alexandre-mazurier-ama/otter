import * as chalk from 'chalk';
import { exec } from 'node:child_process';
import { existsSync, promises as fs } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import type { PackageJson } from 'type-fest';
import { dependencies, devDependencies, peerDependencies } from '../../package.json';

/** Minimal information of a package (common between package.json and npm search result) */
export type MinimalPackageInformation = Pick<PackageJson, 'name' | 'description' | 'keywords' | 'maintainers' | 'version'>;

/** Additional information provided by the `npm search` command */
export interface NpmSearchSpecificInformation {
  /** Scope of the NPM package */
  scope?: string;
  /** Date of the publication of the retrieve version */
  date: Date;
  /** Links provided with the current artifact version */
  links: Record<string, string>;
}

/** Package information resulting of a NPM search command */
export type SearchResult = MinimalPackageInformation & NpmSearchSpecificInformation;

/** Information determine for a parsed module */
export interface ModuleLoadedInformation {
  /** Name of the NPM Package */
  name: string;

  /** Simplified name as displayed in the interface and selectable by the user */
  moduleName: string;
}

/** Installed package information */
export interface InstalledModuleInformation {
  /** Path to the installed package (can be in CLI node_modules or in dynamic imported node_modules) */
  resolutionPath: string;

  /** Local package.json */
  package: PackageJson;
}

/** Module discovered */
export type ModuleDiscovery = MinimalPackageInformation & ModuleLoadedInformation & Partial<InstalledModuleInformation>;

/** Keyword to identify a module */
export const MODULES_KEYWORD = 'amaterasu-module';

/** Folder containing the dependency installed dynamically */
export const DYNAMIC_DEPENDENCIES_FOLDER = 'dyn_modules';
const dynamicDependenciesPath = resolve(__dirname, '..', '..', DYNAMIC_DEPENDENCIES_FOLDER);

/**
 * Find the closest package.json file in parent folders
 *
 * @param currentPath current path to inspect
 * @returns
 */
export const findClosestPackageJson = (currentPath: string): string | undefined => {
  const dir = dirname(currentPath);
  if (dir === currentPath) {
    return undefined;
  }

  const packageJsonPath = join(dir, 'package.json');
  return existsSync(packageJsonPath) ? packageJsonPath : findClosestPackageJson(dir);
};

/**
 * Retrieve package.json from a dependency
 *
 * @param packageName Name of a dependency package
 * @returns the package information or undefined if not found
 */
export const getDepPackage = (packageName: string): PackageJson | undefined => {
  try {
    const packageJsonPath = findClosestPackageJson(require.resolve(packageName));
    return packageJsonPath && require(packageJsonPath);
  } catch {
    return undefined;
  }
};

/**
 * Get the path to the installed package
 *
 * @param dep dependency to retrieve in the installed packages
 */
export const getInstalledInformation = async (dep: MinimalPackageInformation & { name: string }): Promise<InstalledModuleInformation | undefined> => {
  try {
    const resolutionPath = require.resolve(dep.name, {
      paths: [
        resolve(dynamicDependenciesPath, 'node_modules'),
        ...module.paths
      ]
    });

    const packageJsonPath = findClosestPackageJson(resolutionPath);
    if (!resolutionPath || !packageJsonPath) {
      return;
    }
    return {
      package: JSON.parse(await fs.readFile(packageJsonPath, { encoding: 'utf-8' })),
      resolutionPath
    };
  } catch {
    return;
  }
};


/**
 * Get the module simplified name
 *
 * @param pck package to get name from
 */
export const getSimplifiedName = (pck: MinimalPackageInformation & { name: string }) => {
  return /(?:@[^/]+[/])?(?:amaterasu-)?(.*)/.exec(pck.name)?.[1] || pck.name;
};

/**
 * Retrieve the list of all the dependencies
 */
export const getLocalDependencies = async (): Promise<Record<string, string>> => {
  const dynDependencies: Record<string, string> = existsSync(resolve(dynamicDependenciesPath, 'package.json')) &&
    JSON.parse(await fs.readFile(resolve(dynamicDependenciesPath, 'package.json'), { encoding: 'utf-8' })).dependencies || {};
  return {
    ...dynDependencies,
    ...peerDependencies,
    ...devDependencies,
    ...dependencies
  };
};

/**
 * Retrieve the list of modules registered to Amaterasu CLI
 *
 * @param options Options for the module resolution
 * @param options.localOnly Resolve module locally only
 * @returns list of modules to load
 */
export const getCliModules = async (options: { localOnly: boolean } = { localOnly: false }): Promise<ModuleDiscovery[]> => {
  let remoteModules: SearchResult[] = [];
  const remoteModulesPromise = !options.localOnly && promisify(exec)(`npm search ${MODULES_KEYWORD} --json`);
  const localDependencies = await getLocalDependencies();
  const explicitModules = Object.keys(localDependencies)
    .map((moduleName) => getDepPackage(moduleName))
    .filter((modulePackageJson): modulePackageJson is PackageJson => {
      const { keywords } = modulePackageJson || { keywords: undefined };
      return !!keywords && keywords.includes(MODULES_KEYWORD);
    });

  if (remoteModulesPromise) {
    try {
      remoteModules = JSON.parse((await remoteModulesPromise).stdout) as SearchResult[];
    } catch {
      console.warn('Failed to execute `npm search`, will contains only installed packages');
    }
  }

  const map = new Map<string, ModuleDiscovery>();
  const modules = [...explicitModules, ...remoteModules]
    .filter((mod): mod is typeof mod & { name: string } => !!mod.name);

  for (const mod of modules) {
    const localInformation = await getInstalledInformation(mod);
    map.set(mod.name, { ...mod, ...localInformation, moduleName: getSimplifiedName(mod) });
  }

  return [ ...map.values() ];
};

/**
 * Determine if the package is installed
 *
 * @param pck package to get name from
 */
export const isInstalled = (pck: ModuleDiscovery): pck is ModuleDiscovery & InstalledModuleInformation => {
  return !!(pck.resolutionPath && pck.package);
};

/**
 * Formatted description
 *
 * @param pck package to get name from
 */
export const getFormattedDescription = (pck: ModuleDiscovery): string => {
  return (isInstalled(pck) ? '' : `${chalk.grey.italic('(remote)')} `) + (pck.description || '<Missing description>');
};

/**
 * Install a specific package
 *
 * @param pck Package to install
 * @param version Version of the package to install
 */
export const installDependency = async (pck: ModuleDiscovery, version?: string) => {
  if (!existsSync(resolve(dynamicDependenciesPath, 'package.json'))) {
    if (!existsSync(resolve(dynamicDependenciesPath))) {
      await fs.mkdir(dynamicDependenciesPath, { recursive: true });
    }
    await promisify(exec)('npm init --yes', { cwd: dynamicDependenciesPath });
  }
  await promisify(exec)(`npm install --save-exact ${pck.name}@${version || pck.version || 'latest'}`, { cwd: dynamicDependenciesPath });
};
