import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { UserController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
    imports: [PrismaModule],
    controllers: [UserController],
    providers: [UsersService],
})

export class UsersModule {}