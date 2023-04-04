const crypto = require('crypto');
const cbor = require('cbor');
const { TableServiceClient, AzureNamedKeyCredential, TableClient } = require("@azure/data-tables");

async function getTableClient(context, tableName) {
    const account = process.env.TABLES_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.TABLES_PRIMARY_STORAGE_ACCOUNT_KEY;
    const suffix = process.env.TABLES_STORAGE_ENDPOINT_SUFFIX;

    const url = 'https://' + account + '.table.' + suffix;

    const credential = new AzureNamedKeyCredential(account, accountKey);
    const serviceClient = new TableServiceClient(
        url,
        credential
    );

    await serviceClient.createTable(tableName, {
        onResponse: (response) => {
            if (response.status === 409) {
                context.log('Table ' + tableName + ' already exists');
            }
        }
    });
    const tableClient = new TableClient(url, tableName, credential);
    return tableClient;
}

async function getChallenge(context, rowKey) {
    try {
        const tableClient = await getTableClient(context, 'challenges');

        return await tableClient.getEntity('Prod', rowKey);
    } catch (err) {
        context.log(err);
        throw err;
    }
}

async function deleteChallenge(context, rowKey) {
    try {
        const tableClient = await getTableClient(context, 'challenges');

        await tableClient.deleteEntity('Prod', rowKey);
    } catch (err) {
        context.log(err);
        throw err;
    }
}

module.exports = async function (context, req) {
    try {
        context.log('JavaScript HTTP trigger function processed a request.');

        if (!req.body || !req.body.id || !req.body.clientDataJSON || !req.body.attestationObject) {
            context.res = {
                status: 400,
                body: "Malformed object"
            };
            return;
        }

        // Following the algorithm here: https://w3c.github.io/webauthn/#sctn-registering-a-new-credential
        const clientDataJSONArray = 
            Uint8Array.from(
                atob(req.body.clientDataJSON), c => c.charCodeAt(0));
        const c = JSON.parse(new TextDecoder().decode(
            clientDataJSONArray
            ));

        if (c.type !== 'webauthn.create') {
            context.res = {
                status: 400,
                body: 'client data type is not correct'
            };
            return;
        }

        const challenge = await getChallenge(context, req.body.id);

        if (!challenge) {
            context.res = {
              status: 404,
              body: 'Challenge not found'  
            };
            return;
        }

        // 8. require that the challenge matches
        if (challenge.randomBytes.replace(/=/g, '') !== c.challenge) {
            context.res = {
                status: 400,
                body: 'Invalid challenge value'
            };
            return;
        }

        await deleteChallenge(context, req.body.id);

        // 9 check that the origin matches
        if (c.origin.toLowerCase() !== process.env.ALLOWED_ORIGIN) {
            context.res = {
                status: 400,
                body: 'Invalid origin'
            };
            return;
        }

        // 10 check topOrigin
        if (c.topOrigin && c.topOrigin !== process.env.ALLOWED_ORIGIN) {
            context.res = {
                status: 400,
                body: 'Invalid top origin'
            };
            return;
        }

        const hash = crypto.createHash('sha256').update(clientDataJSONArray).digest();

        const attestationObjectBytes =
            Uint8Array.from(
                atob(req.body.attestationObject), c => c.charCodeAt(0));

        const attestationObject = cbor.decodeFirstSync(attestationObjectBytes);

        const fmt = attestationObject.fmt;

        if (fmt !== 'none') {
            // TODO: Validate provenance
        }

        const attStmt = attestationObject.attStmt;

        const authData = attestationObject.authData;

        const expectedRpIdHash = crypto.createHash('sha256').update(process.env.RP_ID, 'utf8').digest();

        const actualRpIdHash = authData.slice(0, 32);

        // 13 - compare RP ID hash
        if (expectedRpIdHash.compare(actualRpIdHash) !== 0) {
            context.res = {
                status: 400,
                body: 'Invalid RP ID'
            };
            return;
        }

        const flags = authData[32];

        // 14 check that the UP bit is present - least significant bit
        if (!(flags & (1 << 0))) {
            context.res = {
                status: 400,
                body: 'User not present'
            };
            return;
        }

        // 15 ensure user verification bit is present
        if (!(flags & (1 << 2))) {
            context.res = {
                status: 400,
                body: 'User verification not present'
            };
            return;
        }

        // 16 we don't care about backup eligibility

        // 17 we don't care about the backup state

        const aaguid = authData.slice(37, 53);

        const l = (authData[53] << 16) + authData[54];

        const credentialID = authData.slice(55, 55 + l);

        // after the credential ID we should have the public key - decode in CBOR again
        const keyData = authData.slice(55 + l);

        const publicKey = cbor.decodeFirstSync(keyData);

        // check the algorithm to be -7 as requested
        if (publicKey[3] !== -7) {
            context.res = {
                status: 400,
                body: 'Expected ES256 signature algorithm'
            };
            return;
        }

        const rest = cbor.decodeAllSync(keyData);
    
        const response = {
            challenge: challenge,
            clientData: c,
            attestationObject: attestationObject,
            hash: hash,
            flags: flags,
            aaguid: aaguid,
            l: l,
            credentialID: credentialID,
            keyData: keyData,
            rest: rest
        };
    
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: response
        };
    } catch (e) {
        context.res = {
            status: 500,
            body: '' + e
        };
    }
}