async function loginUser(event) {
    event.preventDefault();  // Zatrzymanie domyślnego działania formularza (czyli odświeżania strony)

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Jeśli logowanie się powiodło, przekieruj do strony powitalnej
            window.location.href = '/welcome';
        } else {
            // Jeśli logowanie się nie udało, wyświetl komunikat o błędzie
            document.getElementById('message').textContent = data.message || 'Wystąpił błąd.';
        }
    } catch (error) {
        console.error('Błąd logowania:', error);
        document.getElementById('message').textContent = 'Błąd połączenia z serwerem';
    }
}