function getCostBreakdownDaily(
  plan,
  daySelections,
  adults,
  kids,
  babies,
  babyBed,
  pets
) {
  const cfg = getFullConfig(); // Конфигурация с ценами
  const options = getOptions(); // Все доступные опции
  const rules = getGuestRules(); // Правила расчёта за гостей
  const included = getIncludedItems(); // Опции, входящие в MAX-план

  // Быстрый доступ к опциям по ID
  const map = {};
  options.forEach(o => map[o.id] = o);

  let lines = [];   // Для детализации расчёта
  let total = 0;    // Общая сумма
  let nights = daySelections.length;

  daySelections.forEach(dsObj => {
    const dateStr = dsObj.date;
    const chosen = dsObj.chosen || [];

    const date = new Date(dateStr + 'T12:00:00');
    const weekday = date.getDay(); // 0 = Sunday, 6 = Saturday

    // === Базовая цена за дом ===
    let base = 0;
    if ([1, 2, 3, 4].includes(weekday)) base = cfg.weekday_price;
    else if (weekday === 5) base = cfg.friday_price;
    else if (weekday === 6) base = cfg.saturday_price;
    else base = cfg.sunday_price;

    if (plan === 'max') {
      base += 100;
    } else if (plan === 'custom') {
      base -= (cfg.custom_discount || 0);
      if (base < 0) base = 0;
    }

    let dayCost = base;

    // Добавляем строки в breakdown
    lines.push({ label: `День ${dateStr}`, cost: 0 });
    lines.push({ label: 'Дом', cost: base });

    // === Доплата за гостей ===
    let guestAdd = 0;

    if (adults > rules.baseGuests) {
      const extra = adults - rules.baseGuests;
      const cost = extra * rules.extraAdultPrice;
      guestAdd += cost;
      lines.push({ label: `Доп. взрослые x${extra}`, cost });
    }

    if (kids > 0) {
      const cost = kids * rules.kidPrice;
      guestAdd += cost;
      lines.push({ label: `Дети x${kids}`, cost });
    }

    if (babies > 0 && babyBed) {
      const cost = rules.babyBedPrice;
      guestAdd += cost;
      lines.push({ label: 'Кроватка', cost });
    }

    if (pets > 0) {
      const cost = pets * rules.petPrice;
      guestAdd += cost;
      lines.push({ label: `Животные x${pets}`, cost });
    }

    dayCost += guestAdd;

    // === Опции дня ===
    chosen.forEach(optId => {
      const op = map[optId];
      if (!op) return;

      let label = op.title;
      let cost = op.price;

      if (plan === 'max' && included.includes(optId)) {
        cost = 0;
        label += ' (MAX)';
      } else if (plan === 'relax' && ['banya', 'chan', 'bath_broom'].includes(optId)) {
        cost = 0;
        label += ' (RELAX)';
      }

      lines.push({ label, cost });
      dayCost += cost;
    });

    lines.push({ label: `Итого за ${dateStr}`, cost: dayCost });
    total += dayCost;
  });

  return { nights, lines, total };
}
function getIncludedItems() {
  return [
    'banya', 'chan', 'sup', 'boat',
    'firewood_grill', 'firewood_bowl', 'bath_broom'
  ];
}
