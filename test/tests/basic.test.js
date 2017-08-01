import AWS from 'aws-sdk';
import chai, { expect } from 'chai';
import { afterEach, before, describe, it } from 'mocha';
import sinon from 'sinon';
import sinonchai from 'sinon-chai';

import LambdaSecrets from '../../lib';

chai.use(sinonchai);

AWS.config.update({ region: 'us-west-2' });
const kms = new AWS.KMS();

describe('[basic]', function () {
  before(function () {
    this.sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  describe('constructor', function () {
    it('should not throw', function () {
      const create = () => new LambdaSecrets(kms);
      expect(create).to.not.throw(Error);
    });
  });

  describe('initialize', function () {
    it('should resolve with no secrets', async function () {
      const secrets = new LambdaSecrets(kms);
      await secrets.initialize();
      expect(secrets.get('foo', 'bar')).to.equal('bar');
    });

    it('should decrypt all secrets', async function () {
      const secrets = new LambdaSecrets(kms);
      secrets.addSecret('foo', 'bar');
      secrets.addSecret('bar', 'baz');
      this.sandbox.stub(kms, 'decrypt').returns({
        promise: sinon.stub().resolves({ Plaintext: 'decrypted' }),
      });
      await secrets.initialize();
      expect(kms.decrypt).to.have.callCount(2);
      expect(kms.decrypt.firstCall.args[0]).to.have.property('CiphertextBlob').deep.equal(Buffer.from('bar', 'utf8'));
      expect(kms.decrypt.secondCall.args[0]).to.have.property('CiphertextBlob').deep.equal(Buffer.from('baz', 'utf8'));
      expect(secrets.get('foo')).to.equal('decrypted');
      expect(secrets.get('bar')).to.equal('decrypted');
    });

    it('should parse secrets if a parse function is provided', async function () {
      const secrets = new LambdaSecrets(kms);
      secrets.addSecret('foo', 'bar', x => JSON.parse(x));
      this.sandbox.stub(kms, 'decrypt').returns({
        promise: sinon.stub().resolves({ Plaintext: '{"bar":123}' }),
      });
      await secrets.initialize();
      expect(kms.decrypt).to.have.callCount(1);
      expect(secrets.get('foo')).to.have.property('bar', 123);
      expect(secrets.get('foo.bar')).to.equal(123);
    });
  });
});
