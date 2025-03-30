// calendar.gs

/**
 * Создаёт событие в Google Календаре при подтверждении брони.
 */
function createCalendarEvent(formData) {
  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) return;

  const settings = getFullConfig();

  const cIn = new Date(formData.checkin);
  const cOut = new Date(formData.checkout);

  const checkinTime = settings.config.checkin_time || '15:00';
  const checkoutTime = settings.config.checkout_time || '12:00';

  const [inHour, inMin] = checkinTime.split(':').map(Number);
  const [outHour, outMin] = checkoutTime.split(':').map(Number);

  cIn.setHours(inHour, inMin);
  cOut.setHours(outHour, outMin);

  const eventTitle = `Бронь: ${formData.name}`;
  const description = `${formData.email}, ${formData.phone}\nИтого: ${formData.fullCost} BYN`;

  cal.createEvent(eventTitle, cIn, cOut, { description });
}
