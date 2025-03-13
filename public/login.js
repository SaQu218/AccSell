async function loginUser(event) {
    event.preventDefault();  // Zapobiega przeładowaniu strony po wysłaniu formularza

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // Wysłanie zapytania do serwera z danymi logowania
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

        if (response.ok) {
            // Jeśli logowanie powiodło się, przekierowanie na stronę powitalną lub główną
            window.location.href = '/welcome'; // Przekierowanie na stronę powitalną
        } else {
            // Jeśli logowanie nie powiodło się, wyświetlenie komunikatu
            document.getElementById('message').innerText = result.message;
        }
    } catch (error) {
        console.error('Błąd podczas logowania:', error);
        document.getElementById('message').innerText = 'Wystąpił błąd, spróbuj ponownie.';
    }
}