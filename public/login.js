async function loginUser(event) {
    event.preventDefault();
    console.log('Logowanie...');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // Wysyłamy dane logowania do backendu (serwera)
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
            // Jeśli dane są poprawne, przekierowujemy na welcome.html
            window.location.href = '/welcome.html';  // Zmienione z '/welcome' na '/welcome.html'
        } else {
            // Wyświetlamy komunikat o błędzie, jeśli logowanie się nie powiodło
            document.getElementById('message').innerText = result.message;
        }
    } catch (error) {
        console.error('Błąd podczas logowania:', error);
        // Jeśli wystąpi błąd po stronie serwera
        document.getElementById('message').innerText = 'Wystąpił błąd, spróbuj ponownie.';
    }
}
