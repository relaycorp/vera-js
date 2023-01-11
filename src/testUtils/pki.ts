import Certificate from '../lib/utils/x509/Certificate.js';
import { generateRsaKeyPair, getPublicKeyDigestHex } from '../lib/utils/keys.js';
import type FullIssuanceOptions from '../lib/utils/x509/FullIssuanceOptions.js';

import { reSerializeCertificate } from './pkijs.js';

interface StubCertConfig {
  readonly attributes: Partial<FullIssuanceOptions>;
  readonly issuerCertificate: Certificate;
  readonly issuerPrivateKey: CryptoKey;
  readonly subjectPublicKey: CryptoKey;
}

/**
 * @deprecated Use {Certificate.issue} instead
 */
export async function generateStubCert(config: Partial<StubCertConfig> = {}): Promise<Certificate> {
  const keyPair = await generateRsaKeyPair();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  futureDate.setMilliseconds(0);
  const subjectPublicKey = config.subjectPublicKey ?? keyPair.publicKey;
  const certificate = await Certificate.issue({
    commonName: `0${await getPublicKeyDigestHex(subjectPublicKey)}`,
    issuerCertificate: config.issuerCertificate,
    issuerPrivateKey: config.issuerPrivateKey ?? keyPair.privateKey,
    subjectPublicKey,
    validityEndDate: futureDate,
    ...config.attributes,
  });
  return reSerializeCertificate(certificate);
}
