// src/routes/rating.routes.ts
import { ratingController } from "@/controllers/rating.controller";
import {
  createRatingSchemaZod,
  updateRatingSchemaZod,
} from "@/validations/schemas/rating.schemazod";
import { validateZod } from "@/validations/user.validation";
import { authenticateToken } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /ratings:
 *   post:
 *     summary: Crear o actualizar rating de una barra
 *     description: Si el usuario ya calificó la barra, actualiza el rating existente
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [value, barId]
 *             properties:
 *               value:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Calificación general (1-5 estrellas)
 *               barId:
 *                 type: string
 *                 description: ID de la barra a calificar
 *               review:
 *                 type: string
 *                 maxLength: 500
 *                 description: Reseña opcional
 *               criteria:
 *                 type: object
 *                 description: Calificaciones por criterio específico
 *                 properties:
 *                   equipment:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                     description: Calidad del equipamiento
 *                   location:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                     description: Ubicación y accesibilidad
 *                   maintenance:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                     description: Estado de mantenimiento
 *                   safety:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                     description: Seguridad del área
 *           example:
 *             value: 5
 *             barId: "60d5ec49f1b2c8b1f8c4e5a1"
 *             review: "Excelente lugar para entrenar, muy bien mantenido"
 *             criteria:
 *               equipment: 5
 *               location: 4
 *               maintenance: 5
 *               safety: 5
 *     responses:
 *       201:
 *         description: Rating creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Rating created successfully"
 *                 rating:
 *                   $ref: '#/components/schemas/Rating'
 *       200:
 *         description: Rating actualizado exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Barra no encontrada
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  "/",
  authenticateToken,
  validateZod(createRatingSchemaZod),
  ratingController.createOrUpdateRating
);

/**
 * @swagger
 * /ratings/bar/{barId}:
 *   get:
 *     summary: Obtener ratings de una barra específica
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: barId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la barra
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de ratings con estadísticas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ratings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Rating'
 *                 stats:
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
 *                     recentCount:
 *                       type: integer
 *                       description: Ratings en los últimos 30 días
 *                 pagination:
 *                   type: object
 *       400:
 *         description: ID de barra inválido
 *       404:
 *         description: Barra no encontrada
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/bar/:barId",
  ratingController.getBarRatings
);

/**
 * @swagger
 * /ratings/bar/{barId}/user/{userId}:
 *   get:
 *     summary: Obtener rating de un usuario específico para una barra
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: barId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la barra
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Rating del usuario para la barra
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 rating:
 *                   $ref: '#/components/schemas/Rating'
 *                 hasRated:
 *                   type: boolean
 *       400:
 *         description: IDs inválidos
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Solo puedes ver tus propios ratings
 *       404:
 *         description: Rating no encontrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/bar/:barId/user/:userId",
  authenticateToken,
  ratingController.getUserBarRating
);

/**
 * @swagger
 * /ratings/{id}:
 *   delete:
 *     summary: Eliminar rating (solo autor o admin)
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del rating
 *     responses:
 *       200:
 *         description: Rating eliminado exitosamente
 *       400:
 *         description: ID inválido o rating ya eliminado
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Solo el autor o admin pueden eliminar
 *       404:
 *         description: Rating no encontrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
  "/:id",
  authenticateToken,
  ratingController.deleteRating
);

/**
 * @swagger
 * /ratings/user/{userId}:
 *   get:
 *     summary: Obtener todos los ratings de un usuario
 *     tags: [Ratings]
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
 *         description: Lista de ratings del usuario con estadísticas
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
 *                 ratings:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Rating'
 *                       - type: object
 *                         properties:
 *                           bar:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               location:
 *                                 type: object
 *                               averageRating:
 *                                 type: number
 *                 userStats:
 *                   type: object
 *                   properties:
 *                     totalRatings:
 *                       type: integer
 *                     averageRating:
 *                       type: number
 *                     distribution:
 *                       type: object
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
  ratingController.getUserRatings
);

/**
 * @swagger
 * /ratings/bar/{barId}/statistics:
 *   get:
 *     summary: Obtener estadísticas detalladas de ratings de una barra
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: barId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la barra
 *     responses:
 *       200:
 *         description: Estadísticas detalladas de ratings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total de ratings
 *                 average:
 *                   type: number
 *                   description: Promedio general
 *                 distribution:
 *                   type: object
 *                   description: Distribución por estrellas
 *                 criteria:
 *                   type: object
 *                   description: Promedios por criterio
 *                   properties:
 *                     equipment:
 *                       type: number
 *                     location:
 *                       type: number
 *                     maintenance:
 *                       type: number
 *                     safety:
 *                       type: number
 *                 recentRatings:
 *                   type: integer
 *                   description: Ratings en últimos 30 días
 *       400:
 *         description: ID de barra inválido
 *       404:
 *         description: Barra no encontrada
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/bar/:barId/statistics",
  ratingController.getRatingStatistics
);

export default router;