// src/config/swagger.config.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CalistheniApp API',
      version: '1.0.0',
      description: 'API para gestión de ubicaciones de barras de calistenia. Los usuarios pueden publicar barras de ejercicio con ubicación GPS, descripción, imágenes, comentarios y puntuaciones.',
      contact: {
        name: 'API Support',
        email: 'support@calistheniapp.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.calistheniapp.com/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        // Esquemas de User
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del usuario',
            },
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 30,
              description: 'Nombre de usuario único',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Correo electrónico del usuario',
            },
            role: {
              type: 'string',
              enum: ['admin', 'user'],
              description: 'Rol del usuario',
            },
            active: {
              type: 'boolean',
              description: 'Estado activo del usuario',
            },
            registerDate: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de registro',
            },
          },
        },
        CreateUserRequest: {
          type: 'object',
          required: ['username', 'email', 'password', 'confirmPassword'],
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 30,
              pattern: '^[a-zA-Z0-9]+$',
              description: 'Nombre de usuario (solo letras y números)',
            },
            email: {
              type: 'string',
              format: 'email',
              maxLength: 255,
              description: 'Correo electrónico válido',
            },
            password: {
              type: 'string',
              minLength: 8,
              maxLength: 128,
              pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,128}$',
              description: 'Contraseña (mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial)',
            },
            confirmPassword: {
              type: 'string',
              description: 'Confirmación de contraseña',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['emailOrUsername', 'password'],
          properties: {
            emailOrUsername: {
              type: 'string',
              description: 'Email o nombre de usuario',
            },
            password: {
              type: 'string',
              description: 'Contraseña del usuario',
            },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Login successful',
            },
            user: {
              $ref: '#/components/schemas/User',
            },
            token: {
              type: 'string',
              description: 'JWT token para autenticación',
            },
          },
        },
        UpdateUserRequest: {
          type: 'object',
          required: ['currentPassword'],
          properties: {
            newUsername: {
              type: 'string',
              minLength: 3,
              maxLength: 30,
              pattern: '^[a-zA-Z0-9]+$',
              description: 'Nuevo nombre de usuario (opcional)',
            },
            newEmail: {
              type: 'string',
              format: 'email',
              description: 'Nuevo email (opcional)',
            },
            newPassword: {
              type: 'string',
              minLength: 8,
              maxLength: 128,
              description: 'Nueva contraseña (opcional)',
            },
            confirmPassword: {
              type: 'string',
              description: 'Confirmación de nueva contraseña',
            },
            currentPassword: {
              type: 'string',
              description: 'Contraseña actual (requerida)',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensaje de error',
            },
            field: {
              type: 'string',
              description: 'Campo específico con error (opcional)',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
              description: 'Detalles de errores de validación',
            },
          },
        },
        // Esquemas de Bar (equipamiento de calistenia)
        CalisthenicsBar: {
          type: 'object',
          properties: {
            id: { 
              type: 'string',
              description: 'ID único de la barra'
            },
            name: { 
              type: 'string',
              description: 'Nombre/título de la ubicación de la barra'
            },
            description: { 
              type: 'string',
              description: 'Descripción del equipamiento y ubicación'
            },
            creator: { 
              type: 'string',
              description: 'ID del usuario que publicó la barra'
            },
            location: {
              type: 'object',
              properties: {
                coordinates: {
                  type: 'object',
                  properties: {
                    latitude: { type: 'number', description: 'Latitud GPS' },
                    longitude: { type: 'number', description: 'Longitud GPS' }
                  }
                },
                address: { type: 'string', description: 'Dirección aproximada' }
              }
            },
            images: {
              type: 'array',
              items: { type: 'string' },
              description: 'URLs de imágenes del equipamiento'
            },
            equipment: {
              type: 'object',
              properties: {
                pullUpBar: { type: 'boolean', description: 'Tiene barra para dominadas' },
                parallelBars: { type: 'boolean', description: 'Tiene barras paralelas' },
                wallBars: { type: 'boolean', description: 'Tiene espalderas' },
                rings: { type: 'boolean', description: 'Tiene anillas' },
                other: { type: 'string', description: 'Otro equipamiento disponible' }
              }
            },
            comments: {
              type: 'array',
              items: { type: 'string' },
              description: 'IDs de comentarios'
            },
            ratings: {
              type: 'array',
              items: { type: 'string' },
              description: 'IDs de puntuaciones'
            },
            averageRating: {
              type: 'number',
              minimum: 1,
              maximum: 5,
              description: 'Puntuación promedio'
            },
            parking: { 
              type: 'boolean',
              description: 'Disponibilidad de estacionamiento cercano'
            },
            accessibility: {
              type: 'boolean',
              description: 'Accesible para personas con discapacidad'
            },
            lighting: {
              type: 'boolean',
              description: 'Tiene iluminación para entrenar de noche'
            },
            active: { 
              type: 'boolean',
              description: 'Estado activo de la publicación'
            },
            createdAt: { 
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updatedAt: { 
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          },
        },
        CreateBarRequest: {
          type: 'object',
          required: ['name', 'description', 'location'],
          properties: {
            name: {
              type: 'string',
              minLength: 3,
              maxLength: 100,
              description: 'Nombre de la ubicación (ej: "Parque Central - Barras")'
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 500,
              description: 'Descripción detallada del equipamiento y ubicación'
            },
            location: {
              type: 'object',
              required: ['latitude', 'longitude'],
              properties: {
                latitude: { 
                  type: 'number',
                  minimum: -90,
                  maximum: 90,
                  description: 'Latitud GPS'
                },
                longitude: { 
                  type: 'number',
                  minimum: -180,
                  maximum: 180,
                  description: 'Longitud GPS'
                },
                address: {
                  type: 'string',
                  description: 'Dirección o referencia del lugar'
                }
              }
            },
            equipment: {
              type: 'object',
              properties: {
                pullUpBar: { type: 'boolean', default: false },
                parallelBars: { type: 'boolean', default: false },
                wallBars: { type: 'boolean', default: false },
                rings: { type: 'boolean', default: false },
                other: { type: 'string' }
              }
            },
            images: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 5,
              description: 'URLs de imágenes (máximo 5)'
            },
            parking: { type: 'boolean', default: false },
            accessibility: { type: 'boolean', default: false },
            lighting: { type: 'boolean', default: false }
          }
        },
        Comment: {
          type: 'object',
          properties: {
            id: { 
              type: 'string',
              description: 'ID único del comentario'
            },
            text: { 
              type: 'string',
              description: 'Contenido del comentario'
            },
            author: { 
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' }
              }
            },
            barId: { 
              type: 'string', 
              description: 'ID de la barra comentada' 
            },
            parentComment: {
              type: 'string',
              description: 'ID del comentario padre (si es respuesta)'
            },
            likes: {
              type: 'array',
              items: { type: 'string' },
              description: 'IDs de usuarios que dieron like'
            },
            likesCount: {
              type: 'integer',
              description: 'Cantidad de likes'
            },
            isEdited: {
              type: 'boolean',
              description: 'Si el comentario fue editado'
            },
            active: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Rating: {
          type: 'object',
          properties: {
            id: { 
              type: 'string',
              description: 'ID único del rating'
            },
            value: { 
              type: 'number',
              minimum: 1,
              maximum: 5,
              description: 'Puntuación de 1 a 5 estrellas'
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' }
              }
            },
            bar: { 
              type: 'string',
              description: 'ID de la barra calificada' 
            },
            review: {
              type: 'string',
              description: 'Reseña opcional'
            },
            criteria: {
              type: 'object',
              properties: {
                equipment: { 
                  type: 'number',
                  minimum: 1,
                  maximum: 5,
                  description: 'Calidad del equipamiento'
                },
                location: { 
                  type: 'number',
                  minimum: 1,
                  maximum: 5,
                  description: 'Ubicación y accesibilidad'
                },
                maintenance: { 
                  type: 'number',
                  minimum: 1,
                  maximum: 5,
                  description: 'Estado de mantenimiento'
                },
                safety: { 
                  type: 'number',
                  minimum: 1,
                  maximum: 5,
                  description: 'Seguridad del área'
                }
              }
            },
            criteriaAverage: {
              type: 'number',
              description: 'Promedio de criterios'
            },
            hasReview: {
              type: 'boolean',
              description: 'Si tiene reseña'
            },
            active: { type: 'boolean' },
            date: { type: 'string', format: 'date-time' }
          }
        },
      },
      responses: {
        Unauthorized: {
          description: 'Token no válido o ausente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Access denied. No token provided',
              },
            },
          },
        },
        Forbidden: {
          description: 'Acceso denegado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Admin privileges required',
              },
            },
          },
        },
        ValidationError: {
          description: 'Error de validación',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Validation failed',
                details: [
                  {
                    field: 'email',
                    message: 'Please provide a valid email address',
                  },
                ],
              },
            },
          },
        },
        InternalServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: 'Internal server error',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints de autenticación de usuarios',
      },
      {
        name: 'Users',
        description: 'Gestión de perfiles de usuario',
      },
      {
        name: 'Admin',
        description: 'Funciones administrativas',
      },
      {
        name: 'Calisthenics Bars',
        description: 'Gestión de ubicaciones de barras de calistenia',
      },
      {
        name: 'Comments',
        description: 'Sistema de comentarios en las barras',
      },
      {
        name: 'Ratings',
        description: 'Sistema de puntuaciones y valoraciones',
      },
      {
        name: 'Search',
        description: 'Búsqueda y filtrado de barras por ubicación',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Rutas donde buscar documentación JSDoc
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };