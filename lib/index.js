
/**
 * LambdaSecrets constructor
 * @param       {KMS} kms - configured kms service
 * @constructor
 */
export default function LambdaSecrets(kms) {
  const decrypted = {};
  const secrets = {};
  let initialized = false;

  /**
   * Add a secret definition
   * @param {String}   namespace      - secret name/namespace
   * @param {String}   ciphertextBlob - ciphertext
   * @param {Function} [parse=x=>x]   - optional function used to parse value after decryption
   */
  this.addSecret = function addSecret(namespace, ciphertext, parse = x => x) {
    secrets[namespace] = { ciphertext, parse };
  };

  /**
   * Retrieve a decrypted secret
   * @param  {Array|String} keys       - path
   * @param  {*}            defaultVal - default value
   * @return {*}
   */
  this.get = function getSecret(keys, defaultVal) {
    if (initialized !== true) {
      throw new Error('LambdaSecrets must be initialized before any secrets can be retrieved');
    }
    return get(decrypted, keys, defaultVal);
  };

  /**
   * Process all added secrets by decrypting and parsing them
   * @return {Promise}
   */
  this.initialize = async function initialize() {
    if (initialized === true) {
      return false;
    }
    const processed = await Promise.all(Object.keys(secrets).map(async (namespace) => {
      const { ciphertext, parse } = secrets[namespace];
      const params = { CiphertextBlob: Buffer.from(ciphertext, 'utf8') };
      const { Plaintext } = await kms.decrypt(params).promise();
      const parsed = await Promise.resolve(parse(Plaintext));
      return { namespace, parsed };
    }));
    processed.forEach(({ namespace, parsed }) => {
      decrypted[namespace] = parsed;
    });
    initialized = true;
    return true;
  };
}

/**
 * local implementation of lodash's get
 * @param  {Object}       obj        - target object
 * @param  {Array|String} keys       - path
 * @param  {*}            defaultVal - default value
 * @return {*}
 */
function get(obj, keys, defaultVal) {
  const [key, ...rest] = Array.isArray(keys) ? keys : keys.split('.');
  const result = obj[key];
  if (result && rest.length) {
    return get(result, rest, defaultVal);
  }
  return result === undefined ? defaultVal : result;
}
