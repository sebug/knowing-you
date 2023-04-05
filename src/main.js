async function register() {
    if (!window.PublicKeyCredential) {
      return;
    }
    if (!navigator.credentials || !navigator.credentials.create) {
        return;
    }

    const usernameEl = document.querySelector('#username-field');
    const displayNameEl = document.querySelector('#displayname');

    const userName = usernameEl.value;
    const displayName = displayNameEl.value;

    const challengeResponse = await fetch('/api/CreateChallengeTrigger');
    const challengeObject = await challengeResponse.json();

    const challengeArray = Uint8Array.from(atob(challengeObject.challenge), c => c.charCodeAt(0));

    const createCredentialDefaultArgs = {
        publicKey: {
          // Relying Party (a.k.a. - Service):
          rp: {
            name: "delightful-meadow-0e5ed2b03.2.azurestaticapps.net"
          },

          user: {
            id: new Uint8Array(16),
            name: userName,
            displayName: displayName,
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

    const objectToSend = {
      id: challengeObject.id,
      clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(credentialResponse.response.clientDataJSON))),
      attestationObject: btoa(String.fromCharCode(...new Uint8Array(credentialResponse.response.attestationObject))),
      userName: userName,
      displayName: displayName,
      transports: credentialResponse.response.getTransports()
    };
    const registerResponse = await fetch('/api/RegisterTrigger', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(objectToSend)});
    const registerObj = await registerResponse.json();
    console.log(registerObj);
}

async function login() {
  console.log('Starting login');
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

const registerForm = document.querySelector('#register');
if (registerForm) {
    registerForm.addEventListener('submit', (ev) => {
        register();
        ev.preventDefault();
    });
}

const loginForm = document.querySelector('#login');
if (loginForm) {
  loginForm.addEventListener('submit', (ev) => {
    login();
    ev.preventDefault();
  });
}