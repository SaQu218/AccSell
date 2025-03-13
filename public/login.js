async function loginUser(event) {
    event.preventDefault();
    console.log('Logowanie...');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
            }),
        });

        const result = await response.json();
        console.log(result);  // Sprawdzamy odpowiedź

        if (response.ok) {
            // Po pomyślnym zalogowaniu przekierowanie na welcome.html
            window.location.href = '/welcome.html';  // Zmienione z '/welcome' na '/welcome.html'
        } else {
            document.getElementById('message').innerText = result.message;
        }
    } catch (error) {
        console.error('Błąd podczas logowania:', error);
        document.getElementById('message').innerText = 'Wystąpił błąd, spróbuj ponownie.';
    }
}
