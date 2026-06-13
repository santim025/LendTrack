// Ejecutar esto en la consola del navegador (F12) estando logueado como admin
fetch('/api/admin/generate-all-payments', {method: 'POST'})
  .then(r => r.json())
  .then(data => {
    console.log('Resultados:', data);
    alert(`Se generaron ${data.totalCreated} pagos en total`);
  })
  .catch(err => {
    console.error('Error:', err);
    alert('Error al generar pagos');
  });
