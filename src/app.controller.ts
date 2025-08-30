import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ResponseHelper } from './common/utils/response';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    const message = this.appService.getHello();
    return ResponseHelper.success(
      { message },
      'Hello World!'
    );
  }
}
