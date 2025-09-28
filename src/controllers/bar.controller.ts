// src/controllers/bar.controller.ts
import { Request, Response } from "express";
import { Bar } from "@/models/bar.schema";
import { User } from "@/models/user.schema";
import { Comment } from "@/models/comment.schema";
import { Punctuation } from "@/models/punctuation.schema";
import { calculateDistance, isValidCoordinates } from "@/utils/geo.helpers";
import { Types } from "mongoose";

export const barController = {
  // Crear nueva barra de calistenia
  createBar: async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        location,
        equipment,
        features,
        images
      } = req.body;

      const creatorId = req.user?.id;
      if (!creatorId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Validar coordenadas GPS
      const { latitude, longitude } = location.coordinates;
      if (!isValidCoordinates(latitude, longitude)) {
        return res.status(400).json({ 
          error: "Invalid GPS coordinates",
          field: "location.coordinates" 
        });
      }

      // Verificar si ya existe una barra muy cerca (radio de 50 metros)
      const nearbyBars = await Bar.find({
        "location.coordinates.latitude": {
          $gte: latitude - 0.00045, // ~50 metros
          $lte: latitude + 0.00045
        },
        "location.coordinates.longitude": {
          $gte: longitude - 0.00045,
          $lte: longitude + 0.00045
        },
        active: true
      });

      if (nearbyBars.length > 0) {
        return res.status(400).json({
          error: "There's already a bar registered very close to this location",
          nearbyBars: nearbyBars.map(bar => ({
            id: bar._id,
            name: bar.name,
            distance: calculateDistance(
              latitude, longitude,
              bar.location.coordinates.latitude,
              bar.location.coordinates.longitude
            )
          }))
        });
      }

      // Crear nueva barra
      const newBar = await Bar.create({
        name,
        description,
        creator: creatorId,
        location: {
          coordinates: { latitude, longitude },
          address: location.address
        },
        equipment: equipment || {},
        features: features || {},
        images: images || [],
        averageRating: 0,
        totalRatings: 0
      });

      // Poblar información del creador
      const populatedBar = await Bar.findById(newBar._id)
        .populate("creator", "username")
        .lean();

      res.status(201).json({
        message: "Calisthenics bar created successfully",
        bar: populatedBar
      });

    } catch (error) {
      console.error("Error creating bar:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Obtener todas las barras (con paginación)
  getBars: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Filtros opcionales
      const filters: any = { active: true };
      
      // Filtrar por equipamiento
      if (req.query.equipment) {
        const equipmentTypes = (req.query.equipment as string).split(',');
        equipmentTypes.forEach(type => {
          if (['pullUpBar', 'parallelBars', 'wallBars', 'rings'].includes(type)) {
            filters[`equipment.${type}`] = true;
          }
        });
      }

      // Filtrar por características
      if (req.query.features) {
        const featureTypes = (req.query.features as string).split(',');
        featureTypes.forEach(feature => {
          if (['parking', 'lighting', 'accessibility', 'covered'].includes(feature)) {
            filters[`features.${feature}`] = true;
          }
        });
      }

      // Filtrar por rating mínimo
      if (req.query.minRating) {
        filters.averageRating = { $gte: parseFloat(req.query.minRating as string) };
      }

      const bars = await Bar.find(filters)
        .populate("creator", "username")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Bar.countDocuments(filters);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        bars,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });

    } catch (error) {
      console.error("Error getting bars:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Buscar barras por ubicación (GPS)
  searchBarsByLocation: async (req: Request, res: Response) => {
    try {
      const { latitude, longitude, radius = 5 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: "Latitude and longitude are required",
          example: "/bars/search?latitude=-33.4489&longitude=-70.6693&radius=10"
        });
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      const radiusKm = parseFloat(radius as string);

      if (!isValidCoordinates(lat, lng)) {
        return res.status(400).json({ error: "Invalid GPS coordinates" });
      }

      // Buscar barras en un área aproximada (cuadrado)
      // 1 grado ≈ 111 km, entonces para el radio en grados:
      const radiusDegrees = radiusKm / 111;

      const bars = await Bar.find({
        "location.coordinates.latitude": {
          $gte: lat - radiusDegrees,
          $lte: lat + radiusDegrees
        },
        "location.coordinates.longitude": {
          $gte: lng - radiusDegrees,
          $lte: lng + radiusDegrees
        },
        active: true
      })
      .populate("creator", "username")
      .lean();

      // Calcular distancia exacta y filtrar por radio preciso
      const barsWithDistance = bars
        .map(bar => ({
          ...bar,
          distance: calculateDistance(
            lat, lng,
            bar.location.coordinates.latitude,
            bar.location.coordinates.longitude
          )
        }))
        .filter(bar => bar.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      res.status(200).json({
        searchCenter: { latitude: lat, longitude: lng },
        radius: radiusKm,
        found: barsWithDistance.length,
        bars: barsWithDistance
      });

    } catch (error) {
      console.error("Error searching bars by location:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Obtener barra específica por ID
  getBar: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid bar ID" });
      }

      const bar = await Bar.findById(id)
        .populate("creator", "username registerDate")
        .populate({
          path: "comments",
          populate: {
            path: "author",
            select: "username"
          },
          match: { active: true },
          options: { sort: { date: -1 }, limit: 10 }
        })
        .lean();

      if (!bar) {
        return res.status(404).json({ error: "Bar not found" });
      }

      if (!bar.active) {
        return res.status(404).json({ error: "Bar is not available" });
      }

      // Obtener estadísticas de ratings
      const ratings = await Punctuation.find({ bar: id, active: true }).lean();
      const ratingStats = {
        total: ratings.length,
        average: bar.averageRating,
        distribution: {
          5: ratings.filter(r => r.value === 5).length,
          4: ratings.filter(r => r.value === 4).length,
          3: ratings.filter(r => r.value === 3).length,
          2: ratings.filter(r => r.value === 2).length,
          1: ratings.filter(r => r.value === 1).length,
        }
      };

      res.status(200).json({
        bar,
        ratings: ratingStats
      });

    } catch (error) {
      console.error("Error getting bar:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Actualizar barra (solo creador o admin)
  updateBar: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid bar ID" });
      }

      const existingBar = await Bar.findById(id);
      if (!existingBar) {
        return res.status(404).json({ error: "Bar not found" });
      }

      // Verificar permisos (solo creador o admin)
      if (existingBar.creator.toString() !== userId && userRole !== "admin") {
        return res.status(403).json({ 
          error: "You can only update bars you created" 
        });
      }

      const {
        name,
        description,
        location,
        equipment,
        features,
        images
      } = req.body;

      const updateData: any = {};

      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (equipment) updateData.equipment = { ...existingBar.equipment, ...equipment };
      if (features) updateData.features = { ...existingBar.features, ...features };
      if (images) updateData.images = images;

      // Si se actualiza ubicación, validar coordenadas
      if (location?.coordinates) {
        const { latitude, longitude } = location.coordinates;
        if (!isValidCoordinates(latitude, longitude)) {
          return res.status(400).json({ 
            error: "Invalid GPS coordinates" 
          });
        }
        updateData.location = location;
      }

      updateData.updatedAt = new Date();

      const updatedBar = await Bar.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      )
      .populate("creator", "username")
      .lean();

      res.status(200).json({
        message: "Bar updated successfully",
        bar: updatedBar
      });

    } catch (error) {
      console.error("Error updating bar:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Desactivar barra (solo creador o admin)
  deactivateBar: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid bar ID" });
      }

      const bar = await Bar.findById(id);
      if (!bar) {
        return res.status(404).json({ error: "Bar not found" });
      }

      // Verificar permisos
      if (bar.creator.toString() !== userId && userRole !== "admin") {
        return res.status(403).json({ 
          error: "You can only deactivate bars you created" 
        });
      }

      if (!bar.active) {
        return res.status(400).json({ error: "Bar is already inactive" });
      }

      const updatedBar = await Bar.findByIdAndUpdate(
        id,
        { active: false, updatedAt: new Date() },
        { new: true }
      )
      .populate("creator", "username")
      .lean();

      res.status(200).json({
        message: "Bar deactivated successfully",
        bar: updatedBar
      });

    } catch (error) {
      console.error("Error deactivating bar:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Obtener barras creadas por un usuario
  getUserBars: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      if (!Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Verificar si el usuario existe
      const user = await User.findById(userId).select("username").lean();
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const bars = await Bar.find({ 
        creator: userId,
        active: true 
      })
      .populate("creator", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

      const total = await Bar.countDocuments({ 
        creator: userId, 
        active: true 
      });

      res.status(200).json({
        user: user,
        bars,
        pagination: {
          currentPage: page,
          totalItems: total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error("Error getting user bars:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
};