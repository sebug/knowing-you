module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    if (!req.body || !req.body.id || !req.body.clientDataJSON || !req.body.attestationObject) {
        context.res = {
            status: 400,
            body: "Malformed object"
        };
    }

    const clientData = JSON.parse(new TextDecoder().decode(atob(req.body.clientDataJSON)));

    const response = {
        id: req.body.id,
        clientData: clientData,
        attestationObject: req.body.attestationObject
    };

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: response
    };
}