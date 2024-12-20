document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');

    if (!token) {
        window.location.href = '../login/index.html'; // Redirigir al login si no hay token
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
            window.location.href = '../login/index.html';
        }
    };

    validateToken();

    document.getElementById('numberForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const numero = Number(document.getElementById('numero').value); // Convertir a número
        if (isNaN(numero)) {
            alert('Por favor ingresa un valor numérico válido');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3000/update-numero', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ numero, token }) // Incluyendo el token en el cuerpo de la solicitud
            });

            if (!response.ok) {
                const errorResponse = await response.json();
                throw new Error(errorResponse.error || 'Error al actualizar el número');
            }

            alert('Número actualizado exitosamente');
        } catch (error) {
            alert(error.message);
        }
    });
});
