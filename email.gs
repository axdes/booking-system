// email.gs

/**
 * Отправляет гостю письмо с подтверждением брони.
 */
function sendEmailConfirmation(formData) {
  const settings = getFullConfig();
  const checkin = formatDatePretty(formData.checkin);
  const checkout = formatDatePretty(formData.checkout);
  const subject = `Подтверждение брони: ${checkin} – ${checkout}`;
  const total = formData.fullCost || 0;

  const msg = `
Здравствуйте, ${formData.name}!

Ваша бронь с ${checkin} по ${checkout} подтверждена. Спасибо за доверие!

💳 Общая стоимость: ${total} BYN  
✅ Предоплата: ${formData.prepayment} BYN  
📍 Заезд: ${settings.config.checkin_time || '15:00'}  
🚪 Выезд: ${settings.config.checkout_time || '12:00'}

Если у вас есть пожелания — смело пишите в ответ на это письмо.

До скорой встречи!
  `;

  MailApp.sendEmail({
    to: formData.email,
    subject,
    htmlBody: msg.replace(/\n/g, '<br>')
  });
}

/**
 * Создаёт триггеры напоминаний: за 7 дней, за 1 день, после отдыха.
 */
function createReminders(formData) {
  const props = PropertiesService.getScriptProperties();
  const calendarId = CALENDAR_ID;
  const email = formData.email;
  const name = formData.name;
  const checkinDate = new Date(formData.checkin);
  const checkoutDate = new Date(formData.checkout);

  const idPrefix = Utilities.getUuid().substring(0, 8); // уникальный ID группы

  // Напоминание за 7 дней
  const remind7 = new Date(checkinDate);
  remind7.setDate(remind7.getDate() - 7);
  remind7.setHours(9, 0);

  ScriptApp.newTrigger('sendReminder7Days')
    .timeBased()
    .at(remind7)
    .create();

  // Напоминание за 1 день
  const remind1 = new Date(checkinDate);
  remind1.setDate(remind1.getDate() - 1);
  remind1.setHours(15, 0);

  ScriptApp.newTrigger('sendReminder1Day')
    .timeBased()
    .at(remind1)
    .create();

  // Письмо после отдыха
  const after = new Date(checkoutDate);
  after.setDate(after.getDate() + 1);
  after.setHours(10, 0);

  ScriptApp.newTrigger('sendAfterStayEmail')
    .timeBased()
    .at(after)
    .create();

  // Сохраняем данные для напоминаний
  const key = `reminder_${idPrefix}`;
  props.setProperty(key, JSON.stringify({ email, name, checkin: formData.checkin }));
}

/**
 * Обработчик: Напоминание за 7 дней
 */
function sendReminder7Days() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  for (let key in all) {
    if (key.startsWith('reminder_')) {
      const data = JSON.parse(all[key]);
      const subject = '🔔 Напоминание: Ваша поездка через 7 дней';
      const msg = `
Здравствуйте, ${data.name}!

Напоминаем: ваша поездка в домик начнётся через 7 дней — ${formatDatePretty(data.checkin)}.

До встречи!
      `;
      MailApp.sendEmail({
        to: data.email,
        subject,
        htmlBody: msg.replace(/\n/g, '<br>')
      });
      props.deleteProperty(key);
      break;
    }
  }
}

/**
 * Обработчик: За 1 день
 */
function sendReminder1Day() {
  // (можно скопировать логику выше и подставить текст для напоминания за 1 день)
}

/**
 * Обработчик: После отдыха
 */
function sendAfterStayEmail() {
  // (аналогично — благодарность + ссылка на Instagram/отзыв)
}
