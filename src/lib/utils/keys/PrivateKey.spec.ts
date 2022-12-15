import { type KeyAlgorithm as WebCryptoKeyAlgorithm, type ProviderCrypto } from 'webcrypto-core';

import { MockAesKwProvider } from '../../../testUtils/webcrypto/MockAesKwProvider.js';
import { AwalaAesKwProvider } from '../webcrypto/AwalaAesKwProvider.js';

import { PrivateKey } from './PrivateKey.js';

const PROVIDER = new AwalaAesKwProvider(new MockAesKwProvider());
const ALGORITHM: KeyAlgorithm = { name: 'RSA-PSS' };

describe('PrivateKey', () => {
  class StubPrivateKey extends PrivateKey {
    public constructor(algorithm: WebCryptoKeyAlgorithm, provider: ProviderCrypto) {
      super(algorithm, provider);
    }
  }

  test('Key type should be private', () => {
    const key = new StubPrivateKey(ALGORITHM, PROVIDER);

    expect(key.type).toBe('private');
  });

  test('Key should be extractable', () => {
    const key = new StubPrivateKey(ALGORITHM, PROVIDER);

    expect(key.extractable).toBeTrue();
  });

  test('Algorithm should be honoured', () => {
    const key = new StubPrivateKey(ALGORITHM, PROVIDER);

    expect(key.algorithm).toStrictEqual(ALGORITHM);
  });

  test('Provider should be honoured', () => {
    const key = new StubPrivateKey(ALGORITHM, PROVIDER);

    expect(key.provider).toStrictEqual(PROVIDER);
  });
});
