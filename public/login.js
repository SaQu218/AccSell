async function loginUser(event) {
    event.preventDefault();
    console.log('Logowanie...');  // Sprawdź, czy ta linia jest wywoływana
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

        if (response.ok) {
            window.location.href = '/welcome'; // Przekierowanie na stronę powitalną
        } else {
            document.getElementById('message').innerText = result.message;
        }
    } catch (error) {
        console.error('Błąd podczas logowania:', error);
        document.getElementById('message').innerText = 'Wystąpił błąd, spróbuj ponownie.';
    }
}