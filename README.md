# ⏱️ Tempus Engine — Interactive Demo & Marketing Portal

[![Deploy to Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=tempus-dashboard)](https://tempus-dashboard-tempus-8cbd8ab9.vercel.app/)

> **Atención:** Esta rama (`public-sim`) está dedicada exclusivamente a la **interfaz pública, branding y demostración interactiva** del Motor Tempus. Utiliza WebAssembly (WASM) para ejecutar el motor de reglas en el navegador de los clientes con **0ms de latencia**, demostrando nuestras capacidades sin necesidad de desplegar infraestructura backend compleja.

🔗 **[Prueba la Live Demo Interactiva Aquí](https://tempus-dashboard-tempus-8cbd8ab9.vercel.app)**

---

## 🚀 El Pitch de Tempus

Tempus es la **Infraestructura Universal de Compliance y Precios con Viaje en el Tiempo**. 
Permite a las empresas financieras y plataformas SaaS procesar millones de transacciones, aplicar reglas de comisiones dinámicas y generar un rastro de auditoría criptográfico inmutable. Todo a la velocidad de la luz.

### ¿Qué demuestra este simulador?
Esta interfaz de marketing está diseñada para que prospectos y clientes experimenten de primera mano el poder del motor:
- **Latencia 0ms:** El motor de Rust compilado a WebAssembly se ejecuta directamente en el navegador del usuario. Cero llamadas a red durante la simulación.
- **Evaluación en Tiempo Real:** Al mover los parámetros (sliders), cientos de miles de transacciones se reevalúan instantáneamente.
- **Rastro de Auditoría Criptográfico:** Cada transacción genera un seudo-hash visual para explicar cómo Tempus garantiza la inmutabilidad y el "viaje en el tiempo" para compliance.

---

## 💼 Para el Equipo de Ventas / Demostraciones Offline

Si necesitas hacer una demostración a un cliente en un entorno sin conexión a internet o con alta seguridad, puedes correr este simulador localmente en tu máquina.

### Requisitos previos
- Node.js (v18 o superior) instalado.

### Pasos para levantar la demo local
1. Clona el repositorio y asegúrate de estar en la rama correcta:
   ```bash
   git checkout public-sim
   ```
2. Instala las dependencias desde la raíz del proyecto:
   ```bash
   npm install
   ```
3. Entra a la carpeta del dashboard y levanta el servidor de desarrollo:
   ```bash
   cd tempus-dashboard
   npm run dev
   ```
4. Abre tu navegador en `http://localhost:3000` y comienza la demostración.

---

## 🛠 Arquitectura de esta Demo (Marketing)
Para maximizar la velocidad y reducir costos de infraestructura durante la fase de captación de leads, esta rama utiliza una arquitectura simplificada:
- **Frontend:** Next.js (React) + Vanilla CSS para máximo rendimiento visual.
- **Motor Core:** Rust compilado a WebAssembly (`tempus_wasm`). Los binarios se sirven de forma estática.
- **Hosting:** Vercel (Edge Network).

*Para ver el código completo del backend en Python (FastAPI), bases de datos PostgreSQL y despliegues en contenedores Docker, por favor cambia a la rama `main` o de desarrollo.*
