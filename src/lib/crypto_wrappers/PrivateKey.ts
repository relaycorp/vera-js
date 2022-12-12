// tslint:disable:max-classes-per-file

import { CryptoKey, KeyAlgorithm, KeyUsages, ProviderCrypto } from 'webcrypto-core';

import { HashingAlgorithm } from './algorithms.js';

export class PrivateKey extends CryptoKey {
  public override readonly extractable = true; // The **public** key is extractable as SPKI

  public override readonly type = 'private' as KeyType;

  constructor(
    public override readonly algorithm: KeyAlgorithm,
    public readonly provider: ProviderCrypto,
  ) {
    super();
  }
}

export class RsaPssPrivateKey extends PrivateKey {
  public override readonly usages = ['sign'] as KeyUsages;

  constructor(hashingAlgorithm: HashingAlgorithm, provider: ProviderCrypto) {
    const algorithm = { name: 'RSA-PSS', hash: { name: hashingAlgorithm } };
    super(algorithm, provider);
  }
}
