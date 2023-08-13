import { Injectable } from '@nestjs/common'
import { createHelloWorld } from '@virt/shared';

export interface AppServiceInterface {
  getHelloWorld: () => string;
}

export const appServiceName = Symbol('AppService');

@Injectable()
export class AppService implements AppServiceInterface {
  getHelloWorld: AppServiceInterface['getHelloWorld'] = () => {
    return createHelloWorld();
  };
}
