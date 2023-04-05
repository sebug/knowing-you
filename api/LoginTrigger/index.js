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

async function getCredential(context, rowKey) {
    try {
        const tableClient = await getTableClient(context, 'credentials');

        return await tableClient.getEntity('Prod', rowKey);
    } catch (err) {
        context.log(err);
        throw err;
    }
}

function webSafeBase64(s) {
    return s && s.replace(/=/g, '')
    .replace(/\//g, '_')
    .replace(/\+/g, '-');
}

module.exports = async function (context, req) {
    try {
        context.log('Login trigger function processed a request.');

        const challenge = await getChallenge(context, req.body.challengeID);
    
        const clientDataJSONArray = 
            Uint8Array.from(
                atob(req.body.clientDataJSON), c => c.charCodeAt(0));
        const c = JSON.parse(new TextDecoder().decode(
            clientDataJSONArray
            ));
    
        const credential = await getCredential(context, webSafeBase64(req.body.credentialID));
    
        const response = {
            challengeID: req.body.challengeID,
            clientData: c,
            challenge: challenge,
            credential: credential
        };
    
        context.res = {
            // status: 200, /* Defaults to 200 */
            body: response
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: '' + err
        };
    }
}