import { Injectable, NotFoundException } from "@nestjs/common";
import { UpdateUserDto } from "src/auth/dto/update-user.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { PaginationDto } from "../common/dto/pagination.dto";
import { PaginationHelper } from "../common/utils/pagination";
import { ResponseHelper } from "../common/utils/response";

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async findAllUsers(paginationDto: PaginationDto) {
        const { skip, take } = PaginationHelper.getSkipAndTake(paginationDto);
        const orderBy = PaginationHelper.getOrderBy(paginationDto);

        const total = await this.prisma.user.count();

        // Get paginated data
        const users = await this.prisma.user.findMany({
            skip,
            take,
            orderBy,
            select: {
                id: true,
                email: true,
                role: true,
                isVerified: true,
                phone: true,
               
            }
        });

        // Calculate pagination metadata
        const meta = PaginationHelper.calculatePaginationMeta(paginationDto, total);

        return ResponseHelper.success(
            users,
            'Users retrieved successfully',
            200,
            meta
        );
    }

    async findSpecificUser(id: string) {
        const user = await this.prisma.user.findUnique({ 
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                isVerified: true,
                phone: true,
            }
        });
        
        if (!user) {
            throw new NotFoundException('User not found');
        }
        
        return ResponseHelper.success(
            user,
            'User retrieved successfully'
        );
    }

    async updateUser(id: string, data: UpdateUserDto) {
        const existingUser = await this.prisma.user.findUnique({ 
            where: { id },
            select: { id: true }
        });
        
        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        const user = await this.prisma.user.update({ 
            where: { id }, 
            data,
            select: {
                id: true,
                email: true,
                role: true,
                isVerified: true,
                phone: true,
            }
        });
        
        return ResponseHelper.success(
            user,
            'User updated successfully'
        );
    }

    async removeUser(id: string) {
        const existingUser = await this.prisma.user.findUnique({ 
            where: { id },
            select: { id: true }
        });
        
        if (!existingUser) {
            throw new NotFoundException('User not found');
        }

        await this.prisma.user.delete({ where: { id } });
        
        return ResponseHelper.success(
            { message: 'User deleted successfully' },
            'User deleted successfully'
        );
    }
}