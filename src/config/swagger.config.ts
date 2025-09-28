// src/config/swagger.config.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Workout Management API',
      version: '1.0.0',
      description: 'API para gestión de workout, usuarios, comentarios y puntuaciones',
      contact: {
        name: 'API Support',
        email: 'support@workoutmanagement.com',
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
        url: 'https://api.workoutmanagement.com/v1',
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
        // Esquemas para Bar (para futuro uso)
        Bar: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            creator: { type: 'string' },
            location: { type: 'string' },
            parking: { type: 'boolean' },
            active: { type: 'boolean' },
            date: { type: 'string', format: 'date-time' },
          },
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
        description: 'Endpoints de autenticación',
      },
      {
        name: 'Users',
        description: 'Gestión de usuarios',
      },
      {
        name: 'Admin',
        description: 'Funciones administrativas',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Rutas donde buscar documentación JSDoc
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };