import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

// Configuración con tu URL del proyecto "Contador-Aves-EUREKA"
const LIKES_CONFIG = {
  databaseURL: 'https://contador-aves-eureka-default-rtdb.firebaseio.com', 
  ruta: 'likes/total',
  sdk: '12.19.0'
};

// 1. Inicializar Firebase
const app = initializeApp({
  databaseURL: LIKES_CONFIG.databaseURL
});
const db = getDatabase(app);
const likesRef = ref(db, LIKES_CONFIG.ruta);

// 2. Escuchar cambios en tiempo real
// (Cambia 'contador-corazones' por el ID de tu elemento HTML que muestra el número)
const contadorVisual = document.getElementById('contador-corazones');

onValue(likesRef, (snapshot) => {
  const totalLikes = snapshot.val() || 0;
  if (contadorVisual) {
    contadorVisual.textContent = totalLikes;
  }
});

// 3. Función para sumar un corazón de forma segura (Transacción)
// Se usa "runTransaction" para evitar que múltiples clics simultáneos causen errores
export function enviarCorazon() {
  runTransaction(likesRef, (currentValue) => {
    // Si no existe el nodo en la base de datos, empieza en 1, si existe le suma 1
    return (currentValue || 0) + 1;
  })
  .then(() => console.log("¡Corazón enviado con éxito! uwu"))
  .catch((error) => console.error("Error al enviar corazón:", error));
}

// 4. Vincular el botón de corazones (Opcional)
// (Cambia 'boton-corazon' por el ID de tu botón/icono de corazón)
const botonCorazon = document.getElementById('boton-corazon');
if (botonCorazon) {
  botonCorazon.addEventListener('click', enviarCorazon);
}
