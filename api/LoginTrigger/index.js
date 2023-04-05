module.exports = async function (context, req) {
    context.log('Login trigger function processed a request.');

    const response = {
        challengeID: req.body.challengeID,
        clientDataJSON: req.body.clientDataJSON
    };

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: response
    };
}