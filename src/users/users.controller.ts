import { Body, Controller, Delete, Get, Param, Patch, UseGuards, NotFoundException, InternalServerErrorException } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { UsersService } from "./users.service";
import { Roles } from "src/common/decorators/roles.decorator";
import { UpdateUserDto } from "src/auth/dto/update-user.dto";

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
    constructor(private readonly userService: UsersService) {}

    @Get()
    @Roles('pegawai')
    async findAllUsers() {
        try {
            const users = await this.userService.findAllUsers();
            return {
                success: true,
                message: "Users retrieved successfully",
                data: users,
            };
        } catch (error) {
            throw new InternalServerErrorException({
                success: false,
                message: "Failed to retrieve users",
                error: error.message,
            });
        }
    }

    @Get(':id')
    @Roles('pegawai')
    async findOneUser(@Param('id') id: string) {
        try {
            const user = await this.userService.findSpecificUser(id);
            if (!user) {
                throw new NotFoundException({
                    success: false,
                    message: `User with ID ${id} not found`,
                });
            }
            return {
                success: true,
                message: "User retrieved successfully",
                data: user,
            };
        } catch (error) {
            throw new InternalServerErrorException({
                success: false,
                message: "Failed to retrieve user",
                error: error.message,
            });
        }
    }

    @Patch(':id')
    @Roles('pegawai')
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        try {
            const updatedUser = await this.userService.updateUser(id, updateUserDto);
            return {
                success: true,
                message: "User updated successfully",
                data: updatedUser,
            };
        } catch (error) {
            throw new InternalServerErrorException({
                success: false,
                message: "Failed to update user",
                error: error.message,
            });
        }
    }

    @Delete(':id')
    @Roles('pegawai')
    async remove(@Param('id') id: string) {
        try {
            const deletedUser = await this.userService.removeUser(id);
            if (!deletedUser) {
                throw new NotFoundException({
                    success: false,
                    message: `User with ID ${id} not found`,
                });
            }
            return {
                success: true,
                message: "User deleted successfully",
            };
        } catch (error) {
            throw new InternalServerErrorException({
                success: false,
                message: "Failed to delete user",
                error: error.message,
            });
        }
    }
}
