document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error('Credenciales inválidas');
        }

        const { token } = await response.json();
        localStorage.setItem('authToken', token);
        window.location.href = '../form/index.html';
    } catch (error) {
        errorMessage.textContent = error.message;
    }
});
