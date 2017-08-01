# lambda-secrets
secret solution for lambda functions using KMS

## Installing
```shell
npm install --save lambda-secrets
```

## Getting Started
Prereqs:
1. encrypt sensitive data using a KMS key
1. grant the lambda function's role access to decrypt using the KMS key
1. assign ciphertext as lambda function environment variables

```javascript
import AWS from 'aws-sdk';
import Secrets from 'lambda-secrets';

// configure a kms client
const kms = new AWS.KMS();

// instantiate a new secret provider, passing in the configured kms client
const secrets = new Secrets(kms);

// add secrets to the provider
secrets.addSecret('api', process.env.SECRET_API);
secrets.addSecret('password', process.env.SECRET_PASSWORD);

export async function handler(e, ctx, done) {
  try {
    // initializ the secrets provider. note: this will only decrypt the secrets
    // on the first call. on subsequent executions, this is essentially a noop.
    await secrets.initialize();
    console.log(secrets.get('api'));
    console.log(secrets.get('password'));
    done();
  } catch(err) {
    console.error(err);
    done(err);
  }
}
```

## API
### Secrets(kms) -> secrets
instantiate a new secret provider instance

###### Arguments
| Name | Type | Description |
| --- | --- | --- |
| kms | Object | a configured KMS instance |

###### Example
```javascript
import AWS from 'aws-sdk';
import Secrets from 'lambda-secrets';

// configure a kms client
const kms = new AWS.KMS();

// instantiate a new secret provider, passing in the configured kms client
const secrets = new Secrets(kms);
```

### addSecret(name, ciphertext, [parse]) -> secrets
define a new secret configuration

###### Arguments
| Name | Type | Description |
| --- | --- | --- |
| name | String | the name at which the decrypted/parsed secret will be available |
| ciphertext | String | the encrypted ciphertext from KMS |
| [parse] | Function | an optional function used to parse the decrypted plaintext |

###### Example
```javascript
secrets.addSecret('password', process.env.PASSWORD);
secrets.addSecret('port', process.env.PORT, x => parseInt(x));
secrets.addSecret('db', process.env.DB, x => JSON.parse(x));
```

### get(path, defaultVal) -> *
instantiate a new secret provider instance

###### Arguments
| Name | Type | Description |
| --- | --- | --- |
| path | String or String[] | the name at which the decrypted/parsed secret will be available |
| defaultVal | * | an optional default value to return if no result found at path |

###### Example
```javascript
secrets.get('password');
secrets.get('port');
secrets.get('db.host');
secrets.get('db.port', 5432);
```

## Testing
run the test suite
```shell
$ npm test
```

## Contributing
1. [Fork it](https://github.com/cludden/lambda-secrets/fork)
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request

## License
Copyright (c) 2017 Chris Ludden.  
Licensed under the [MIT License](LICENSE.md)
