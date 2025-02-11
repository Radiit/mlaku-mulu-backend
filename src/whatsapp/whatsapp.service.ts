import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as twilio from 'twilio';
import { measureMemory } from "vm";

@Injectable()
export class WhatsAppService {
    private client: twilio.Twilio;

    constructor(private configService: ConfigService) {
        this.client = twilio(
            this.configService.get<string>('TWILIO_ACCOUNT_SID'),
            this.configService.get<string>('TWILIO_AUTH_TOKEN')
        );
    }

    async sendVerification(phone: string, token: string) {
        const verifyUrl = `${this.configService.get<string>('APP_URL')}/auth/verify?token=${token}`;

        return this.client.messages.create({
            from: this.configService.get<string>('TWILIO_WHATSAPP_NUMBER'),
            to: `whatsapp:${phone}`,
            body: `Mlaku mulu: Klink berikut ini untuk verifikasi akun anda: ${verifyUrl}`,
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