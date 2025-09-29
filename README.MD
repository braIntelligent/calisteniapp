# CalistheniApp API 💪

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-green.svg)
![Express](https://img.shields.io/badge/Express-5.0+-lightgrey.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

**CalistheniApp** es una API RESTful para encontrar y compartir ubicaciones de barras de calistenia. Los usuarios pueden descubrir equipamiento de ejercicio cercano, calificar ubicaciones, y contribuir a una comunidad activa de entrenamiento.

## 🌟 Características

- 🗺️ **Geolocalización GPS**: Busca barras por ubicación con radio personalizable
- 📍 **Publicación de ubicaciones**: Los usuarios pueden agregar nuevas barras con coordenadas precisas
- ⭐ **Sistema de ratings**: Califica y comenta sobre las ubicaciones
- 🔍 **Búsqueda avanzada**: Filtra por tipo de equipamiento, características y puntuación
- 🔐 **Autenticación JWT**: Sistema seguro de usuarios con roles
- 📱 **API RESTful**: Endpoints bien documentados y fáciles de integrar
- 📊 **Documentación Swagger**: Interfaz interactiva para testing
- 🛡️ **Validación robusta**: Validación de datos con Zod

## 🏗️ Tecnologías

- **Backend**: Node.js + Express.js + TypeScript
- **Base de datos**: MongoDB + Mongoose
- **Autenticación**: JSON Web Tokens (JWT)
- **Validación**: Zod
- **Documentación**: Swagger/OpenAPI
- **Geolocalización**: Cálculos con fórmula Haversine
- **Seguridad**: bcrypt para passwords, middleware de autenticación

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+
- MongoDB 7.0+
- pnpm (recomendado) o npm

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/calisteniapp.git
cd calisteniapp
```

### 2. Instalar dependencias

```bash
pnpm install
# o
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Completa las variables necesarias:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/calisteniapp

# Server
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=tu_clave_secreta_super_larga_y_compleja_aqui
JWT_EXPIRES_IN=7d
```

### 4. Generar clave JWT segura

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Crear el primer administrador

```bash
pnpm run create-admin
```

### 6. Iniciar el servidor

```bash
# Desarrollo
pnpm run dev

# Producción
pnpm run build
pnpm start
```

La API estará disponible en `http://localhost:3000`

## 📚 Documentación

### Swagger UI
Accede a la documentación interactiva en: `http://localhost:3000/api-docs`

### Endpoints principales

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/users/register` | Registrar usuario | ❌ |
| `POST` | `/api/v1/users/login` | Iniciar sesión | ❌ |
| `GET` | `/api/v1/users/profile` | Perfil usuario | ✅ |
| `POST` | `/api/v1/bars` | Crear barra | ✅ |
| `GET` | `/api/v1/bars` | Listar barras | ❌ |
| `GET` | `/api/v1/bars/search` | Buscar por GPS | ❌ |
| `GET` | `/api/v1/bars/:id` | Obtener barra | ❌ |
| `PUT` | `/api/v1/bars/:id` | Actualizar barra | ✅ |

### Ejemplos de uso

#### 1. Registrar usuario

```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "atleta123",
    "email": "atleta@example.com",
    "password": "MiPassword123!",
    "confirmPassword": "MiPassword123!"
  }'
```

#### 2. Buscar barras cercanas

```bash
curl -X GET "http://localhost:3000/api/v1/bars/search?latitude=-33.4489&longitude=-70.6693&radius=5"
```

#### 3. Crear nueva ubicación de barras

```bash
curl -X POST http://localhost:3000/api/v1/bars \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_jwt_token" \
  -d '{
    "name": "Parque O'\'Higgins - Área Calistenia",
    "description": "Excelente set de barras para entrenar",
    "location": {
      "coordinates": {
        "latitude": -33.4489,
        "longitude": -70.6693
      },
      "address": "Parque O'\'Higgins, Santiago"
    },
    "equipment": {
      "pullUpBar": true,
      "parallelBars": true,
      "rings": false
    },
    "features": {
      "parking": true,
      "lighting": true
    }
  }'
```

## 🏛️ Estructura del Proyecto

```
src/
├── config/
│   ├── db.config.ts          # Configuración MongoDB
│   └── swagger.config.ts     # Configuración Swagger
├── controllers/
│   ├── user.controller.ts    # Lógica de usuarios
│   └── bar.controller.ts     # Lógica de barras
├── interfaces/
│   ├── user.interface.ts     # Tipos de usuario
│   ├── bar.interface.ts      # Tipos de barras
│   ├── comment.interface.ts  # Tipos de comentarios
│   └── punctuation.interface.ts # Tipos de ratings
├── middlewares/
│   └── auth.middleware.ts    # Middleware de autenticación
├── models/
│   ├── user.schema.ts        # Schema de usuario
│   ├── bar.schema.ts         # Schema de barras
│   ├── comment.schema.ts     # Schema de comentarios
│   └── punctuation.schema.ts # Schema de ratings
├── routes/
│   ├── user.routes.ts        # Rutas de usuarios
│   └── bar.routes.ts         # Rutas de barras
├── scripts/
│   └── createFirstAdmin.ts   # Script crear admin
├── utils/
│   ├── user.helpers.ts       # Utilidades usuario
│   └── geo.helpers.ts        # Utilidades geolocalización
├── validations/
│   ├── user.validation.ts    # Middleware validación
│   └── schemas/
│       ├── user.schemazod.ts # Schemas Zod usuario
│       └── bar.schemazod.ts  # Schemas Zod barras
├── server/
│   └── server.ts             # Configuración Express
└── app.ts                    # Punto de entrada
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo con hot-reload
pnpm run dev

