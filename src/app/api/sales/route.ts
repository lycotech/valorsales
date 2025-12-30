import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { verifyToken } from '@/lib/auth/jwt'
import { hasPermission, Resource, Action } from '@/lib/auth/permissions'
import { prisma } from '@/lib/db/client'
import { createSaleSchema } from '@/types/salesTypes'
import { logCreate, logUpdate, logDelete, getRequestDetails } from '@/lib/auditLogger'

// Helper function to generate unique sale code
async function generateSaleCode(): Promise<string> {
  const today = new Date()
  const datePrefix = `SL${today.getFullYear().toString().slice(-2)}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`

  // Find the last sale code with this prefix
  const lastSale = await prisma.sale.findFirst({
    where: { saleCode: { startsWith: datePrefix } },
    orderBy: { saleCode: 'desc' }
  })

  let sequence = 1

  if (lastSale?.saleCode) {
    const lastSequence = parseInt(lastSale.saleCode.slice(-4))

    sequence = lastSequence + 1
  }

  return `${datePrefix}${sequence.toString().padStart(4, '0')}`
}

/**
 * Get all sales with search and pagination
 * GET /api/sales?search=keyword&customerId=xxx&status=pending&page=1&pageSize=10
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'No token provided' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Invalid token' }, { status: 401 })
    }

    // Check permissions - Admin, Sales can view sales
    if (!hasPermission(payload.role as any, Resource.SALES, Action.READ)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const customerId = searchParams.get('customerId') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { customer: { businessName: { contains: search } } },
        { customer: { customerCode: { contains: search } } },
        { product: { productName: { contains: search } } },
        { product: { productCode: { contains: search } } }
      ]
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (status) {
      where.status = status
    }

    // Get total count
    const totalCount = await prisma.sale.count({ where })

    // Get sales with pagination
    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            businessName: true
          }
        },
        product: {
          select: {
            id: true,
            productCode: true,
            productName: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                productCode: true,
                productName: true
              }
            }
          }
        },
        _count: {
          select: {
            payments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    })

    // Transform to include decimal conversions
    const salesWithData = sales.map((sale: any) => ({
      ...sale,
      quantity: sale.quantity ? parseFloat(sale.quantity.toString()) : null,
      price: sale.price ? parseFloat(sale.price.toString()) : null,
      total: parseFloat(sale.total.toString()),
      amountPaid: parseFloat(sale.amountPaid.toString()),
      balance: parseFloat(sale.balance.toString()),
      paymentCount: sale._count.payments,
      items:
        sale.items?.map((item: any) => ({
          ...item,
          quantity: parseFloat(item.quantity.toString()),
          price: parseFloat(item.price.toString()),
          total: parseFloat(item.total.toString())
        })) || []
    }))

    return NextResponse.json({
      success: true,
      data: salesWithData,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      }
    })
  } catch (error) {
    console.error('Error fetching sales:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Create new sale transaction with multi-product support
 * POST /api/sales
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'No token provided' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized', message: 'Invalid token' }, { status: 401 })
    }

    // Check permissions - Admin and Sales can create sales
    if (!hasPermission(payload.role as any, Resource.SALES, Action.CREATE)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()

    // Validate request body
    const validationResult = createSaleSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: validationResult.error.issues
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId }
    })

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found'
        },
        { status: 404 }
      )
    }

    // Verify all products exist and calculate total
    let total = 0
    const itemsWithProducts: { productId: string; product: any; quantity: number; price: number; subtotal: number }[] =
      []

    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            error: `Product not found: ${item.productId}`
          },
          { status: 404 }
        )
      }

      const subtotal = item.quantity * item.price

      total += subtotal

      itemsWithProducts.push({
        productId: item.productId,
        product,
        quantity: item.quantity,
        price: item.price,
        subtotal
      })
    }

    // Check if using credit balance
    const currentCreditBalance = parseFloat(customer.creditBalance.toString())
    const useCreditBalance = body.useCreditBalance && currentCreditBalance > 0
    const creditToUse = useCreditBalance
      ? Math.min(body.creditBalanceToUse || currentCreditBalance, total, currentCreditBalance)
      : 0

    // Total payment = cash payment + credit used
    const totalPayment = data.amountPaid + creditToUse
    const amountForThisSale = Math.min(totalPayment, total)
    const excessPayment = Math.max(0, totalPayment - total)
    const saleBalance = total - amountForThisSale

    // Determine status for THIS sale
    let status: 'pending' | 'partial' | 'paid' = 'pending'

    if (amountForThisSale === 0) {
      status = 'pending'
    } else if (amountForThisSale < total) {
      status = 'partial'
    } else {
      status = 'paid'
    }

    // Generate sale code
    const saleCode = await generateSaleCode()

    // For backward compatibility, use first product's info in main sale record
    const primaryItem = itemsWithProducts[0]
    const aggregateQuantity = itemsWithProducts.reduce((sum, item) => sum + item.quantity, 0)
    const averagePrice = total / aggregateQuantity

    // Create sale with inventory deduction in transaction
    const saleResult = await prisma.$transaction(async tx => {
      // Deduct credit balance if used
      if (creditToUse > 0) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: { creditBalance: currentCreditBalance - creditToUse }
        })
        console.log(
          `[SALE] Deducted ${creditToUse} from customer credit balance. New balance: ${currentCreditBalance - creditToUse}`
        )
      }

      // Check inventory availability for ALL products first
      const inventoryErrors: string[] = []

      for (const item of itemsWithProducts) {
        const inventory = await tx.productInventory.findUnique({
          where: { productId: item.productId }
        })

        console.log(
          `[SALE] Inventory lookup for product ${item.product.productName}:`,
          inventory ? `Found - Qty: ${inventory.quantity}` : 'NOT FOUND'
        )

        if (!inventory) {
          inventoryErrors.push(`No inventory record found for product "${item.product.productName}"`)
          continue
        }

        const availableQty = Number(inventory.quantity)

        if (availableQty < item.quantity) {
          if (availableQty === 0) {
            inventoryErrors.push(
              `Product "${item.product.productName}" is out of stock. Current stock: 0 ${inventory.unit || 'units'}, Required: ${item.quantity} ${inventory.unit || 'units'}`
            )
          } else {
            inventoryErrors.push(
              `Insufficient stock for "${item.product.productName}". Available: ${availableQty} ${inventory.unit || 'units'}, Required: ${item.quantity} ${inventory.unit || 'units'}`
            )
          }
        }
      }

      // If there are any inventory errors, throw them before creating the sale
      if (inventoryErrors.length > 0) {
        throw new Error(inventoryErrors.join('; '))
      }

      // Create the main sale record
      const newSale = await tx.sale.create({
        data: {
          saleCode,
          customerId: data.customerId,
          productId: primaryItem.productId, // For backward compatibility
          quantity: aggregateQuantity,
          price: averagePrice,
          total,
          supplyDate: data.supplyDate,
          paymentMode: data.paymentMode,
          amountPaid: amountForThisSale,
          balance: saleBalance,
          paymentDate: data.paymentDate || null,
          status
        }
      })

      // Create sale items and deduct inventory for each product
      for (const item of itemsWithProducts) {
        // Create sale item
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            total: item.subtotal
          }
        })

        // Get and update inventory
        const inventory = await tx.productInventory.findUnique({
          where: { productId: item.productId }
        })

        if (!inventory) {
          throw new Error(`Inventory not found for product: ${item.productId}`)
        }

        const availableQty = Number(inventory.quantity)
        const newQuantity = availableQty - item.quantity

        console.log(
          `[SALE] Deducting inventory - Product: ${item.product.productName}, Before: ${availableQty}, Deduct: ${item.quantity}, After: ${newQuantity}`
        )

        await tx.productInventory.update({
          where: { productId: item.productId },
          data: { quantity: newQuantity }
        })

        // Create inventory transaction record
        await tx.inventoryTransaction.create({
          data: {
            type: 'product',
            productInventoryId: inventory.id,
            transactionType: 'sale',
            quantityChange: -item.quantity,
            quantityBefore: availableQty,
            quantityAfter: newQuantity,
            referenceId: newSale.id,
            referenceType: 'sale',
            notes: `Stock deducted for sale ${saleCode} to ${customer.businessName} - ${item.product.productName}`,
            createdBy: payload.userId
          }
        })

        console.log(`[SALE] Inventory updated successfully for product: ${item.product.productName}`)
      }

      // Handle excess payment - apply to outstanding sales first, then add to credit balance
      let creditBalanceAdded = 0

      if (excessPayment > 0) {
        console.log(`[SALE] Excess payment of ${excessPayment} - applying to outstanding sales`)

        // Get outstanding sales for this customer (oldest first)
        const outstandingSales = await tx.sale.findMany({
          where: {
            customerId: data.customerId,
            balance: { gt: 0 },
            id: { not: newSale.id } // Exclude current sale
          },
          orderBy: { supplyDate: 'asc' }
        })

        let remainingExcess = excessPayment

        for (const oldSale of outstandingSales) {
          if (remainingExcess <= 0) break

          const oldBalance = parseFloat(oldSale.balance.toString())
          const paymentAmount = Math.min(remainingExcess, oldBalance)
          const newBalance = oldBalance - paymentAmount
          const newAmountPaid = parseFloat(oldSale.amountPaid.toString()) + paymentAmount

          // Determine new status
          let newStatus: 'pending' | 'partial' | 'paid' = 'partial'

          if (newBalance === 0) {
            newStatus = 'paid'
          } else if (newAmountPaid > 0) {
            newStatus = 'partial'
          }

          // Update the old sale
          await tx.sale.update({
            where: { id: oldSale.id },
            data: {
              amountPaid: newAmountPaid,
              balance: newBalance,
              status: newStatus,
              paymentDate: data.paymentDate || new Date()
            }
          })

          // Create a payment record for this allocation
          await tx.salePayment.create({
            data: {
              saleId: oldSale.id,
              amount: paymentAmount,
              paymentDate: data.paymentDate || new Date(),
              paymentMode: data.paymentMode,
              notes: `Payment allocated from new sale (${saleCode})`
            }
          })

          console.log(`[SALE] Applied ${paymentAmount} to sale ${oldSale.id}, new balance: ${newBalance}`)
          remainingExcess -= paymentAmount
        }

        // If there's still remaining excess after clearing all outstanding, add to credit balance
        if (remainingExcess > 0) {
          console.log(`[SALE] Adding ${remainingExcess} to customer credit balance`)

          // Get current credit balance
          const currentCustomer = await tx.customer.findUnique({
            where: { id: data.customerId },
            select: { creditBalance: true }
          })

          const currentCredit = currentCustomer ? parseFloat(currentCustomer.creditBalance.toString()) : 0
          const newCreditBalance = currentCredit + remainingExcess

          await tx.customer.update({
            where: { id: data.customerId },
            data: { creditBalance: newCreditBalance }
          })

          creditBalanceAdded = remainingExcess
          console.log(`[SALE] Customer credit balance updated: ${currentCredit} -> ${newCreditBalance}`)
        }
      }

      return { sale: newSale, creditBalanceAdded }
    })

    // Return sale with items
    const saleResponse = await prisma.sale.findUnique({
      where: { id: saleResult.sale.id },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            businessName: true,
            creditBalance: true
          }
        },
        product: {
          select: {
            id: true,
            productCode: true,
            productName: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                productCode: true,
                productName: true
              }
            }
          }
        }
      }
    })

    // Build message based on what happened
    let message = 'Sale created successfully'

    const messageParts: string[] = []

    if (creditToUse > 0) {
      messageParts.push(`₦${creditToUse.toLocaleString()} credit used`)
    }

    if (excessPayment > 0) {
      const appliedToOutstanding = excessPayment - saleResult.creditBalanceAdded

      if (appliedToOutstanding > 0) {
        messageParts.push(`₦${appliedToOutstanding.toLocaleString()} applied to outstanding`)
      }

      if (saleResult.creditBalanceAdded > 0) {
        messageParts.push(`₦${saleResult.creditBalanceAdded.toLocaleString()} added to credit balance`)
      }
    }

    if (messageParts.length > 0) {
      message = `Sale created. ${messageParts.join(', ')}.`
    }

    // Audit log
    const reqDetails = getRequestDetails(request)

    logCreate(
      'sale',
      saleResult.sale.id,
      {
        saleCode,
        customerId: data.customerId,
        total,
        amountPaid: amountForThisSale,
        balance: saleBalance,
        status,
        items: data.items.length
      },
      payload.userId,
      reqDetails
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          ...saleResult.sale,
          saleCode,
          quantity: saleResult.sale.quantity ? parseFloat(saleResult.sale.quantity.toString()) : null,
          price: saleResult.sale.price ? parseFloat(saleResult.sale.price.toString()) : null,
          total: parseFloat(saleResult.sale.total.toString()),
          amountPaid: parseFloat(saleResult.sale.amountPaid.toString()),
          balance: parseFloat(saleResult.sale.balance.toString()),
          items: saleResponse?.items.map(item => ({
            ...item,
            quantity: parseFloat(item.quantity.toString()),
            price: parseFloat(item.price.toString()),
            total: parseFloat(item.total.toString())
          }))
        },
        creditUsed: creditToUse > 0 ? creditToUse : undefined,
        excessPaymentApplied: excessPayment > 0 ? excessPayment : undefined,
        creditBalanceAdded: saleResult.creditBalanceAdded > 0 ? saleResult.creditBalanceAdded : undefined,
        message
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating sale:', error)

    // Check if it's an inventory-related error (should be 400, not 500)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isInventoryError =
      errorMessage.includes('inventory') ||
      errorMessage.includes('stock') ||
      errorMessage.includes('Insufficient') ||
      errorMessage.includes('Available') ||
      errorMessage.includes('Required')

    // Return 400 for business logic errors (inventory, validation), 500 for actual server errors
    const status = isInventoryError ? 400 : 500
    const errorType = isInventoryError ? 'Validation error' : 'Internal server error'

    return NextResponse.json(
      {
        success: false,
        error: errorType,
        message: errorMessage
      },
      { status }
    )
  }
}
