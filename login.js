async function loginUser(event) {
    event.preventDefault(); // Zapobiega domyślnemu zachowaniu formularza

    // Pobieramy dane użytkownika
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    try {
        // Wysłanie danych do serwera
        let response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        // Sprawdzamy odpowiedź z serwera
        let messageElement = document.getElementById('message');
        if (response.ok) {
            let data = await response.json();
            messageElement.className = 'success-message';
            messageElement.textContent = data.message; // Pokaż komunikat sukcesu
            setTimeout(() => {
                window.location.href = "welcome"; // Przekierowanie po udanym logowaniu
            }, 2000);
        } else {
            let errorData = await response.json();
            messageElement.className = 'error-message';
            messageElement.textContent = errorData.message; // Pokaż komunikat o błędzie
        }
    } catch (error) {
        console.error('Błąd:', error);
        alert('Wystąpił błąd podczas logowania. Spróbuj ponownie.');
    }
}