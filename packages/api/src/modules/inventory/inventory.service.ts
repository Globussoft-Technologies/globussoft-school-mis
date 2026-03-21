import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  private async logAction(
    itemId: string,
    action: string,
    performedBy: string,
    extra?: {
      quantity?: number;
      fromLocation?: string;
      toLocation?: string;
      remarks?: string;
    },
  ) {
    return this.prisma.inventoryLog.create({
      data: {
        itemId,
        action,
        performedBy,
        quantity: extra?.quantity,
        fromLocation: extra?.fromLocation,
        toLocation: extra?.toLocation,
        remarks: extra?.remarks,
      },
    });
  }

  async addItem(data: {
    name: string;
    category: string;
    description?: string;
    quantity?: number;
    location?: string;
    condition?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    supplier?: string;
    warrantyExpiry?: string;
    assignedTo?: string;
    barcode?: string;
    schoolId: string;
    performedBy?: string;
  }) {
    const { purchaseDate, warrantyExpiry, performedBy, ...rest } = data;
    const item = await this.prisma.inventoryItem.create({
      data: {
        ...rest,
        ...(purchaseDate ? { purchaseDate: new Date(purchaseDate) } : {}),
        ...(warrantyExpiry ? { warrantyExpiry: new Date(warrantyExpiry) } : {}),
      },
    });
    await this.logAction(item.id, 'ADDED', performedBy || 'system', {
      quantity: item.quantity,
    });
    return item;
  }

  async findAll(params: {
    search?: string;
    category?: string;
    condition?: string;
    location?: string;
    schoolId?: string;
  }) {
    const { search, category, condition, location, schoolId } = params;
    return this.prisma.inventoryItem.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        ...(category ? { category } : {}),
        ...(condition ? { condition } : {}),
        ...(location ? { location: { contains: location } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { barcode: { contains: search } },
                { description: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Inventory item not found');
    const logs = await this.prisma.inventoryLog.findMany({
      where: { itemId: id },
      orderBy: { createdAt: 'desc' },
    });
    return { ...item, logs };
  }

  async updateItem(
    id: string,
    data: {
      name?: string;
      category?: string;
      description?: string;
      quantity?: number;
      location?: string;
      condition?: string;
      purchaseDate?: string;
      purchasePrice?: number;
      supplier?: string;
      warrantyExpiry?: string;
      assignedTo?: string;
      barcode?: string;
      performedBy?: string;
    },
  ) {
    const { purchaseDate, warrantyExpiry, performedBy, ...rest } = data;
    const item = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...rest,
        ...(purchaseDate ? { purchaseDate: new Date(purchaseDate) } : {}),
        ...(warrantyExpiry ? { warrantyExpiry: new Date(warrantyExpiry) } : {}),
      },
    });
    if (data.quantity !== undefined) {
      await this.logAction(id, 'QUANTITY_UPDATED', performedBy || 'system', {
        quantity: data.quantity,
        remarks: 'Quantity updated',
      });
    }
    return item;
  }

  async assignItem(
    id: string,
    data: { assignedTo: string; toLocation?: string; performedBy: string; remarks?: string },
  ) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');

    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        assignedTo: data.assignedTo,
        ...(data.toLocation ? { location: data.toLocation } : {}),
      },
    });
    await this.logAction(id, 'ASSIGNED', data.performedBy, {
      fromLocation: item.location || undefined,
      toLocation: data.toLocation,
      remarks: data.remarks || `Assigned to ${data.assignedTo}`,
    });
    return updated;
  }

  async returnItem(
    id: string,
    data: { toLocation?: string; performedBy: string; remarks?: string },
  ) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');

    const updated = await this.prisma.inventoryItem.update({
      where: { id },
      data: {
        assignedTo: null,
        ...(data.toLocation ? { location: data.toLocation } : {}),
      },
    });
    await this.logAction(id, 'RETURNED', data.performedBy, {
      fromLocation: item.location || undefined,
      toLocation: data.toLocation,
      remarks: data.remarks,
    });
    return updated;
  }

  async getLowStock(threshold = 5, schoolId?: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        quantity: { lt: threshold },
        ...(schoolId ? { schoolId } : {}),
      },
      orderBy: { quantity: 'asc' },
    });
  }

  async getAllLogs(schoolId?: string) {
    // Get item IDs for schoolId filter
    if (schoolId) {
      const items = await this.prisma.inventoryItem.findMany({
        where: { schoolId },
        select: { id: true },
      });
      const itemIds = items.map((i) => i.id);
      return this.prisma.inventoryLog.findMany({
        where: { itemId: { in: itemIds } },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.inventoryLog.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
