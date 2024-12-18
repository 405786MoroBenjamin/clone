document.addEventListener("DOMContentLoaded", function () {
    const apiUrl = 'http://localhost:3000/get-numero';
    
    // Realizar la solicitud GET al endpoint
    fetch(apiUrl)
  .then(response => response.json())
  .then(data => {    
    if (data && data.numero !== undefined) {
      const numero = data.numero;
      const whatsappLink = document.querySelector("a[href*='whatsapp.com']");
      if (whatsappLink) {
        const newUrl = whatsappLink.href.replace(/phone=\d+/, `phone=${numero}`);
        whatsappLink.href = newUrl;
      }
    } else {
      console.error('No se pudo obtener el número.');
    }
  })
  .catch(error => console.error('Error al obtener el número:', error));

});
