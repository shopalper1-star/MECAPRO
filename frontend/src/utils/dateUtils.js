export const isWeekend = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDay();
    return day === 0 || day === 6;
};

export const getNextWeekday = (dateString) => {
    const date = new Date(dateString);
    while (date.getDay() === 0 || date.getDay() === 6) {
        date.setDate(date.getDate() + 1);
    }
    return date.toISOString().split('T')[0];
};
