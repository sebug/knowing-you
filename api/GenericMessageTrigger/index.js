module.exports = async function (context, req) {
    context.log('Generic Message HTTP trigger function processed a request.');

    const responseMessage = "Anticipating";

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: responseMessage
    };
}