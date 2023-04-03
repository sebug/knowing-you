async function register() {
    const challengeResponse = await fetch('/api/CreateChallengeTrigger');
    const challengeObject = await challengeResponse.json();

    const challengeArray = Uint8Array.from(challengeObject.challeng.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    console.log(challengeArray);
}


async function getMessage() {
    const genericMessageResponse = await fetch('/api/GenericMessageTrigger');
    const genericContent = await genericMessageResponse.text();

    const messagePlaceholder = document.querySelector('#message-placeholder');
    if (messagePlaceholder) {
        messagePlaceholder.innerHTML = genericContent;
    }
}

getMessage();

register();
