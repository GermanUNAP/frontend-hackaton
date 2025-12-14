# Frontend Hackaton - Aprendizaje de Aymara

Una plataforma educativa interactiva diseñada para enseñar el idioma aymara a través de juegos divertidos y actividades culturales. Este proyecto frontend forma parte de un hackatón y se conecta a un backend separado para la autenticación y gestión de usuarios.

## 🎯 Descripción del Proyecto

Esta aplicación web permite a estudiantes aprender el idioma aymara mediante juegos interactivos que combinan tecnología moderna con elementos culturales andinos. Los usuarios pueden registrarse como estudiantes o profesores, y acceder a diferentes actividades educativas.

### Características Principales

- **Autenticación de Usuarios**: Sistema de login/registro con roles de estudiante y profesor
- **Juegos Educativos**:
  - **Adivina la Palabra**: Versión de Wordle en idioma aymara con traducciones al español
  - **Escribe con Tux**: Juego de mecanografía con palabras aymara representadas por imágenes de productos peruanos
  - **Conoce las Partes del Cuerpo**: Juego que utiliza inteligencia artificial para detectar poses corporales
  - **Ritual de Agradecimiento**: Actividad cultural de arrastrar y soltar elementos tradicionales
- **Interfaz Bilingüe**: Español como idioma principal, con contenido en aymara
- **Responsive Design**: Adaptable a diferentes dispositivos

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 19.2.3** - Framework principal
- **TypeScript** - Tipado estático
- **React Router DOM 7.10.1** - Navegación
- **Axios 1.13.2** - Cliente HTTP para API
- **TensorFlow.js 4.22.0** - Detección de poses para el juego de partes del cuerpo
- **@tensorflow-models/pose-detection 2.1.3** - Modelo de IA para poses
- **React Webcam 7.2.0** - Acceso a cámara web
- **HTML2Canvas 1.4.1** - Captura de pantalla para exportar rituales

### Desarrollo
- **Create React App** - Configuración inicial
- **ESLint** - Linting
- **Testing Library** - Pruebas

## 📁 Estructura del Proyecto

```
frontend-hackaton/
├── public/
│   ├── imgs/           # Imágenes de productos peruanos para juegos
│   ├── dictionary.json # Diccionario aymara-español
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/     # Componentes React
│   │   ├── Auth.css, Login.tsx, Register.tsx
│   │   ├── Home.tsx, Home.css
│   │   ├── WordlePage.tsx, wordle.css
│   │   ├── TuxTypingNew.tsx
│   │   ├── BodyPartsGame.tsx, BodyPartsGame.css
│   │   ├── Ritual.tsx, Ritual.css
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── authService.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx, App.css
│   └── index.tsx
├── .env               # Variables de entorno
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn
- Backend corriendo en `http://localhost:3001` (ver repositorio del backend)

### Instalación

1. **Clona el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd frontend-hackaton
   ```

2. **Instala dependencias**
   ```bash
   npm install
   ```

3. **Configura variables de entorno**
   
   Crea un archivo `.env` en la raíz del proyecto:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:3001
   ```

4. **Inicia el servidor de desarrollo**
   ```bash
   npm start
   ```

   La aplicación estará disponible en `http://localhost:3000`

### Comandos Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm build` - Construye la aplicación para producción
- `npm test` - Ejecuta las pruebas
- `npm eject` - Expulsa la configuración de CRA (irreversible)

## 🎮 Juegos y Actividades

### 1. Adivina la Palabra (Wordle en Aymara)
- Juego de adivinanza de palabras en idioma aymara
- 5 intentos para adivinar la palabra correcta
- Traducciones automáticas al español
- Diccionario integrado con más de 100 palabras

### 2. Escribe con Tux
- Juego de mecanografía con Tux (pingüino de Linux)
- Palabras aymara representadas por imágenes de productos peruanos
- Dificultad progresiva
- Sistema de vidas y puntuación

### 3. Conoce las Partes del Cuerpo
- Utiliza la cámara web y IA para detectar poses
- Señala partes del cuerpo siguiendo instrucciones
- Detección en tiempo real con TensorFlow.js
- Interfaz visual con cajas delimitadoras

### 4. Ritual de Agradecimiento
- Actividad cultural andina
- Arrastrar y soltar elementos tradicionales (hojas de coca, vino, frutas)
- Exportar el ritual completado como imagen
- Enseñanza sobre tradiciones peruanas

## 🔐 Autenticación

El sistema soporta dos tipos de usuarios:

- **Estudiantes**: Acceso completo a todos los juegos
- **Profesores**: Panel de gestión adicional (en desarrollo)

### Endpoints de API
- `POST /auth/login` - Inicio de sesión
- `POST /auth/register` - Registro de usuario

## 🌐 Diccionario Aymara-Español

El proyecto incluye un diccionario JSON con traducciones entre aymara y español, utilizado principalmente en:
- Juego de Wordle
- Juego de mecanografía TuxTyping

Ejemplo de entrada:
```json
{
  "es": "perro",
  "ay": "anu"
}
```

## 🎨 Diseño y UX

- **Tema Cultural**: Colores e imágenes inspirados en la cultura andina
- **Interfaz Intuitiva**: Navegación simple con botones claros
- **Responsive**: Adaptable a móviles y tablets
- **Accesibilidad**: Soporte para navegación por teclado

## 🔧 Configuración de Desarrollo

### TypeScript
- Configurado con `strict: true`
- Interfaces definidas en `src/types/index.ts`
- JSX con `react-jsx`

### ESLint
- Configuración estándar de Create React App
- Reglas de React y Jest incluidas

### Variables de Entorno
- `REACT_APP_BACKEND_URL`: URL del backend API

## 📱 Compatibilidad

- **Navegadores**: Chrome, Firefox, Safari, Edge (últimas versiones)
- **Dispositivos**: Desktop, tablets, móviles
- **Requisitos**: Cámara web para el juego de partes del cuerpo

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es parte de un hackatón educativo y su uso está destinado a fines de aprendizaje.

## 🙏 Agradecimientos

- Comunidad de desarrolladores de React
- Equipo de TensorFlow.js
- Recursos culturales andinos utilizados en el proyecto
- Participantes del hackatón

---

**Nota**: Este es un proyecto educativo desarrollado durante un hackatón. Para producción, considera implementar pruebas más exhaustivas, optimización de rendimiento y medidas de seguridad adicionales.
