import { Injectable } from '@nestjs/common';
import * as twilio from 'twilio';  // Import Twilio SDK
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WhatsAppService {
  private client: twilio.Twilio;

  constructor(private configService: ConfigService) {
    this.client = twilio(
      this.configService.get<string>('TWILIO_ACCOUNT_SID'),
      this.configService.get<string>('TWILIO_AUTH_TOKEN')
    );
  }

  // Fungsi untuk mengirim WhatsApp message
  async sendVerification(phone: string, token: string) {
    // Pastikan phone bukan null atau kosong
    if (!phone || phone === '') {
      throw new Error('Phone number is required for sending verification.');
    }

    const verifyUrl = `${this.configService.get<string>('APP_URL')}/auth/verify?token=${token}`;

    return this.client.messages.create({
      from: this.configService.get<string>('TWILIO_WHATSAPP_NUMBER'),
      to: `whatsapp:${phone}`,  // Pastikan nomor dalam format yang benar
      body: `Mlaku mulu: Klik berikut ini untuk verifikasi akun anda: ${verifyUrl}`,
    });
  }

  async sendNotification(phone: string, message: string) {
    try {
      return await this.client.messages.create({
        from: this.configService.get<string>('TWILIO_WHATSAPP_NUMBER'),
        to: `whatsapp:${phone}`,
        body: message,
      });
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
    }
  }
}
