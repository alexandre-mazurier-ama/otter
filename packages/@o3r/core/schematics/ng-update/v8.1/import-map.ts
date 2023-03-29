/* eslint-disable @typescript-eslint/naming-convention */
import type { ImportsMapping } from '@o3r/schematics';

/** Map containing the import changes in otter packages for the exported elements */
export const mapImportAsyncStore: ImportsMapping = {
  '@o3r/core': {
    StoreSyncSerializers: {
      newPackage: '@o3r/async-store'
    },
    isSerializer: {
      newPackage: '@o3r/async-store'
    },
    StoreSyncConfig: {
      newPackage: '@o3r/async-store'
    },
    rehydrate: {
      newPackage: '@o3r/async-store'
    },
    AsyncStorage: {
      newPackage: '@o3r/async-store'
    },
    AsyncStorageSyncOptions: {
      newPackage: '@o3r/async-store'
    },
    StorageSyncOptions: {
      newPackage: '@o3r/async-store'
    },
    isLocalStorageConfig: {
      newPackage: '@o3r/async-store'
    },
    mergeReducer: {
      newPackage: '@o3r/async-store'
    },
    localStorageSync: {
      newPackage: '@o3r/async-store'
    }
  }
};
