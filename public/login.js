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
            // Zapisujemy token JWT w ciasteczkach
            document.cookie = `token=${result.token}; path=/; secure; HttpOnly;`;

            // Przekierowanie na stronę powitalną
            window.location.href = '/welcome';
        } else {
            document.getElementById('message').innerText = result.message;
        }
    } catch (error) {
        console.error('Błąd podczas logowania:', error);
        document.getElementById('message').innerText = 'Wystąpił błąd, spróbuj ponownie.';
    }
}