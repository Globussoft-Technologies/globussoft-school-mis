import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

interface DefaultSetting {
  key: string;
  value: string;
  category: string;
  label: string;
  type: string;
}

const DEFAULT_SETTINGS: DefaultSetting[] = [
  {
    key: 'school_name',
    value: 'MIS-ILSMS School',
    category: 'GENERAL',
    label: 'School Name',
    type: 'STRING',
  },
  {
    key: 'academic_year',
    value: '2025-26',
    category: 'ACADEMIC',
    label: 'Current Academic Year',
    type: 'STRING',
  },
  {
    key: 'grading_scale',
    value: JSON.stringify({
      'A+': 90,
      A: 80,
      'B+': 70,
      B: 60,
      C: 50,
      D: 40,
      F: 0,
    }),
    category: 'GRADING',
    label: 'Grading Scale (min % per grade)',
    type: 'JSON',
  },
  {
    key: 'attendance_threshold',
    value: '75',
    category: 'ATTENDANCE',
    label: 'Minimum Attendance Threshold (%)',
    type: 'NUMBER',
  },
  {
    key: 'late_penalty_percent',
    value: '2',
    category: 'FEE',
    label: 'Late Fee Penalty (%)',
    type: 'NUMBER',
  },
  {
    key: 'max_class_size',
    value: '40',
    category: 'ACADEMIC',
    label: 'Maximum Class Size',
    type: 'NUMBER',
  },
  {
    key: 'fee_due_day',
    value: '10',
    category: 'FEE',
    label: 'Fee Due Day of Month',
    type: 'NUMBER',
  },
  {
    key: 'notification_channels',
    value: JSON.stringify(['EMAIL', 'SMS']),
    category: 'NOTIFICATION',
    label: 'Active Notification Channels',
    type: 'JSON',
  },
];

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(schoolId: string) {
    const settings = await this.prisma.systemSetting.findMany({
      where: { schoolId },
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    });

    // Group by category
    const grouped: Record<string, typeof settings> = {};
    for (const setting of settings) {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }
      grouped[setting.category].push(setting);
    }

    return grouped;
  }

  async findOne(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting "${key}" not found`);
    }
    return setting;
  }

  async update(key: string, dto: UpdateSettingDto, updatedBy: string) {
    const setting = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting "${key}" not found`);
    }
    return this.prisma.systemSetting.update({
      where: { key },
      data: {
        value: dto.value,
        updatedBy,
      },
    });
  }

  async seedDefaults(schoolId: string, seededBy: string) {
    const results: { key: string; action: string }[] = [];

    for (const def of DEFAULT_SETTINGS) {
      const existing = await this.prisma.systemSetting.findUnique({ where: { key: def.key } });
      if (!existing) {
        await this.prisma.systemSetting.create({
          data: {
            key: def.key,
            value: def.value,
            category: def.category,
            label: def.label,
            type: def.type,
            schoolId,
            updatedBy: seededBy,
          },
        });
        results.push({ key: def.key, action: 'CREATED' });
      } else {
        results.push({ key: def.key, action: 'SKIPPED' });
      }
    }

    return { seeded: results };
  }
}