# Crear primer administrador
pnpm run create-admin

# Construir para producción
pnpm run build

# Iniciar en producción
pnpm start

# Linting (si se configura)
pnpm run lint

# Tests (si se configura)
pnpm test
```

## 🌍 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `MONGODB_URI` | URI de conexión MongoDB | `mongodb://localhost:27017/calisteniapp` |
| `PORT` | Puerto del servidor | `3000` |
| `JWT_SECRET` | Clave secreta para JWT | `tu_clave_super_secreta` |
| `JWT_EXPIRES_IN` | Tiempo de expiración JWT | `7d` |
| `NODE_ENV` | Entorno de ejecución | `development` |

## 📊 Modelo de Datos

### Usuario
```typescript
{
  username: string;        // Único, 3-30 caracteres
  email: string;          // Único, formato email
  password: string;       // Hasheado con bcrypt
  role: "admin" | "user"; // Rol del usuario
  active: boolean;        // Estado activo
  registerDate: Date;     // Fecha registro
}
```

### Barra de Calistenia
```typescript
{
  name: string;           // Nombre ubicación
  description: string;    // Descripción detallada
  creator: ObjectId;      // Usuario creador
  location: {
    coordinates: {
      latitude: number;   // GPS latitud
      longitude: number;  // GPS longitud
    };
    address?: string;     // Dirección opcional
  };
  equipment: {
    pullUpBar: boolean;   // Barra dominadas
    parallelBars: boolean; // Barras paralelas
    wallBars: boolean;    // Espalderas
    rings: boolean;       // Anillas
    other?: string;       // Otro equipamiento
  };
  features: {
    parking: boolean;     // Estacionamiento
    lighting: boolean;    // Iluminación nocturna
    accessibility: boolean; // Accesible
    covered: boolean;     // Techado
  };
  averageRating: number;  // Rating promedio
  totalRatings: number;   // Total de ratings
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🛡️ Seguridad

- ✅ Contraseñas hasheadas con bcrypt (salt: 14)
- ✅ Autenticación JWT con expiración configurable
- ✅ Validación de entrada con Zod
- ✅ Middleware de autorización por roles
- ✅ Validación de coordenadas GPS
- ✅ Rate limiting (próximamente)
- ✅ Sanitización de datos

## 🌐 Geolocalización

La API utiliza:
- **Fórmula Haversine** para cálculo de distancias precisas
- **Validación GPS** de coordenadas válidas (-90/90, -180/180)
- **Búsqueda por radio** hasta 50km
- **Prevención de duplicados** en radio de 50 metros
- **Coordenadas de Chile** incluidas para testing

### Ciudades de referencia (Chile)
```javascript
santiago: { latitude: -33.4489, longitude: -70.6693 }
valparaiso: { latitude: -33.0361, longitude: -71.6297 }  
concepcion: { latitude: -36.8201, longitude: -73.0444 }
```

## 🚧 Estado del Proyecto

### ✅ Completado
- [x] Sistema de usuarios con autenticación JWT
- [x] CRUD de barras de calistenia
- [x] Búsqueda geográfica con GPS
- [x] Filtros avanzados
- [x] Documentación Swagger
- [x] Validaciones robustas

### 🔄 En Desarrollo
- [ ] Sistema de comentarios
- [ ] Sistema de ratings/puntuaciones
- [ ] Subida de imágenes
- [ ] Notificaciones
- [ ] Sistema de favoritos

### 🎯 Futuras Mejoras
- [ ] Rate limiting
- [ ] Cache con Redis
- [ ] Tests automatizados
- [ ] Logging avanzado
- [ ] Métricas y monitoreo
- [ ] WebSocket para actualizaciones en tiempo real

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request
<!-- 
## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 📞 Contacto

- **Autor**: Tu Nombre
- **Email**: tu.email@example.com
- **GitHub**: [@tu-usuario](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- Comunidad de calistenia
- Contribuidores de código abierto
- Documentación de MongoDB, Express y TypeScript

---

**¿Encontraste un bug o tienes una sugerencia?** 
[Abre un issue](https://github.com/tu-usuario/calisteniapp/issues) o contribuye al proyecto 🚀 -->