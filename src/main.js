async function register() {
    if (!navigator.credentials || !navigator.credentials.create) {
        return;
    }

    const challengeResponse = await fetch('/api/CreateChallengeTrigger');
    const challengeObject = await challengeResponse.json();

    const challengeArray = Uint8Array.from(challengeObject.challenge.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    const createCredentialDefaultArgs = {
        publicKey: {
          // Relying Party (a.k.a. - Service):
          rp: {
            name: "sebugch",
          },
      
          pubKeyCredParams: [
            {
              type: "public-key",
              alg: -7,
            },
          ],
      
          attestation: "direct",
      
          timeout: 60000,
      
          challenge: challengeArray.buffer,
        }
      };
    
    const credentialResponse = await navigator.credentials.create(createCredentialDefaultArgs);
    console.log(credentialResponse);
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
