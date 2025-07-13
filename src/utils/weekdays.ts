const WEEKDAYS = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  domingo: 0,
  todos: 8,
};

export const convertWeekdaysStringsToNumbers = (weekdays: string[]) => {
  if (weekdays[0] === 'todos') return [1, 2, 3, 4, 5, 6, 7];

  return weekdays.map((day) => {
    return WEEKDAYS[
      day
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
    ] as number;
  });
};

export const isValidWeekdays = (text: string) => {
  const splittedText = text.split(',').map((day) =>
    day
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''),
  );
  const validWeekdays = Object.keys(WEEKDAYS);

  return splittedText.every((day) => validWeekdays.includes(day));
};
