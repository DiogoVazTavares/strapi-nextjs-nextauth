const fs = require('fs');
const jose = require("node-jose");
const { parse, stringify } = require('envfile')

const envConfig = parse(fs.readFileSync('.env.development'));


jose.JWK.createKey("oct", 256, {
  alg: "HS512",
  use: "sig",
})
  .then(data => {
    const signingKey = data.toJSON(true);
    const newSigningKey = JSON.stringify(signingKey);
    envConfig.NEXTAUTH_SIGNINGKEY = newSigningKey;
  })
  .then(() => {
    jose.JWK.createKey("oct", 256, {
      alg: "A256GCM",
    })
      .then(data => {
        const encryptionKey = data.toJSON(true);
        const newEncryptionKey = JSON.stringify(encryptionKey);
        envConfig.NEXTAUTH_ENCRYPTIONKEY = newEncryptionKey;
      })
      .then(() => {
        fs.writeFileSync('./.env.development', stringify(envConfig));
        console.log(":::::::::::::::: ENV FILE EDITED :::::::::::::::::")
      })
  });