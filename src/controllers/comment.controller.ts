// src/controllers/comment.controller.ts
import { Request, Response } from "express";
import { Comment } from "@/models/comment.schema";
import { Bar } from "@/models/bar.schema";
import { User } from "@/models/user.schema";
import { Types } from "mongoose";

export const commentController = {
  // Crear nuevo comentario
  createComment: async (req: Request, res: Response) => {
    try {
      const { text, barId, parentCommentId } = req.body;
      const authorId = req.user?.id;

      if (!authorId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verificar que la barra existe y está activa
      if (!Types.ObjectId.isValid(barId)) {
        return res.status(400).json({ error: "Invalid bar ID" });
      }

      const bar = await Bar.findById(barId);
      if (!bar || !bar.active) {
        return res.status(404).json({ error: "Bar not found or inactive" });
      }

      // Si es una respuesta, verificar que el comentario padre existe
      if (parentCommentId) {
        if (!Types.ObjectId.isValid(parentCommentId)) {
          return res.status(400).json({ error: "Invalid parent comment ID" });
        }

        const parentComment = await Comment.findById(parentCommentId);
        if (!parentComment || !parentComment.active) {
          return res.status(404).json({ error: "Parent comment not found" });
        }

        // Verificar que el comentario padre pertenece a la misma barra
        if (parentComment.barId.toString() !== barId) {
          return res.status(400).json({
            error: "Parent comment does not belong to this bar",
          });
        }
      }

      // Crear el comentario
      const newComment = await Comment.create({
        text: text.trim(),
        author: authorId,
        barId: barId,
        parentComment: parentCommentId || null,
      });

      // Agregar el comentario a la lista de comentarios de la barra
      await Bar.findByIdAndUpdate(barId, {
        $addToSet: { comments: newComment._id },
      });

      // Poblar información del autor
      const populatedComment = await Comment.findById(newComment._id)
        .populate("author", "username registerDate")
        .lean();

      res.status(201).json({
        message: "Comment created successfully",
        comment: populatedComment,
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Obtener comentarios de una barra
  getBarComments: async (req: Request, res: Response) => {
    try {
      const { barId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      if (!Types.ObjectId.isValid(barId)) {
        return res.status(400).json({ error: "Invalid bar ID" });
      }

      // Verificar que la barra existe
      const bar = await Bar.findById(barId);
      if (!bar || !bar.active) {
        return res.status(404).json({ error: "Bar not found" });
      }

      // Obtener comentarios principales (sin padre)
      const comments = await Comment.find({
        barId: barId,
        parentComment: null,
        active: true,
      })
        .populate("author", "username registerDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Para cada comentario principal, obtener sus respuestas
      const commentsWithReplies = await Promise.all(
        comments.map(async (comment) => {
          const replies = await Comment.find({
            parentComment: comment._id,
            active: true,
          })
            .populate("author", "username registerDate")
            .sort({ createdAt: 1 })
            .limit(5) // Limitar respuestas mostradas inicialmente
            .lean();

          const totalReplies = await Comment.countDocuments({
            parentComment: comment._id,
            active: true,
          });

          return {
            ...comment,
            replies,
            totalReplies,
            hasMoreReplies: totalReplies > 5,
          };
        })
      );

      const total = await Comment.countDocuments({
        barId: barId,
        parentComment: null,
        active: true,
      });

      res.status(200).json({
        comments: commentsWithReplies,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      console.error("Error getting bar comments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Obtener respuestas de un comentario específico
  getCommentReplies: async (req: Request, res: Response) => {
    try {
      const { commentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      if (!Types.ObjectId.isValid(commentId)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }

      // Verificar que el comentario padre existe
      const parentComment = await Comment.findById(commentId);
      if (!parentComment || !parentComment.active) {
        return res.status(404).json({ error: "Parent comment not found" });
      }

      const replies = await Comment.find({
        parentComment: commentId,
        active: true,
      })
        .populate("author", "username registerDate")
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Comment.countDocuments({
        parentComment: commentId,
        active: true,
      });

      res.status(200).json({
        parentComment: {
          id: parentComment._id,
          text: parentComment.text,
        },
        replies,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        },
      });
    } catch (error) {
      console.error("Error getting comment replies:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Actualizar comentario (solo autor o admin)
  updateComment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { text } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }

      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      if (!comment.active) {
        return res.status(400).json({ error: "Comment is not active" });
      }

      // Verificar permisos (solo autor o admin)
      if (comment.author.toString() !== userId && userRole !== "admin") {
        return res.status(403).json({
          error: "You can only update your own comments",
        });
      }

      // No permitir editar comentarios muy antiguos (24 horas)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (comment.createdAt < dayAgo && userRole !== "admin") {
        return res.status(403).json({
          error: "Comments can only be edited within 24 hours",
        });
      }

      const updatedComment = await Comment.findByIdAndUpdate(
        id,
        {
          text: text.trim(),
          updatedAt: new Date(),
          isEdited: true,
        },
        { new: true }
      )
        .populate("author", "username registerDate")
        .lean();

      res.status(200).json({
        message: "Comment updated successfully",
        comment: updatedComment,
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Eliminar comentario (desactivar)
  deleteComment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }

      const comment = await Comment.findById(id);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      if (!comment.active) {
        return res.status(400).json({ error: "Comment is already deleted" });
      }

      // Verificar permisos
      if (comment.author.toString() !== userId && userRole !== "admin") {
        return res.status(403).json({
          error: "You can only delete your own comments",
        });
      }

      // Desactivar el comentario y sus respuestas
      await Comment.findByIdAndUpdate(id, {
        active: false,
        updatedAt: new Date(),
      });

      // También desactivar todas las respuestas
      await Comment.updateMany(
        { parentComment: id },
        {
          active: false,
          updatedAt: new Date(),
        }
      );

      res.status(200).json({
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Dar like a un comentario
  likeComment: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid comment ID" });
      }

      const comment = await Comment.findById(id);
      if (!comment || !comment.active) {
        return res.status(404).json({ error: "Comment not found" });
      }

      // Verificar si ya dio like
      const userObjectId = new Types.ObjectId(userId);
      const hasLiked = comment.likes.some(
        (likeId) => likeId.toString() === userId
      );

      let updatedComment;
      let message;

      if (hasLiked) {
        // Remover like
        updatedComment = await Comment.findByIdAndUpdate(
          id,
          { $pull: { likes: userObjectId } },
          { new: true }
        );
        message = "Like removed";
      } else {
        // Agregar like
        updatedComment = await Comment.findByIdAndUpdate(
          id,
          { $addToSet: { likes: userObjectId } },
          { new: true }
        );
        message = "Like added";
      }

      res.status(200).json({
        message,
        likesCount: updatedComment?.likes.length || 0,
        hasLiked: !hasLiked,
      });
    } catch (error) {
      console.error("Error liking comment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Obtener comentarios de un usuario
  getUserComments: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      if (!Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Verificar que el usuario existe
      const user = await User.findById(userId).select("username").lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const comments = await Comment.find({
        author: userId,
        active: true,
      })
        .populate("author", "username")
        .populate("barId", "name location.address")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Comment.countDocuments({
        author: userId,
        active: true,
      });

      res.status(200).json({
        user,
        comments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
        },
      });
    } catch (error) {
      console.error("Error getting user comments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
