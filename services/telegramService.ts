
import { ServiceOrder, Car, Master, OrderDetail, Service } from '../types';

export const sendOrderNotification = async (
  botToken: string,
  master: Master,
  order: ServiceOrder,
  car: Car,
  details: (OrderDetail & { serviceName: string })[],
  schematicUrl?: string
): Promise<boolean> => {
  if (!botToken || !master.telegramChatId) return false;

  const dateStr = new Date(order.date).toLocaleDateString('uk-UA');
  const servicesList = details.map(d => `• ${d.serviceName} (${d.quantity} шт.)`).join('\n');
  
  const text = `
🛠 *НОВЕ ЗАВДАННЯ ДЛЯ МАЙСТРА*

👤 *Майстер:* ${master.name}
🚗 *Авто:* ${car.make} ${car.model}
🔢 *Держ. номер:* ${car.licensePlate}
📅 *Дата:* ${dateStr} о ${order.time}
📍 *Пробіг:* ${order.mileage ? order.mileage + ' км' : 'не вказано'}

📝 *Причина:* ${order.reason}

📋 *Перелік робіт:*
${servicesList}

🔗 *ID Замовлення:* #${order.orderID}
  `.trim();

  try {
    const baseUrl = `https://api.telegram.org/bot${botToken}`;
    let endpoint = `${baseUrl}/sendMessage`;
    let body: any = {
      chat_id: master.telegramChatId,
      parse_mode: 'Markdown',
    };

    if (schematicUrl) {
      endpoint = `${baseUrl}/sendPhoto`;
      body.photo = schematicUrl;
      body.caption = text;
    } else {
      body.text = text;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return response.ok;
  } catch (error) {
    console.error("Telegram Send Error:", error);
    return false;
  }
};
