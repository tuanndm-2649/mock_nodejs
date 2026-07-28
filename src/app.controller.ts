import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { I18n, I18nContext } from 'nestjs-i18n';
import { ApiHeader } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiHeader({
  name: 'accept-language',
  description: 'The preferred language for the response (e.g., en, ja)',
  required: false,
  schema: { default: 'en' },
})
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('/hello')
  getI18nHello(@I18n() i18n: I18nContext) {
    return i18n.t('hello.HELLO');
  }
}
