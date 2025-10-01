// src/controllers/rating.controller.ts
import { Request, Response } from "express";
import { Punctuation } from "@/models/punctuation.schema";
import { Bar } from "@/models/bar.schema";
import { User } from "@/models/user.schema";
import { Types } from "mongoose";

export const ratingController = {
  // Crear o actualizar rating
  createOrUpdateRating: async (req: Request, res: Response) => {
    try {
      const { value, barId, review, criteria } = req.body;
      const userId = req.user?.id;

      if (!userId) {
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

      // Verificar si el usuario ya calificó esta barra
      const existingRating = await Punctuation.findOne({
        user: userId,
        bar: barId,
        active: true
      });

      let rating;
      let message;

      if (existingRating) {
        // Actualizar rating existente
        rating = await Punctuation.findByIdAndUpdate(
          existingRating._id,
          {
            value,
            review: review?.trim() || undefined,
            criteria: criteria || existingRating.criteria,
            date: new Date()
          },
          { new: true }
        )
        .populate("user", "username")
        .lean();

        message = "Rating updated successfully";
      } else {
        // Crear nuevo rating
        const newRating = await Punctuation.create({
          value,
          user: userId,
          bar: barId,
          review: review?.trim(),
          criteria: criteria || {
            equipment: value,
            location: value,
            maintenance: value,
            safety: value
          }
        });

        // Agregar rating a la lista de la barra
        await Bar.findByIdAndUpdate(
          barId,
          { $addToSet: { punctuation: newRating._id } }
        );

        rating = await Punctuation.findById(newRating._id)
          .populate("user", "username")
          .lean();

        message = "Rating created successfully";
      }

      // Recalcular rating promedio de la barra
      await recalculateBarRating(barId);

      res.status(existingRating ? 200 : 201).json({
        message,
        rating
      });

    } catch (error) {
      console.error("Error creating/updating rating:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Obtener ratings de una barra
  getBarRatings: async (req: Request, res: Response) => {
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

      // Obtener ratings con paginación
      const ratings = await Punctuation.find({
        bar: barId,
        active: true
      })
      .populate("user", "username registerDate")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

      // Estadísticas de ratings
      const allRatings = await Punctuation.find({
        bar: barId,
        active: true
      }).lean();

      const stats = calculateRatingStats(allRatings);
      const total = allRatings.length;

      res.status(200).json({
        ratings,
        stats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      console.error("Error getting bar ratings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Obtener rating específico de un usuario para una barra
  getUserBarRating: async (req: Request, res: Response) => {
    try {
      const { barId, userId } = req.params;
      const requesterId = req.user?.id;

      if (!Types.ObjectId.isValid(barId) || !Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid bar or user ID" });
      }

      // Solo el propio usuario o admin puede ver ratings específicos
      if (requesterId !== userId && req.user?.role !== "admin") {
        return res.status(403).json({ 
          error: "You can only view your own ratings" 
        });
      }

      const rating = await Punctuation.findOne({
        user: userId,
        bar: barId,
        active: true
      })
      .populate("user", "username")
      .populate("bar", "name")
      .lean();

      if (!rating) {
        return res.status(404).json({ 
          message: "No rating found for this user and bar",
          hasRated: false
        });
      }

      res.status(200).json({
        rating,
        hasRated: true
      });

    } catch (error) {
      console.error("Error getting user bar rating:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Eliminar rating
  deleteRating: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid rating ID" });
      }

      const rating = await Punctuation.findById(id);
      if (!rating) {
        return res.status(404).json({ error: "Rating not found" });
      }

      if (!rating.active) {
        return res.status(400).json({ error: "Rating is already deleted" });
      }

      // Verificar permisos (solo autor o admin)
      if (rating.user.toString() !== userId && userRole !== "admin") {
        return res.status(403).json({ 
          error: "You can only delete your own ratings" 
        });
      }

      // Desactivar el rating
      await Punctuation.findByIdAndUpdate(id, { 
        active: false,
        date: new Date()
      });

      // Recalcular rating promedio de la barra
      await recalculateBarRating(rating.bar.toString());

      res.status(200).json({
        message: "Rating deleted successfully"
      });

    } catch (error) {
      console.error("Error deleting rating:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Obtener ratings de un usuario
  getUserRatings: async (req: Request, res: Response) => {
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

      const ratings = await Punctuation.find({
        user: userId,
        active: true
      })
      .populate("user", "username")
      .populate("bar", "name location.address averageRating")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

      const total = await Punctuation.countDocuments({
        user: userId,
        active: true
      });

      // Estadísticas del usuario
      const userStats = await calculateUserRatingStats(userId);

      res.status(200).json({
        user,
        ratings,
        userStats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total
        }
      });

    } catch (error) {
      console.error("Error getting user ratings:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Obtener estadísticas generales de ratings
  getRatingStatistics: async (req: Request, res: Response) => {
    try {
      const { barId } = req.params;

      if (!Types.ObjectId.isValid(barId)) {
        return res.status(400).json({ error: "Invalid bar ID" });
      }

      // Verificar que la barra existe
      const bar = await Bar.findById(barId);
      if (!bar || !bar.active) {
        return res.status(404).json({ error: "Bar not found" });
      }

      const ratings = await Punctuation.find({
        bar: barId,
        active: true
      }).lean();

      const stats = calculateRatingStats(ratings);
      const criteriaStats = calculateCriteriaStats(ratings);

      res.status(200).json({
        total: ratings.length,
        average: stats.average,
        distribution: stats.distribution,
        criteria: criteriaStats,
        recentRatings: stats.recentCount
      });

    } catch (error) {
      console.error("Error getting rating statistics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

// Función auxiliar para recalcular rating promedio de una barra
async function recalculateBarRating(barId: string) {
  const ratings = await Punctuation.find({
    bar: barId,
    active: true
  }).lean();

  const totalRatings = ratings.length;
  const averageRating = totalRatings > 0 
    ? Math.round((ratings.reduce((sum, rating) => sum + rating.value, 0) / totalRatings) * 10) / 10
    : 0;

  await Bar.findByIdAndUpdate(barId, {
    averageRating,
    totalRatings
  });
}

// Función auxiliar para calcular estadísticas de ratings
function calculateRatingStats(ratings: any[]) {
  const total = ratings.length;
  const average = total > 0 
    ? Math.round((ratings.reduce((sum, r) => sum + r.value, 0) / total) * 10) / 10
    : 0;

  const distribution = {
    5: ratings.filter(r => r.value === 5).length,
    4: ratings.filter(r => r.value === 4).length,
    3: ratings.filter(r => r.value === 3).length,
    2: ratings.filter(r => r.value === 2).length,
    1: ratings.filter(r => r.value === 1).length,
  };

  // Ratings de los últimos 30 días
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentCount = ratings.filter(r => new Date(r.date) > thirtyDaysAgo).length;

  return { total, average, distribution, recentCount };
}

// Función auxiliar para calcular estadísticas de criterios
function calculateCriteriaStats(ratings: any[]) {
  const ratingsWithCriteria = ratings.filter(r => r.criteria);
  
  if (ratingsWithCriteria.length === 0) {
    return {
      equipment: 0,
      location: 0,
      maintenance: 0,
      safety: 0
    };
  }

  return {
    equipment: Math.round(
      (ratingsWithCriteria.reduce((sum, r) => sum + (r.criteria.equipment || 0), 0) / ratingsWithCriteria.length) * 10
    ) / 10,
    location: Math.round(
      (ratingsWithCriteria.reduce((sum, r) => sum + (r.criteria.location || 0), 0) / ratingsWithCriteria.length) * 10
    ) / 10,
    maintenance: Math.round(
      (ratingsWithCriteria.reduce((sum, r) => sum + (r.criteria.maintenance || 0), 0) / ratingsWithCriteria.length) * 10
    ) / 10,
    safety: Math.round(
      (ratingsWithCriteria.reduce((sum, r) => sum + (r.criteria.safety || 0), 0) / ratingsWithCriteria.length) * 10
    ) / 10
  };
}

// Función auxiliar para calcular estadísticas de usuario
async function calculateUserRatingStats(userId: string) {
  const userRatings = await Punctuation.find({
    user: userId,
    active: true
  }).lean();

  const totalRatings = userRatings.length;
  const averageRating = totalRatings > 0 
    ? Math.round((userRatings.reduce((sum, r) => sum + r.value, 0) / totalRatings) * 10) / 10
    : 0;

  const distribution = {
    5: userRatings.filter(r => r.value === 5).length,
    4: userRatings.filter(r => r.value === 4).length,
    3: userRatings.filter(r => r.value === 3).length,
    2: userRatings.filter(r => r.value === 2).length,
    1: userRatings.filter(r => r.value === 1).length,
  };

  return { totalRatings, averageRating, distribution };
}