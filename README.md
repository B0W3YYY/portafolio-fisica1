# Portafolio de Física I (Entrega final)

Portafolio de evidencias del curso Física I, con el profesor Andrés Castro Núñez.
Hecho por Braden Lee Knuter Córdoba.

La página muestra cómo la física de clase se usa en software real. Esta es la entrega final: los 13 temas del curso, dos temas extra y la sección de cierre "Qué aprendí".

Avance 1 (cinemática y dinámica):

1. Rastreo y navegación de un dron de reparto (gráficas)
2. El salto del personaje: cómo los motores de juego falsean la gravedad (simulación interactiva)
3. Gravedad artificial por rotación en hábitats espaciales (diagrama SVG y caso numérico)
4. Llantas de Fórmula 1: la ventana de temperatura y el agarre (gráficas)
5. El resorte virtual detrás de un control háptico (video con análisis)

Avance 2 (leyes de conservación y gravitación):

6. Frenado regenerativo en un vehículo eléctrico (gráficas con el ciclo UDDS de la EPA)
7. El coeficiente de restitución en un motor de videojuego: por qué la pelota rebota mal (simulación interactiva)
8. Ruedas de reacción: cómo un satélite se gira sin empujarse contra nada (diagrama SVG)
9. Asistencia gravitatoria: cómo la Voyager ganó velocidad sin gastar combustible (gráfica con datos de JPL Horizons)

Entrega final (oscilaciones y mecánica de fluidos):

10. Spring animations: el resorte amortiguado detrás de las animaciones de iOS y de Framer Motion (simulación interactiva)
11. Síntesis de sonido: armónicos, timbre y el sintetizador (dos audios con forma de onda, armónicos y análisis)
12. Resonancia estructural: Tacoma Narrows y por qué las tropas rompen el paso al cruzar un puente (video con análisis)
13. Enfriamiento líquido de un centro de datos: continuidad, caudal y Bernoulli (gráficas)

Temas extra:

14. Ecuaciones de Navier-Stokes (gráficas del flujo de Poiseuille)
15. Teorema de Torricelli (simulación interactiva del tanque)

Cierre: "Qué aprendí", con el mapa de conexiones y una aplicación propia.

Página publicada: https://b0w3yyy.github.io/portafolio-fisica1/

Repositorio: https://github.com/B0W3YYY/portafolio-fisica1

## Archivos

- `index.html`: contenido de la página
- `style.css`: diseño
- `script.js`: temas desplegables, gráficas, simulaciones (salto, rebote, resorte y tanque) e índice
- `datos/udds.js`: rapidez del ciclo urbano UDDS (EPA)
- `datos/voyager2.js`: rapidez de la Voyager 2 respecto al Sol (JPL Horizons)
- `audio/`: las dos muestras de audio del tema 11, generadas con Python (síntesis aditiva)

Es un sitio estático, así que no necesita servidor. Las ecuaciones usan KaTeX y las gráficas Chart.js, las dos por CDN.
