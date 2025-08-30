import { Body, Controller, Delete, Get, Param, Patch, UseGuards, NotFoundException, Query } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { UsersService } from "./users.service";
import { Roles } from "src/common/decorators/roles.decorator";
import { UpdateUserDto } from "src/auth/dto/update-user.dto";
import { PaginationDto } from "../common/dto/pagination.dto";
import { ResponseHelper } from "../common/utils/response";

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
    constructor(private readonly userService: UsersService) {}

    @Get()
    @Roles('pegawai')
    async findAllUsers(@Query() paginationDto: PaginationDto) {
        return await this.userService.findAllUsers(paginationDto);
    }

    @Get(':id')
    @Roles('pegawai')
    async findOneUser(@Param('id') id: string) {
        return await this.userService.findSpecificUser(id);
    }

    @Patch(':id')
    @Roles('pegawai')
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return await this.userService.updateUser(id, updateUserDto);
    }

    @Delete(':id')
    @Roles('pegawai')
    async remove(@Param('id') id: string) {
        return await this.userService.removeUser(id);
    }
}
