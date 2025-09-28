# CalistheniApp API Documentation

## Información General

**CalistheniApp** es una aplicación para encontrar y compartir ubicaciones de barras de calistenia. Los usuarios pueden:
- 📍 Publicar ubicaciones de barras de ejercicio con GPS
- 📸 Subir fotos del equipamiento  
- ⭐ Calificar y comentar sobre las barras
- 🔍 Buscar barras cercanas por ubicación
- 💪 Encontrar el mejor equipamiento para entrenar

- **Versión**: 1.0.0
- **Base URL**: `http://localhost:3000/api/v1`
- **Documentación Swagger**: `http://localhost:3000/api-docs`

## Autenticación

La API utiliza autenticación JWT (JSON Web Tokens). Para acceder a endpoints protegidos, incluye el token en el header:

```
Authorization: Bearer <tu_jwt_token>
```

## Endpoints

### 🔐 Autenticación

#### Registrar Usuario
```http
POST /users/register
```

**Cuerpo de la petición:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!"
}
```

**Respuesta (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "60d5ec49f1b2c8b1f8c4e5a1",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "active": true,
    "registerDate": "2023-06-25T10:30:00.000Z"
  }
}
```

#### Iniciar Sesión
```http
POST /users/login
```

**Cuerpo de la petición:**
```json
{
  "emailOrUsername": "john@example.com",
  "password": "Password123!"
}
```

**Respuesta (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "60d5ec49f1b2c8b1f8c4e5a1",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "active": true,
    "registerDate": "2023-06-25T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 👤 Gestión de Usuarios

#### Obtener Perfil Propio
```http
GET /users/profile
```
**Autenticación:** Requerida

**Respuesta (200):**
```json
{
  "user": {
    "id": "60d5ec49f1b2c8b1f8c4e5a1",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "active": true,
    "registerDate": "2023-06-25T10:30:00.000Z"
  }
}
```

#### Actualizar Usuario
```http
PUT /users/:id
```
**Autenticación:** Requerida (propio usuario o admin)

**Cuerpo de la petición:**
```json
{
  "newUsername": "newusername",
  "newEmail": "newemail@example.com",
  "newPassword": "NewPassword123!",
  "confirmPassword": "NewPassword123!",
  "currentPassword": "Password123!"
}
```

### 🔧 Administración (Solo Admin)

#### Listar Usuarios
```http
GET /users/
```
**Autenticación:** Requerida (Admin)

#### Obtener Usuario por ID
```http
GET /users/:id
```
**Autenticación:** Requerida (Admin)

#### Activar Usuario
```http
PATCH /users/:id/activate
```
**Autenticación:** Requerida (Admin)

#### Desactivar Usuario
```http
DELETE /users/:id/deactivate
```
**Autenticación:** Requerida (Admin)

#### Crear Administrador
```http
POST /users/admin/create
```
**Autenticación:** Requerida (Admin)

**Cuerpo de la petición:**
```json
{
  "username": "adminuser",
  "email": "admin@example.com",
  "password": "AdminPass123!"
}
```

## Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Error de validación |
| 401 | Unauthorized - Token ausente o inválido |
| 403 | Forbidden - Acceso denegado |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (email/username ya existe) |
| 500 | Internal Server Error - Error del servidor |

## Ejemplos de Errores

### Error de Validación (400)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### Error de Autenticación (401)
```json
{
  "error": "Access denied. No token provided"
}
```

### Error de Autorización (403)
```json
{
  "error": "Admin privileges required"
}
```

## Esquemas de Datos