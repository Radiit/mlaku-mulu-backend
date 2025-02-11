import { Injectable, NotFoundException } from "@nestjs/common";
import { UpdateUserDto } from "src/auth/dto/update-user.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async findAllUsers() {
        return this.prisma.user.findMany();
    }

    async findSpecificUser(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updateUser(id: string, data: UpdateUserDto) {
        return this.prisma.user.update({ where: { id }, data });
    }

    async removeUser(id: string) {
        return this.prisma.user.delete({ where: { id } });
    }
}