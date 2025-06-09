export const MESSAGES = {
  START: {
    WELCOME:
      'Bienvenido! Te notificaré cada 2 minutos los próximos arribos que tengo configurado por defecto. Las líneas son:\n\n- 202\n- 214\n\nLas paradas son:\n\n- Avenida 7 y Calle 56 (202, hacia UTN)\n- Avenida 60 y Calle 125 (202, hacia La Plata)\n- Diagonal 73 y Calle 10 (214, hacia UTN)\n\nEstas notificaciones se enviarán de Lunes a Viernes, de 16hs a 19hs (hacia UTN) y de 20hs a 00hs (hacia La Plata). En caso de que quieras cancelar tu suscripción, envia un mensaje con el comando /stop.',
    ALREADY_SUSCRIBED:
      '¡Tranquilo, ya estás suscrito!\nSi estás en el rango horario, en unos instantes recibirás la notificación.',
  },
  STOP: {
    NOT_SUSCRIBED: 'No estás suscripto.',
    UNSUSCRIBED:
      'Has cancelado la suscripción a las notificaciones por defecto.',
  },
  INFO: 'Fuí creado para enviar notificaciones de los micros que circulan entre La Plata y la UTN Facultad Regional La Plata, y te notifico de los micros que están llegando a la/s parada/s. Las líneas configuradas por defecto son:\n\n- 202\n- 214\n\nY las paradas configuradas por defecto son:\n\n- Avenida 7 y Calle 56 (202, hacia UTN)\n- Diagonal 73 y Calle 10 (214, hacia UTN)\n- Avenida 60 y Calle 125 (202, hacia La Plata)\n\nLas notificaciones por defecto serán enviadas de Lunes a Viernes, de 16hs a 19hs (hacia UTN) y de 20hs a 00hs (hacia La Plata)\n\nEn caso de que no estés suscripto, podés hacerlo mediante el comando /start.\nSi estás suscripto y querés cancelar tu suscripción, podés hacerlo mediante el comando /stop.',
  ABOUT:
    "Este bot obtiene los datos de la página web pública 'Cuando Llega Mi Micro' y los envia mediante Telegram. El proyecto fué realizado y es mantenido por Gianluca Bredice Vivarelli. Para más información, ingresá en su página web: https://devbredicegian.vercel.app",
};
