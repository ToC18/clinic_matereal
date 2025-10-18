const roleTranslations = {
    admin: 'Администратор',
    head_nurse: 'Старшая медсестра',
    staff: 'Сотрудник'
};

const unitTranslations = {
    piece: 'шт',
    milliliter: 'мл',
    gram: 'г',
    pack: 'уп',
    ampoule: 'амп'
};

export const translateRole = (role) => {
    return roleTranslations[role] || role;
};

export const translateUnit = (unit) => {
    // В базе данных хранится ключ (например, "milliliter"), а не значение ("мл")
    // Эта функция будет возвращать русское название по ключу.
    for (const [key, value] of Object.entries(unitTranslations)) {
        if (key === unit) {
            return value;
        }
    }
    // Если ключ не найден, возвращаем сам ключ
    return unit;
};

// Экспортируем для использования в выпадающих списках
export const unitOptions = Object.keys(unitTranslations).map(key => ({
    value: key, // Отправляем на сервер ключ (e.g., 'milliliter')
    label: unitTranslations[key] // Показываем пользователю значение (e.g., 'мл')
}));