// Создаёт напоминания: за 7 дней, за 1 день до заезда и 1 день после выезда
function createReminders(data) {
  const checkin = new Date(data.checkin);
  const offsets = [7, 1, -1]; // Кол-во дней до (или после) заезда

  offsets.forEach(offset => {
    const reminderDate = new Date(checkin);
    reminderDate.setDate(reminderDate.getDate() - offset);

    // Не создаём напоминания, если дата уже в прошлом
    if (reminderDate <= new Date()) return;

    const key = Utilities.formatDate(reminderDate, Session.getScriptTimeZone(), 'yyyy-MM-dd') +
                '_' + data.email + '_' + offset;

    const message = offset > 0
      ? `До заезда осталось ${offset} дней!`
      : 'Спасибо за отдых! Надеемся, вам всё понравилось.';

    // Сохраняем напоминание в Properties
    PropertiesService.getScriptProperties().setProperty(
      key,
      JSON.stringify({
        email: data.email,
        name: data.name,
        message
      })
    );

    // Создаём триггер отправки на нужную дату
    try {
      ScriptApp.newTrigger('sendReminder')
        .timeBased()
        .at(reminderDate)
        .create();
    } catch (e) {
      console.error('Ошибка создания триггера:', e);
    }
  });
}

// Отправляет напоминания, если сегодня наступила дата одного из них
function sendReminder() {
  const now = new Date();
  const today = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const props = PropertiesService.getScriptProperties().getProperties();

  Object.keys(props).forEach(key => {
    if (key.startsWith(today)) {
      try {
        const info = JSON.parse(props[key]);
        MailApp.sendEmail(
          info.email,
          'Напоминание о бронировании Kvetka House',
          `Здравствуйте, ${info.name}!\n\n${info.message}\n\nХорошего дня!\nКоманда Kvetka`
        );
        PropertiesService.getScriptProperties().deleteProperty(key);
      } catch (e) {
        console.error(`Ошибка отправки напоминания для ключа ${key}:`, e);
      }
    }
  });
}
