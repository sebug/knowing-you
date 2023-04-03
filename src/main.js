async function register() {
    const challengeResponse = await fetch('/api/CreateChallengeTrigger');
    const challenge = await challengeResponse.json();

    console.log(challenge);
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
