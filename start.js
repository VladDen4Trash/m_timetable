import TelegramBot from 'node-telegram-bot-api';
import {SQLCheckUserGroup, SQLAddUser, SQLUpdateUser} from './sql.js';
import config from './config.json';
import TT_INBO from './TT_INBO.json';

const bot = new TelegramBot(config.token, {polling: true});
const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const daysInvert = {
    'Понедельник': 1,
    'Вторник': 2,
    'Среда': 3,
    'Четверг': 4,
    'Пятница': 5,
    'Суббота': 6,
    'Воскресенье': 7
}
const groups = {
    'ИНБО': TT_INBO
}

bot.on('message', (msg) => {
    try {
        let time = new Date();
        console.log(`[${time.getSeconds()}:${time.getMinutes()}:${time.getHours()} ${time.getDate()}.${time.getMonth()}.${time.getFullYear()}] ${msg.from.username} (${msg.from.first_name} ${msg.from.last_name}) ${msg.from.id} - (T) ${msg.text}`);
        if (msg.text.startsWith(`/start`) || msg.text.startsWith(`/menu`)) {
            SQLCheckUserGroup(msg.chat.id) // Если нет в базе - добавить
            .then(res => {
                if (!res[0]) SQLAddUser(msg.chat.id).then(() => {
                    bot.sendMessage(msg.chat.id, `*Привет. Это бот с расписанием.\nВыбери действие*`, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[{text: 'Выбрать группу', callback_data: 'group'}]]
                        }
                    });
                });
                else if (res[0].userGroup === `Отсутствует`) {
                    bot.sendMessage(msg.chat.id, `*Привет. Это бот с расписанием.\nВыбери действие*`, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[{text: 'Выбрать группу', callback_data: 'group'}]]
                        }
                    });
                } else {
                    bot.sendMessage(msg.chat.id, `*Привет. Это бот с расписанием.\nВыбери действие*`, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{text: 'Выбрать день', callback_data: 'day'}],
                                [{text: 'Сегодня', callback_data: 'today'}, {text: 'Завтра', callback_data: 'tomorrow'}],
                                [{text: 'Выбрать группу', callback_data: 'group'}]
                            ]
                        }
                    });
                }
            });
        }
    } catch (e) {
        console.log(`ERROR ${e}`);
    }
});

bot.on('callback_query', (data) => {
    try {
        let time = new Date();
        console.log(`[${time.getSeconds()}:${time.getMinutes()}:${time.getHours()} ${time.getDate()}.${time.getMonth()+1}.${time.getFullYear()}] ${data.from.username} (${data.from.first_name} ${data.from.last_name}) ${data.from.id} - ${data.data}`);
        if (data.data === `menu`) {
            SQLCheckUserGroup(data.message.chat.id) // Если нет в базе - добавить
            .then(res => {
                if (!res[0]) SQLAddUser(data.message.chat.id).then(() => {
                    bot.editMessageText(`*Привет. Это бот с расписанием.\nВыбери действие*`, {
                        chat_id: data.from.id,
                        message_id: data.message.message_id,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[{text: 'Выбрать группу', callback_data: 'group'}]]
                        }
                    });
                });
                if (res[0].userGroup === `Отсутствует`) {
                    bot.editMessageText(`*Привет. Это бот с расписанием.\nВыбери действие*`, {
                        chat_id: data.from.id,
                        message_id: data.message.message_id,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[{text: 'Выбрать группу', callback_data: 'group'}]]
                        }
                    });
                } else {
                    bot.editMessageText(`*Привет. Это бот с расписанием.\nВыбери действие*`, {
                        chat_id: data.from.id,
                        message_id: data.message.message_id,
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{text: 'Выбрать день', callback_data: 'day'}],
                                [{text: 'Сегодня', callback_data: 'today'}, {text: 'Завтра', callback_data: 'tomorrow'}],
                                [{text: 'Выбрать группу', callback_data: 'group'}]
                            ]
                        }
                    });
                }
            });
        }

        if (data.data === `today`) {
            let week = Math.floor((Date.now()-1612731600000)/1000/60/60/24/7) + 1;
            let day = Math.floor((Date.now()-1612731600000)/1000/60/60/24%7) + 1;
            if (day === 7) day = 0;
            SQLCheckUserGroup(data.message.chat.id) // Получение группы
            .then(group => printTable(group[0].userGroup, week, day) // Создание расписания
            .then(msg => { // Вывод
                bot.editMessageText(msg, {
                    chat_id: data.from.id,
                    message_id: data.message.message_id,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{text: '<<', callback_data: 'go_backweek'}, {text: '<', callback_data: 'go_backday'},
                             {text: '>', callback_data: 'go_forwardday'}, {text: '>>', callback_data: 'go_forwardweek'}],
                            [{text: 'Назад', callback_data: 'menu'}]
                        ]
                    }
                })
            }));
        }

        else if (data.data === `tomorrow`) {
            let week = Math.floor((Date.now()-1612731600000)/1000/60/60/24/7) + 1;
            let day = Math.floor((Date.now()-1612731600000)/1000/60/60/24%7) + 2;
            if (day === 7) day = 0;
            else if (day === 8) { week++; day = 1}
            console.log(day);
            SQLCheckUserGroup(data.message.chat.id) // Получение группы
            .then(group => printTable(group[0].userGroup, week, day) // Создание расписания
            .then(msg => { // Вывод
                bot.editMessageText(msg, {
                    chat_id: data.from.id,
                    message_id: data.message.message_id,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{text: '<<', callback_data: 'go_backweek'}, {text: '<', callback_data: 'go_backday'},
                             {text: '>', callback_data: 'go_forwardday'}, {text: '>>', callback_data: 'go_forwardweek'}],
                            [{text: 'Назад', callback_data: 'menu'}]
                        ]
                    }
                })
            }));
        }

        else if (data.data.startsWith(`go_`)) {
            let group = data.message.text.match(/\D\D\D\D-\d\d-\d\d/)[0];
            let week = data.message.text.match(/Неделя: \d?\d/)[0].match(/\d?\d/)[0];
            let day = daysInvert[data.message.text.match(/День: .+/)[0].match(/ .+/)[0].slice(1)];
            if (data.data === 'go_backweek') {
                if (week < 2) week = 16;
                else week--;
            } else if (data.data === 'go_backday') {
                if (day < 2) { day = 7; week-- }
                else day--;
            } else if (data.data === 'go_forwardday') {
                if (day > 6) { day = 1; week++ }
                else day++;
            } else if (data.data === 'go_forwardweek') {
                if (week > 15) week = 1;
                else week++;
            }

            printTable(group, week, day%7) // Создание расписания
            .then(msg => { // Вывод
                bot.editMessageText(msg, {
                    chat_id: data.from.id,
                    message_id: data.message.message_id,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{text: '<<', callback_data: 'go_backweek'}, {text: '<', callback_data: 'go_backday'},
                             {text: '>', callback_data: 'go_forwardday'}, {text: '>>', callback_data: 'go_forwardweek'}],
                            [{text: 'Назад', callback_data: 'menu'}]
                        ]
                    }
                })
            })
        }

        else if (data.data === `day`) {
            bot.editMessageText(`*Выбери неделю*`, {
                chat_id: data.from.id,
                message_id: data.message.message_id,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{text: '1', callback_data: 'w1'}, {text: '2', callback_data: 'w2'},
                         {text: '3', callback_data: 'w3'}, {text: '4', callback_data: 'w4'},
                         {text: '5', callback_data: 'w5'}, {text: '6', callback_data: 'w6'},
                         {text: '7', callback_data: 'w7'}, {text: '8', callback_data: 'w8'}],
                        [{text: '9', callback_data: 'w9'}, {text: '10', callback_data: 'w10'},
                         {text: '11', callback_data: 'w11'}, {text: '12', callback_data: 'w12'},
                         {text: '13', callback_data: 'w13'}, {text: '14', callback_data: 'w14'},
                         {text: '15', callback_data: 'w15'}, {text: '16', callback_data: 'w16'}],
                        [{text: 'Назад', callback_data: 'menu'}]
                    ]
                }
            });
        }

        else if (data.data.startsWith(`w`)) for (let i = 1; i < 17; i++) {
            if (data.data === `w${i}`) bot.editMessageText(`*Неделя: ${i}*\n*Выбери день недели*`, {
                chat_id: data.from.id,
                message_id: data.message.message_id,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'пн', callback_data: `d1_${i}`}, {text: 'вт', callback_data: `d2_${i}`},
                         {text: 'ср', callback_data: `d3_${i}`}, {text: 'чт', callback_data: `d4_${i}`},
                         {text: 'пт', callback_data: `d5_${i}`}, {text: 'сб', callback_data: `d6_${i}`}],
                        [{text: 'Назад', callback_data: 'menu'}]
                    ]
                }
            });
        }

        else if (data.data.startsWith(`d`)) for (let i = 1; i < 7; i++) {
            if (data.data.startsWith(`d${i}_`)) SQLCheckUserGroup(data.message.chat.id) // Получение группы
            .then(group => printTable(group[0].userGroup, data.data.substr(3, 2), i) // Создание расписания
            .then(msg => { // Вывод
                bot.editMessageText(msg, {
                    chat_id: data.from.id,
                    message_id: data.message.message_id,
                    parse_mode : "Markdown",
                    reply_markup: {
                        inline_keyboard: [
                            [{text: '<<', callback_data: 'go_backweek'}, {text: '<', callback_data: 'go_backday'},
                             {text: '>', callback_data: 'go_forwardday'}, {text: '>>', callback_data: 'go_forwardweek'}],
                            [{text: 'Назад', callback_data: 'menu'}]
                        ]
                    }
                })
            }));
        }

        else if (data.data === `group`) {
            SQLCheckUserGroup(data.message.chat.id)
            .then(res => {
                bot.editMessageText(`*Твоя группа: ${res[0].userGroup}*\n*Меняем?*`, {
                    chat_id: data.from.id,
                    message_id: data.message.message_id,
                    parse_mode : "Markdown",
                    reply_markup: {
                        inline_keyboard: [
                            [{text: 'Меняем!', callback_data: 'setgroup'}],
                            [{text: 'Назад', callback_data: 'menu'}]
                        ]
                    }
                })
            })
        }

        else if (data.data === `setgroup`) {
            bot.editMessageText(`*Выбери наименование*`, {
                chat_id: data.from.id,
                message_id: data.message.message_id,
                parse_mode : "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{text: 'ИНБО', callback_data: 'sg_ИНБО'}],
                        [{text: 'Назад', callback_data: 'menu'}]
                    ]
                }
            })
        }

        else if (data.data.match(/sg_\D\D\D\D_\d\d_\d\d/)) {
            let groupName = data.data.substr(3, 4);
            let groupNumber = data.data.substr(8, 2);
            let groupYear = data.data.substr(11, 2);
            SQLUpdateUser(data.from.id, `${groupName}-${groupNumber}-${groupYear}`)
            .then(() => {
                bot.editMessageText(`*Группа изменена на ${groupName}-${groupNumber}-${groupYear}*`, {
                    chat_id: data.from.id,
                    message_id: data.message.message_id,
                    parse_mode : "Markdown",
                    reply_markup: {
                        inline_keyboard: [[{text: 'Меню', callback_data: 'menu'}]]
                    }
                })
            })
        }

        else if (data.data.match(/sg_\D\D\D\D_\d\d/)) {
            let groupName = data.data.substr(3, 4);
            let groupNumber = data.data.substr(8, 2);
            bot.editMessageText(`*Наименование: ${groupName}*\n*Номер: ${groupNumber}*\n*Выбери год поступления*`, {
                chat_id: data.from.id,
                message_id: data.message.message_id,
                parse_mode : "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{text: '20', callback_data: `sg_${groupName}_${groupNumber}_20`}],
                        [{text: 'Назад', callback_data: 'menu'}]
                    ]
                }
            })
        }

        else if (data.data.match(/sg_\D\D\D\D/)) {
            let groupName = data.data.substr(3, 4);
            bot.editMessageText(`*Наименование: ${groupName}*\n*Выбери номер группы*`, {
                chat_id: data.from.id,
                message_id: data.message.message_id,
                parse_mode : "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [{text: '01', callback_data: `sg_${groupName}_01`},
                         {text: '03', callback_data: `sg_${groupName}_03`}],
                        [{text: 'Назад', callback_data: 'menu'}]
                    ]
                }
            })
        }
    } catch (e) {
        console.log(`ERROR ${e}`);
    }

})

async function printTable(group, week, day) {
    return new Promise((resolve, reject) => {
        try {
            if (group === `Отсутствует`) {
                resolve(`*Сначала выбери группу!*`);
            }

            let table = []; // Массив для сборки
            let sendMsg = `*Группа: ${group}*\n*Неделя: ${week}*\n*День: ${days[day]}*\n\n`; // Текст для отправки
            let parity = ''; // Четность недели

            if (week % 2 === 0) parity = 'even'; // Определение четности недели
            else parity = 'odd';

            if (groups[group.substr(0, 4)][group.substr(5, 5)][parity][day]) for (let i = 0; i < 6; i++) { // Сборка расписания из основного расписания
                table[i] = groups[group.substr(0, 4)][group.substr(5, 5)][parity][day][i];
            }

            if (table.length === 0) {
                sendMsg += `*Выходной!* 🎉`;
            }
            else for (let i = 0; i < 6; i++) { // Преобразование массива в текст
                sendMsg += `*${i+1}* - ${table[i]}\n`;
            }

            resolve(sendMsg);
        } catch (e) {
            console.log(`ERROR ${e}`);
        }
    });
}
