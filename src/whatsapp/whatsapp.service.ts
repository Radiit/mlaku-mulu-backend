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

// Function to send a WhatsApp verification message
async sendVerification(phone: string, token: string) {
  if (!phone || phone === '') {
    throw new Error('Phone number is required for sending verification.');
  }

  const verifyUrl = `${this.configService.get<string>('APP_URL')}/auth/verify?token=${token}`;

  return this.client.messages.create({
    from: `whatsapp:${this.configService.get<string>('TWILIO_WHATSAPP_NUMBER')}`,
    to: `whatsapp:${phone}`, 
    body: `🔒 Mlaku Mulu Verification: Click the link below to verify your account:\n\n${verifyUrl}\n\nIf you did not request this, please ignore this message.`,
  });
}

// Function to send a WhatsApp notification
async sendNotification(phone: string, message: string) {
  try {
      return await this.client.messages.create({
          from: this.configService.get<string>('TWILIO_WHATSAPP_NUMBER'),
          to: `whatsapp:${phone}`,
          body: `📢 Mlaku Mulu Notification:\n${message}`,
      });
    } catch (error) {
      console.error('Failed to send WhatsApp notification:', error);
    }
  }
}
