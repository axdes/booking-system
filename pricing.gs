// pricing.gs
/**
 * Возвращает базовую цену за день в зависимости от дня недели.
 */
function getBasePriceByDate(date, plan, settings) {
  const day = date.getDay(); // 0 — вс, 1 — пн, ..., 6 — сб

  let price = 0;

  if ([1, 2, 3, 4].includes(day)) price = settings.prices.weekday_price || 0;
  else if (day === 5) price = settings.prices.friday_price || 0;
  else if (day === 6) price = settings.prices.saturday_price || 0;
  else price = settings.prices.sunday_price || 0;

  if (plan === 'max') {
    price += 100;
  } else if (plan === 'custom') {
    price -= settings.config.custom_discount || 0;
  }

  return Math.max(price, 0);
}

/**
 * Расчёт общей стоимости по диапазону дат (используется на шаге 1).
 */
function getPreliminaryCost(plan, startDate, endDate) {
  const settings = getFullConfig();
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  let total = 0;

  while (start < end) {
    const day = new Date(start);
    total += getBasePriceByDate(day, plan, settings);
    start.setDate(start.getDate() + 1);
  }

  return {
    total,
    prepayment: Math.round(total * 0.3)
  };
}

/**
 * Расчёт по дням с учётом выбранных опций (используется на шаге 2).
 */
function getCostBreakdownDaily(plan, daySelections, adults, kids, babies, babyBed, pets) {
  const settings = getFullConfig();
  const breakdown = {
    total: 0,
    lines: []
  };

  let total = 0;
  const lines = [];

  // Основная цена по дням
  daySelections.forEach(dayObj => {
    const date = new Date(dayObj.date + 'T12:00:00');
    let dayCost = getBasePriceByDate(date, plan, settings);

    // Опции на день
    dayObj.chosen.forEach(optId => {
      const opt = settings.options.find(o => o.id === optId);
      if (opt) dayCost += opt.price;
    });

    lines.push({ label: `📅 ${dayObj.date}`, cost: `${dayCost} BYN` });
    total += dayCost;
  });

  // Дополнительные гости
  if (kids > 0) {
    const cost = kids * (settings.config.kid_price || 0);
    lines.push({ label: `👧 Дети`, cost: `${cost} BYN` });
    total += cost;
  }

  if (pets > 0) {
    const cost = pets * (settings.config.pet_price || 0);
    lines.push({ label: `🐾 Животные`, cost: `${cost} BYN` });
    total += cost;
  }

  if (settings.config.extra_guest_price) {
    const baseGuests = settings.config.baseGuests || 2;
    const extraGuests = Math.max(0, adults - baseGuests);
    if (extraGuests > 0) {
      const cost = extraGuests * settings.config.extra_guest_price;
      lines.push({ label: `👤 Доп. взрослые`, cost: `${cost} BYN` });
      total += cost;
    }
  }

  if (babyBed) {
    const cost = settings.config.baby_bed_price || 0;
    lines.push({ label: `🛏 Детская кроватка`, cost: `${cost} BYN` });
    total += cost;
  }

  breakdown.total = total;
  breakdown.lines = lines;

  return breakdown;
}
