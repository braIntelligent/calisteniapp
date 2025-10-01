// src/routes/comment.routes.ts
import { commentController } from "@/controllers/comment.controller";
import {
  createCommentSchemaZod,
  updateCommentSchemaZod,
} from "@/validations/schemas/comment.schemazod";
import { validateZod } from "@/validations/user.validation";
import { authenticateToken } from "@/middlewares/auth.middleware";
import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Crear nuevo comentario
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text, barId]
 *             properties:
 *               text:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Contenido del comentario
 *               barId:
 *                 type: string
 *                 description: ID de la barra a comentar
 *               parentCommentId:
 *                 type: string
 *                 description: ID del comentario padre (para respuestas)
 *           example:
 *             text: "Excelente lugar para entrenar, las barras están en muy buen estado!"
 *             barId: "60d5ec49f1b2c8b1f8c4e5a1"
 *     responses:
 *       201:
 *         description: Comentario creado exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Barra o comentario padre no encontrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  "/",
  authenticateToken,
  validateZod(createCommentSchemaZod),
  commentController.createComment
);

/**
 * @swagger
 * /comments/bar/{barId}:
 *   get:
 *     summary: Obtener comentarios de una barra específica
 *     tags: [Comments]
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
 *         description: Lista de comentarios de la barra
 *       400:
 *         description: ID de barra inválido
 *       404:
 *         description: Barra no encontrada
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/bar/:barId",
  commentController.getBarComments
);

/**
 * @swagger
 * /comments/{commentId}/replies:
 *   get:
 *     summary: Obtener respuestas de un comentario específico
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del comentario padre
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
 *         description: Lista de respuestas del comentario
 *       400:
 *         description: ID de comentario inválido
 *       404:
 *         description: Comentario padre no encontrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/:commentId/replies",
  commentController.getCommentReplies
);

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     summary: Actualizar comentario (solo autor o admin)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del comentario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *           example:
 *             text: "Comentario actualizado con nueva información"
 *     responses:
 *       200:
 *         description: Comentario actualizado exitosamente
 *       400:
 *         description: Error de validación o comentario muy antiguo
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Solo el autor o admin pueden actualizar
 *       404:
 *         description: Comentario no encontrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  "/:id",
  authenticateToken,
  validateZod(updateCommentSchemaZod),
  commentController.updateComment
);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Eliminar comentario (solo autor o admin)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del comentario
 *     responses:
 *       200:
 *         description: Comentario eliminado exitosamente
 *       400:
 *         description: ID inválido o comentario ya eliminado
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Solo el autor o admin pueden eliminar
 *       404:
 *         description: Comentario no encontrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
  "/:id",
  authenticateToken,
  commentController.deleteComment
);

/**
 * @swagger
 * /comments/{id}/like:
 *   post:
 *     summary: Dar o quitar like a un comentario (toggle)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del comentario
 *     responses:
 *       200:
 *         description: Like agregado o removido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Like added"
 *                 likesCount:
 *                   type: integer
 *                   example: 5
 *                 hasLiked:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: ID de comentario inválido
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Comentario no encontrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  "/:id/like",
  authenticateToken,
  commentController.likeComment
);

/**
 * @swagger
 * /comments/user/{userId}:
 *   get:
 *     summary: Obtener todos los comentarios de un usuario específico
 *     tags: [Comments]
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
 *         description: Lista de comentarios del usuario
 *       400:
 *         description: ID de usuario inválido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/user/:userId",
  commentController.getUserComments
);

export default router;