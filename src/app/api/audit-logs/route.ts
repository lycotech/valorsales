/**
 * Audit Logs API
 * GET - List audit logs with filters
 */

import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const skip = (page - 1) * pageSize

    // Filters
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const entity = searchParams.get('entity')
    const entityId = searchParams.get('entityId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (action) {
      where.action = action
    }

    if (entity) {
      where.entity = entity
    }

    if (entityId) {
      where.entityId = entityId
    }

    if (startDate || endDate) {
      where.createdAt = {}

      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }

      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    if (search) {
      where.OR = [
        { entity: { contains: search } },
        { action: { contains: search } },
        { entityId: { contains: search } }
      ]
    }

    // Fetch audit logs
    const [auditLogs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.auditLog.count({ where })
    ])

    // Fetch user names for display
    const userIds = [...new Set(auditLogs.map(log => log.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    // Enrich logs with user info
    const enrichedLogs = auditLogs.map(log => ({
      ...log,
      user: userMap.get(log.userId) || { name: 'Unknown', email: 'unknown@example.com' }
    }))

    return NextResponse.json({
      data: enrichedLogs,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)

    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

// Get audit log summary/stats
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type } = body

    if (type === 'stats') {
      // Get stats for the last 30 days
      const thirtyDaysAgo = new Date()

      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const [totalLogs, actionCounts, entityCounts, recentActivity] = await Promise.all([
        // Total logs in last 30 days
        prisma.auditLog.count({
          where: { createdAt: { gte: thirtyDaysAgo } }
        }),

        // Count by action
        prisma.auditLog.groupBy({
          by: ['action'],
          _count: { action: true },
          where: { createdAt: { gte: thirtyDaysAgo } }
        }),

        // Count by entity
        prisma.auditLog.groupBy({
          by: ['entity'],
          _count: { entity: true },
          where: { createdAt: { gte: thirtyDaysAgo } }
        }),

        // Activity by day
        prisma.$queryRaw`
          SELECT DATE(createdAt) as date, COUNT(*) as count
          FROM audit_logs
          WHERE createdAt >= ${thirtyDaysAgo}
          GROUP BY DATE(createdAt)
          ORDER BY date DESC
          LIMIT 30
        `
      ])

      return NextResponse.json({
        totalLogs,
        actionCounts: actionCounts.reduce(
          (acc, item) => {
            acc[item.action] = item._count.action

            return acc
          },
          {} as Record<string, number>
        ),
        entityCounts: entityCounts.reduce(
          (acc, item) => {
            acc[item.entity] = item._count.entity

            return acc
          },
          {} as Record<string, number>
        ),
        recentActivity
      })
    }

    // Get history for a specific entity
    if (type === 'history') {
      const { entity, entityId } = body

      if (!entity || !entityId) {
        return NextResponse.json({ error: 'entity and entityId are required' }, { status: 400 })
      }

      const history = await prisma.auditLog.findMany({
        where: { entity, entityId },
        orderBy: { createdAt: 'desc' },
        take: 100
      })

      // Get user names
      const userIds = [...new Set(history.map(log => log.userId))]
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true }
      })

      const userMap = new Map(users.map(u => [u.id, u.name]))

      const enrichedHistory = history.map(log => ({
        ...log,
        userName: userMap.get(log.userId) || 'Unknown'
      }))

      return NextResponse.json(enrichedHistory)
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
  } catch (error) {
    console.error('Error in audit logs POST:', error)

    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
