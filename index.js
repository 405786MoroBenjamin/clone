document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3000/get-numero');
        if (!response.ok) {
            throw new Error('Error al obtener el número');
        }

        const data = await response.json();
        if (data.numero) {
            // Selecciona todos los enlaces con la clase 'whatsappLink'
            const whatsappLinks = document.querySelectorAll('.whatsappLink');
            
            whatsappLinks.forEach(link => {
                // Actualiza el atributo href con el número dinámico
                link.href = `https://wa.me/${data.numero}?text=Hola!%20Quiero%20hacer%20una%20consulta.`;
            });
        } else {
            console.error('No se encontró el número');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
});
