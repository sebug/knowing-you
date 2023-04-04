module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (!req.body || !req.body.id || !req.body.clientDataJSON || !req.body.attestationObject) {
        context.res = {
            status: 400,
            body: "Malformed object"
        };
    }

    const response = {
        id: req.body.id,
        clientDataJSON: req.body.clientDataJSON,
        attestationObject: req.body.attestationObject
    };

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: response
    };
}