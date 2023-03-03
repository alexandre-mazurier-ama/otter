import {ModuleWithProviders, NgModule} from '@angular/core';

import { RequestParametersService} from './request-parameters.service';
import { REQUEST_PARAMETERS_CONFIG_TOKEN } from './request-parameters.token';

import {RequestParametersConfig} from './request-parameters.config';

/**
 * Empty configuration factory, used when config is not provided. It needs a separate function for AOT.
 *
 * @deprecated use defaultConfigFactory from @o3r/dynamic-content instead, will be removed in v10
 */
export function defaultConfigFactory() {
  return {};
}
/**
 * RequestParametersService Module
 *
 * @deprecated use RequestParametersModule from @o3r/dynamic-content instead, will be removed in v10
 */
@NgModule({
  imports: [],
  providers: [
    {
      provide: REQUEST_PARAMETERS_CONFIG_TOKEN,
      useValue: {}
    },
    RequestParametersService
  ]
})
export class RequestParametersModule {
  public static forRoot(config: () => Partial<RequestParametersConfig> = defaultConfigFactory): ModuleWithProviders<RequestParametersModule> {
    return {
      ngModule: RequestParametersModule,
      providers: [
        {
          provide: REQUEST_PARAMETERS_CONFIG_TOKEN,
          useFactory: config
        },
        RequestParametersService
      ]
    };
  }
}
