const crypto = require('crypto');
const { TableServiceClient, AzureNamedKeyCredential, TableClient } = require("@azure/data-tables");

async function insertChallenge(context) {
    try {
        const account = process.env.TABLES_STORAGE_ACCOUNT_NAME;
        const accountKey = process.env.TABLES_PRIMARY_STORAGE_ACCOUNT_KEY;
        const suffix = process.env.TABLES_STORAGE_ENDPOINT_SUFFIX;
    
        const url = 'https://' + account + '.table.' + suffix;
    
        const credential = new AzureNamedKeyCredential(account, accountKey);
        const serviceClient = new TableServiceClient(
            url,
            credential
        );
    
        const tableName = 'challenges';
        await serviceClient.createTable(tableName, {
            onResponse: (response) => {
                if (response.status === 409) {
                    context.log('Table challenges already exists');
                }
            }
        });
        const tableClient = new TableClient(url, tableName, credential);
        const rowKey = crypto.randomBytes(16).toString('hex');

        const randomBytes = crypto.randomBytes(16).toString('hex');

        let entity = {
            partitionKey: "Prod",
            rowKey: rowKey,
            randomBytes: randomBytes
        };
        await tableClient.createEntity(entity);
        return entity;
    } catch (err) {
        context.log(err);
        throw err;
    }
}

module.exports = async function (context, req) {
    context.log('Create Challenge HTTP trigger function processed a request.');

    const insertResult = await insertChallenge(context);

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: {
            challenge: insertResult.randomBytes,
            id: insertResult.rowKey
        }
    };
}