const crypto = require('crypto');
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
    
        const c = JSON.parse(new TextDecoder().decode(
            Uint8Array.from(
            atob(req.body.clientDataJSON), c => c.charCodeAt(0))));

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

        
    
        const response = {
            challenge: challenge,
            clientData: c,
            attestationObject: req.body.attestationObject
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