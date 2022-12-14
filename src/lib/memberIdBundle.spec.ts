import { DnsRecord, MockChain, RrSet, SecurityStatus } from '@relaycorp/dnssec';
import { AsnParser, AsnSerializer } from '@peculiar/asn1-schema';
import { addMinutes, setMilliseconds, subMinutes } from 'date-fns';

import { MEMBER_NAME, ORG_NAME } from '../testUtils/veraStubs.js';
import { arrayBufferFrom } from '../testUtils/buffers.js';

import { generateRsaKeyPair } from './utils/keys.js';
import { selfIssueOrganisationCertificate } from './pki/organisation.js';
import { issueMemberCertificate } from './pki/member.js';
import { DnssecChain } from './dns/DnssecChain.js';
import { serialiseMemberIdBundle } from './memberIdBundle.js';
import VeraError from './VeraError.js';
import { MemberIdBundleSchema } from './MemberIdBundleSchema.js';

let orgCertificate: ArrayBuffer;
let memberCertificate: ArrayBuffer;
beforeAll(async () => {
  const now = setMilliseconds(new Date(), 0);
  const startDate = subMinutes(now, 5);
  const expiryDate = addMinutes(now, 5);

  const orgKeyPair = await generateRsaKeyPair();
  orgCertificate = await selfIssueOrganisationCertificate(ORG_NAME, orgKeyPair, expiryDate, {
    startDate,
  });

  const memberKeyPair = await generateRsaKeyPair();
  memberCertificate = await issueMemberCertificate(
    MEMBER_NAME,
    memberKeyPair.publicKey,
    orgCertificate,
    orgKeyPair.privateKey,
    expiryDate,
  );
});

let dnssecChainSerialised: ArrayBuffer;
beforeAll(async () => {
  const mockChain = await MockChain.generate(`${ORG_NAME}.`);
  const veraRecord = new DnsRecord(`_vera.${ORG_NAME}.`, 'TXT', 'IN', 42, 'foo');
  const rrset = RrSet.init(veraRecord.makeQuestion(), [veraRecord]);
  const { responses } = mockChain.generateFixture(rrset, SecurityStatus.SECURE);
  const dnssecChain = new DnssecChain(responses.map((response) => response.serialise()));
  dnssecChainSerialised = AsnSerializer.serialize(dnssecChain);
});

describe('serialiseMemberIdBundle', () => {
  test('Malformed member certificate should be refused', () => {
    expect(() =>
      serialiseMemberIdBundle(arrayBufferFrom('malformed'), orgCertificate, dnssecChainSerialised),
    ).toThrowWithMessage(VeraError, 'Member certificate is malformed');
  });

  test('Malformed organisation certificate should be refused', () => {
    expect(() =>
      serialiseMemberIdBundle(
        memberCertificate,
        arrayBufferFrom('malformed'),
        dnssecChainSerialised,
      ),
    ).toThrowWithMessage(VeraError, 'Organisation certificate is malformed');
  });

  test('Malformed DNSSEC chain should be refused', () => {
    expect(() =>
      serialiseMemberIdBundle(memberCertificate, orgCertificate, arrayBufferFrom('malformed')),
    ).toThrowWithMessage(VeraError, 'DNSSEC chain is malformed');
  });

  test('Well-formed bundle should be output', () => {
    const bundleSerialised = serialiseMemberIdBundle(
      memberCertificate,
      orgCertificate,
      dnssecChainSerialised,
    );

    const bundle = AsnParser.parse(bundleSerialised, MemberIdBundleSchema);
    expect(Buffer.from(AsnSerializer.serialize(bundle.dnssecChain))).toStrictEqual(
      Buffer.from(dnssecChainSerialised),
    );
    expect(Buffer.from(AsnSerializer.serialize(bundle.organisationCertificate))).toStrictEqual(
      Buffer.from(orgCertificate),
    );
    expect(Buffer.from(AsnSerializer.serialize(bundle.memberCertificate))).toStrictEqual(
      Buffer.from(memberCertificate),
    );
  });
});
