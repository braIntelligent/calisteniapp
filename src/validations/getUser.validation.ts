import { Request, Response } from 'express';
import { User } from '@/models/user.schema';
import mongoose from 'mongoose';
import { z } from 'zod';

// ============ SCHEMAS DE VALIDACIÓN ============
const getUsersQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  search: z.string().optional(),
  active: z.enum(['true', 'false']).optional().transform(val => 
    val ? val === 'true' : undefined
  ),
  sortBy: z.enum(['username', 'email', 'registerDate']).optional().default('registerDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

const getUserParamsSchema = z.object({
  id: z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    { message: 'Invalid user ID format' }
  )
});

// ============ TIPOS ============
type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;
type GetUserParams = z.infer<typeof getUserParamsSchema>;

// ============ CONTROLADORES MEJORADOS ============

export const getUsers = async (req: Request, res: Response) => {
  try {
    // Validar query parameters
    const validatedQuery = getUsersQuerySchema.parse(req.query);
    const { page, limit, search, active, sortBy, sortOrder } = validatedQuery;

    // Limitar el máximo de resultados por página
    const maxLimit = 100;
    const finalLimit = Math.min(limit, maxLimit);
    const skip = (page - 1) * finalLimit;

    // Construir filtros de búsqueda
    const filter: any = {};
    
    if (active !== undefined) {
      filter.active = active;
    }

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Construir ordenamiento
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Ejecutar consultas en paralelo para mejor performance
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select('-password') // CRÍTICO: Excluir contraseña
        .sort(sort)
        .skip(skip)
        .limit(finalLimit)
        .lean(), // Mejor performance, devuelve objetos planos
      User.countDocuments(filter)
    ]);

    // Calcular metadata de paginación
    const totalPages = Math.ceil(totalUsers / finalLimit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const response = {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit: finalLimit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      },
      filters: {
        search: search || null,
        active: active !== undefined ? active : null,
        sortBy,
        sortOrder
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting users:', {
      error: error.message,
      stack: error.stack,
      query: req.query,
      timestamp: new Date().toISOString()
    });

    // Manejar errores de validación de Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Unable to fetch users'
    });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    // Validar parámetros
    const validatedParams = getUserParamsSchema.parse(req.params);
    const { id } = validatedParams;

    const user = await User.findById(id)
      .select('-password') // CRÍTICO: Excluir contraseña
      .lean(); // Mejor performance

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: `User with ID ${id} does not exist`
      });
    }

    // Agregar información adicional si es necesario
    const userResponse = {
      ...user,
      // Agregar campos calculados si es necesario
      accountAge: Math.floor((Date.now() - new Date(user.registerDate).getTime()) / (1000 * 60 * 60 * 24)), // días
    };

    res.status(200).json({
      user: userResponse
    });

  } catch (error) {
    console.error('Error getting user:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.id,
      timestamp: new Date().toISOString()
    });

    // Manejar errores de validación de Zod
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid user ID',
        details: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    // Manejar errores específicos de MongoDB
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        error: 'Invalid user ID format',
        message: 'The provided ID is not a valid MongoDB ObjectId'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Unable to fetch user'
    });
  }
};

// ============ CONTROLADOR ADICIONAL: BÚSQUEDA AVANZADA ============
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const searchSchema = z.object({
      q: z.string().min(1, 'Search query is required'),
      fields: z.array(z.enum(['username', 'email'])).optional().default(['username', 'email']),
      exact: z.boolean().optional().default(false),
      limit: z.number().max(50).optional().default(20)
    });

    const { q, fields, exact, limit } = searchSchema.parse(req.body);

    const searchConditions = fields.map(field => ({
      [field]: exact 
        ? { $regex: `^${q}$`, $options: 'i' }
        : { $regex: q, $options: 'i' }
    }));

    const users = await User.find({
      $and: [
        { active: true }, // Solo usuarios activos
        { $or: searchConditions }
      ]
    })
    .select('username email registerDate active')
    .limit(limit)
    .lean();

    res.status(200).json({
      query: q,
      results: users,
      count: users.length
    });

  } catch (error) {
    console.error('Error searching users:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid search parameters',
        details: error.issues
      });
    }

    res.status(500).json({ error: 'Search failed' });
  }
};

// ============ CONTROLADOR PARA ESTADÍSTICAS ============
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const [totalUsers, activeUsers, recentUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ active: true }),
      User.countDocuments({
        registerDate: { 
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
        }
      })
    ]);

    // Estadísticas por mes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await User.aggregate([
      {
        $match: {
          registerDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$registerDate' },
            month: { $month: '$registerDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        recentUsers
      },
      monthlyRegistrations: monthlyStats
    });

  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Unable to fetch statistics' });
  }
};

// ============ MIDDLEWARE DE RATE LIMITING (opcional) ============
import rateLimit from 'express-rate-limit';

export const getUsersRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por ventana de tiempo
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ============ USO EN RUTAS ============
/*
import { Router } from 'express';

const router = Router();

router.get('/users', getUsersRateLimit, getUsers);
router.get('/users/stats', getUserStats);
router.get('/users/:id', getUser);
router.post('/users/search', searchUsers);

export default router;
*/