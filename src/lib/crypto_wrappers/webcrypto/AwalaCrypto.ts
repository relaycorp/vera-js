import { Crypto as BaseCrypto } from '@peculiar/webcrypto';
import { getCiphers } from 'node:crypto';
import { AesKwProvider, ProviderCrypto, SubtleCrypto } from 'webcrypto-core';

import { AwalaAesKwProvider } from './AwalaAesKwProvider.js';

export class AwalaCrypto extends BaseCrypto {
  public constructor(customProviders: readonly ProviderCrypto[] = []) {
    super();

    const providers = (this.subtle as SubtleCrypto).providers;

    const doesNodejsSupportAesKw = getCiphers().includes('id-aes128-wrap');
    if (!doesNodejsSupportAesKw) {
      // This must be running on Electron, so let's use a pure JavaScript implementation of AES-KW:
      // https://github.com/relaycorp/relaynet-core-js/issues/367
      const nodejsAesKwProvider = providers.get('AES-KW') as AesKwProvider;
      providers.set(new AwalaAesKwProvider(nodejsAesKwProvider));
    }

    customProviders.forEach((p) => providers.set(p));
  }
}
