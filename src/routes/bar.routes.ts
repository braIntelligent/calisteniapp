// src/routes/bar.routes.ts
import { barController } from "@/controllers/bar.controller";
import {
  createBarSchemaZod,
  updateBarSchemaZod,
  searchLocationSchemaZod,
  barFiltersSchemaZod
} from "@/validations/schemas/bar.schemazod";
import { validateZod } from "@/validations/user.validation";
import { authenticateToken, requireOwnershipOrAdmin } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /bars:
 *   post:
 *     summary: Crear nueva barra de calistenia
 *     tags: [Calisthenics Bars]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBarRequest'
 *           example:
 *             name: "Parque O'Higgins - Área Calistenia"
 *             description: "Excelente set de barras con equipamiento completo para entrenar. Ubicado en zona tranquila del parque."
 *             location:
 *               coordinates:
 *                 latitude: -33.4489
 *                 longitude: -70.6693
 *               address: "Parque O'Higgins, Santiago Centro"
 *             equipment:
 *               pullUpBar: true
 *               parallelBars: true
 *               wallBars: false
 *               rings: false
 *               other: "Barras de diferentes alturas"
 *             features:
 *               parking: true
 *               lighting: true
 *               accessibility: false
 *               covered: false
 *             images: [
 *               "https://example.com/image1.jpg",
 *               "https://example.com/image2.jpg"
 *             ]
 *     responses:
 *       201:
 *         description: Barra creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Calisthenics bar created successfully"
 *                 bar:
 *                   $ref: '#/components/schemas/CalisthenicsBar'
 *       400:
 *         description: Error de validación o barra muy cercana
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/Error'
 *                 - type: object
 *                   properties:
 *                     error:
 *                       type: string
 *                       example: "There's already a bar registered very close to this location"
 *                     nearbyBars:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           distance:
 *                             type: number
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  "/",
  authenticateToken,
  validateZod(createBarSchemaZod),
  barController.createBar
);

/**
 * @swagger
 * /bars:
 *   get:
 *     summary: Obtener lista de barras con filtros y paginación
 *     tags: [Calisthenics Bars]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Elementos por página
 *       - in: query
 *         name: equipment
 *         schema:
 *           type: string
 *           example: "pullUpBar,parallelBars"
 *         description: Filtrar por equipamiento (separado por comas)
 *       - in: query
 *         name: features
 *         schema:
 *           type: string
 *           example: "parking,lighting"
 *         description: Filtrar por características (separado por comas)
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         description: Rating mínimo
 *     responses:
 *       200:
 *         description: Lista de barras
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bars:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CalisthenicsBar'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/",
  barController.getBars
);

/**
 * @swagger
 * /bars/search:
 *   get:
 *     summary: Buscar barras por ubicación GPS
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: Latitud GPS
 *         example: -33.4489
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: Longitud GPS
 *         example: -70.6693
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           minimum: 0.1
 *           maximum: 50
 *           default: 5
 *         description: Radio de búsqueda en kilómetros
 *     responses:
 *       200:
 *         description: Barras encontradas en el área
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 searchCenter:
 *                   type: object
 *                   properties:
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                 radius:
 *                   type: number
 *                 found:
 *                   type: integer
 *                 bars:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/CalisthenicsBar'
 *                       - type: object
 *                         properties:
 *                           distance:
 *                             type: number
 *                             description: Distancia en kilómetros
 *       400:
 *         description: Coordenadas inválidas
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/search",
  barController.searchBarsByLocation
);

/**
 * @swagger
 * /bars/{id}:
 *   get:
 *     summary: Obtener barra específica por ID
 *     tags: [Calisthenics Bars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la barra
 *     responses:
 *       200:
 *         description: Información detallada de la barra
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bar:
 *                   $ref: '#/components/schemas/CalisthenicsBar'
 *                 ratings:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     average:
 *                       type: number
 *                     distribution:
 *                       type: object
 *                       properties:
 *                         5:
 *                           type: integer
 *                         4:
 *                           type: integer
 *                         3:
 *                           type: integer
 *                         2:
 *                           type: integer
 *                         1:
 *                           type: integer
 *       400:
 *         description: ID de barra inválido
 *       404:
 *         description: Barra no encontrada
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/:id",
  barController.getBar
);

/**
 * @swagger
 * /bars/{id}:
 *   put:
 *     summary: Actualizar barra (solo creador o admin)
 *     tags: [Calisthenics Bars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la barra
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *               equipment:
 *                 type: object
 *                 properties:
 *                   pullUpBar:
 *                     type: boolean
 *                   parallelBars:
 *                     type: boolean
 *                   wallBars:
 *                     type: boolean
 *                   rings:
 *                     type: boolean
 *                   other:
 *                     type: string
 *               features:
 *                 type: object
 *                 properties:
 *                   parking:
 *                     type: boolean
 *                   lighting:
 *                     type: boolean
 *                   accessibility:
 *                     type: boolean
 *                   covered:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Barra actualizada exitosamente
 *       400:
 *         description: ID inválido o datos de validación
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Solo el creador o admin pueden actualizar
 *       404:
 *         description: Barra no encontrada
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  "/:id",
  authenticateToken,
  validateZod(updateBarSchemaZod),
  barController.updateBar
);

/**
 * @swagger
 * /bars/{id}/deactivate:
 *   delete:
 *     summary: Desactivar barra (solo creador o admin)
 *     tags: [Calisthenics Bars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la barra
 *     responses:
 *       200:
 *         description: Barra desactivada exitosamente
 *       400:
 *         description: ID inválido o barra ya inactiva
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Solo el creador o admin pueden desactivar
 *       404:
 *         description: Barra no encontrada
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
  "/:id/deactivate",
  authenticateToken,
  barController.deactivateBar
);

/**
 * @swagger
 * /bars/user/{userId}:
 *   get:
 *     summary: Obtener barras creadas por un usuario específico
 *     tags: [Calisthenics Bars]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de barras del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                 bars:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CalisthenicsBar'
 *                 pagination:
 *                   type: object
 *       400:
 *         description: ID de usuario inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/user/:userId",
  barController.getUserBars
);

export default router;