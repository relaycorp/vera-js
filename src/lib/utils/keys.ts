import { getAlgorithmParameters } from 'pkijs';

import { getPkijsCrypto } from './pkijs.js';
import { type HashingAlgorithm, type RsaModulus } from './algorithms.js';
import { PrivateKey } from './keys/PrivateKey.js';
import { bufferToArray } from './buffers.js';

const cryptoEngine = getPkijsCrypto();

const MIN_RSA_MODULUS = 2048;

const DEFAULT_RSA_KEY_PARAMS: RsaHashedImportParams = {
  hash: { name: 'SHA-256' },
  name: 'RSA-PSS',
};

export interface RsaKeyGenOptions {
  readonly modulus: RsaModulus;
  readonly hashingAlgorithm: HashingAlgorithm;
}

/**
 * Return DER serialization of public key.
 */
export async function derSerializePublicKey(publicKey: CryptoKey): Promise<Buffer> {
  const publicKeyDer =
    publicKey instanceof PrivateKey
      ? ((await publicKey.provider.exportKey('spki', publicKey)) as ArrayBuffer)
      : await cryptoEngine.exportKey('spki', publicKey);
  return Buffer.from(publicKeyDer);
}

/**
 * Return DER serialization of private key.
 */
export async function derSerializePrivateKey(privateKey: CryptoKey): Promise<Buffer> {
  const keyDer = await cryptoEngine.exportKey('pkcs8', privateKey);
  return Buffer.from(keyDer);
}

/**
 * Parse DER-serialized RSA public key.
 */
export async function derDeserializeRsaPublicKey(
  publicKeyDer: ArrayBuffer | Buffer,
  algorithmOptions: RsaHashedImportParams = DEFAULT_RSA_KEY_PARAMS,
): Promise<CryptoKey> {
  const keyData = publicKeyDer instanceof Buffer ? bufferToArray(publicKeyDer) : publicKeyDer;
  return cryptoEngine.importKey('spki', keyData, algorithmOptions, true, ['verify']);
}

/**
 * Parse DER-serialized RSA private key.
 */
export async function derDeserializeRsaPrivateKey(
  privateKeyDer: Buffer,
  algorithmOptions: RsaHashedImportParams = DEFAULT_RSA_KEY_PARAMS,
): Promise<CryptoKey> {
  return cryptoEngine.importKey('pkcs8', bufferToArray(privateKeyDer), algorithmOptions, true, [
    'sign',
  ]);
}

/**
 * Generate an RSA-PSS key pair.
 *
 * @param options The RSA key generation options
 * @throws Error If the modulus or the hashing algorithm is disallowed.
 */
export async function generateRsaKeyPair(
  options: Partial<RsaKeyGenOptions> = {},
): Promise<CryptoKeyPair> {
  const modulus = options.modulus ?? MIN_RSA_MODULUS;
  if (modulus < MIN_RSA_MODULUS) {
    throw new Error(`RSA modulus must be => 2048 (got ${modulus})`);
  }

  const hashingAlgorithm = options.hashingAlgorithm ?? 'SHA-256';

  if ((hashingAlgorithm as any) === 'SHA-1') {
    throw new Error('SHA-1 is unsupported');
  }

  const algorithm = getAlgorithmParameters('RSA-PSS', 'generateKey');
  const rsaAlgorithm = algorithm.algorithm as RsaHashedKeyAlgorithm;

  rsaAlgorithm.hash.name = hashingAlgorithm;

  rsaAlgorithm.modulusLength = modulus;

  return cryptoEngine.generateKey(rsaAlgorithm, true, algorithm.usages);
}

export async function getRsaPublicKeyFromPrivate(privateKey: CryptoKey): Promise<CryptoKey> {
  const publicKeyDer = bufferToArray(await derSerializePublicKey(privateKey));
  return cryptoEngine.importKey('spki', publicKeyDer, privateKey.algorithm, true, ['verify']);
}

/**
 * Return SHA-256 digest of public key.
 */
export async function getPublicKeyDigest(publicKey: CryptoKey): Promise<ArrayBuffer> {
  const publicKeyDer = await derSerializePublicKey(publicKey);
  return cryptoEngine.digest({ name: 'SHA-256' }, publicKeyDer);
}
