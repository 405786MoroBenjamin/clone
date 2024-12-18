document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');

    if (!token) {
        window.location.href = 'index.html'; // Redirigir al login si no hay token
        return;
    }

    // Verificar el token en el endpoint de validate-token
    const validateToken = async () => {
        try {
            const response = await fetch('http://localhost:3000/validate-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }) // Enviando el token en el cuerpo de la solicitud
            });

            if (!response.ok) {
                window.location.href = '../login/index.html';
                throw new Error('Token inválido');
                
            }

            // Si el token es válido, muestra el formulario
            document.getElementById('numberForm').style.display = 'block';
        } catch (error) {
            console.error('Error de validación de token:', error.message);
            document.getElementById('errorMessage').textContent = 'Token inválido';
            console.log("a");        
            window.location.href = '../login/login.html';
        }
    };

    validateToken();

    document.getElementById('numberForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const numero = document.getElementById('numero').value;

        try {
            const response = await fetch('http://localhost:3000/update-numero', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ numero, token }) // Incluyendo el token en el cuerpo de la solicitud
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el número');
            }

            alert('Número actualizado exitosamente');
        } catch (error) {
            alert(error.message);
        }
    });
});
