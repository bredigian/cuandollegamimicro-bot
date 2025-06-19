# 🚌 Cuándo Llega Mi Micro - Bot de Telegram

Este proyecto es un bot de Telegram desarrollado con [NestJS](https://nestjs.com/) que informa a los usuarios sobre la llegada de los micros 202 y 214 en paradas específicas de La Plata. El bot envía notificaciones automáticas en horarios determinados para que no pierdas tu micro.

## 🚦 ¿Cómo funciona?

El bot consulta información en tiempo real sobre los horarios de llegada de los micros y envía mensajes a los suscriptores de Telegram en los siguientes horarios:

- **Micro 214:** Lunes a viernes, de 16:00 a 19:59.
- **Micro 202:** Lunes a viernes, de 20:00 a 23:59.

Por defecto envia datos de esas líneas y paradas especificas, pero proximamente podrán configurarse las líneas y paradas que desees. De todas maneras, podés suscribirte al bot mediante el siguiente link: 

**[¿Cuándo llega mi micro? Telegram Bot](https://t.me/MicroArribosBot)**

## 🚀 Instalación y uso

1. **Clona el repositorio:**

   ```bash
   git clone https://github.com/bredigian/cuandollegamimicro-bot.git
   cd cuandollegamimicro-bot
   ```

2. **Instala las dependencias:**

   ```bash
   pnpm install
   ```

3. **Configura las variables de entorno:**  
   Crea un archivo `.env` con tus credenciales y configuraciones necesarias (por ejemplo, token de Telegram).

4. **Ejecuta el proyecto:**

   - Modo desarrollo:
     ```bash
     pnpm run start:dev
     ```
   - Modo producción:
     ```bash
     pnpm run start:prod
     ```

## 🛠️ Tecnologías utilizadas

- [NestJS](https://nestjs.com/)
- [Playwright](https://playwright.dev/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

## 📬 Contribuciones

¡Las contribuciones son bienvenidas! Si tienes ideas o mejoras, no dudes en abrir un issue o un pull request.

## 📄 Licencia

Este proyecto está bajo la licencia MIT.



**Desarrollado por Gianluca Bredice Developer**  
