// src/routes/user.routes.ts - CON DOCUMENTACIÓN SWAGGER
import { userController } from "@/controllers/user.controller";
import {
  createUserSchemaZod,
  updateUserSchemaZod,
  loginSchemaZod,
  createAdminSchemaZod,
} from "@/validations/schemas/user.schemazod";
import { validateZod } from "@/validations/user.validation";
import { 
  authenticateToken, 
  requireAdmin, 
  requireOwnershipOrAdmin 
} from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *           example:
 *             username: "johndoe"
 *             email: "john@example.com"
 *             password: "Password123!"
 *             confirmPassword: "Password123!"
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User created successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email o username ya registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Email already registered"
 *               field: "email"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  "/register",
  validateZod(createUserSchemaZod),
  userController.createUser
);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             emailOrUsername: "john@example.com"
 *             password: "Password123!"
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciales inválidas o cuenta desactivada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_credentials:
 *                 value:
 *                   error: "Invalid credentials"
 *               account_deactivated:
 *                 value:
 *                   error: "Account is deactivated. Please contact support"
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  "/login", 
  validateZod(loginSchemaZod), 
  userController.loginUser
);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/profile", 
  authenticateToken, 
  userController.getProfile
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualizar usuario (propio perfil o admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *           example:
 *             newUsername: "newusername"
 *             newEmail: "newemail@example.com"
 *             currentPassword: "Password123!"
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Contraseña incorrecta o sin cambios
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Usuario no encontrado
 *       409:
 *         description: Email o username ya en uso
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  "/:id", 
  authenticateToken,
  requireOwnershipOrAdmin,
  validateZod(updateUserSchemaZod), 
  userController.updateUser
);

/**
 * @swagger
 * /users/:
 *   get:
 *     summary: Listar todos los usuarios (solo admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/", 
  authenticateToken, 
  requireAdmin, 
  userController.getUsers
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Obtener usuario específico (solo admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Información del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/:id", 
  authenticateToken, 
  requireAdmin, 
  userController.getUser
);

/**
 * @swagger
 * /users/{id}/activate:
 *   patch:
 *     summary: Activar usuario (solo admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario activado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User activated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch(
  "/:id/activate", 
  authenticateToken, 
  requireAdmin, 
  userController.activateUser
);

/**
 * @swagger
 * /users/{id}/deactivate:
 *   delete:
 *     summary: Desactivar usuario (solo admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario desactivado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deactivated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
  "/:id/deactivate", 
  authenticateToken, 
  requireAdmin, 
  userController.deactivateUser
);

/**
 * @swagger
 * /users/admin/create:
 *   post:
 *     summary: Crear nuevo administrador (solo admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *           example:
 *             username: "adminuser"
 *             email: "admin@example.com"
 *             password: "AdminPass123!"
 *     responses:
 *       201:
 *         description: Admin creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Admin created successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Username o email ya registrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  "/admin/create",
  authenticateToken,
  requireAdmin,
  validateZod(createAdminSchemaZod),
  userController.createAdmin
);

export default router;