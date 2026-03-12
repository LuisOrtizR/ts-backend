import Holidays from 'date-holidays'

const hd = new Holidays('CO')
console.log('CO Holidays:', hd.getHolidays(2026))

const hd2 = new Holidays('MX')
console.log('MX Holidays:', hd2.getHolidays(2026))
