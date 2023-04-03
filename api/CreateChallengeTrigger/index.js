const crypto = require('crypto');

module.exports = async function (context, req) {
    context.log('Create Challenge HTTP trigger function processed a request.');

    const randomBytes = crypto.randomBytes(64).toString('hex');
    const id = crypto.randomBytes(64).toString('hex');

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: {
            challenge: randomBytes,
            id: id
        }
    };
}