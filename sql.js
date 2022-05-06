import mysql from 'mysql2';

const mysqlconfig = {
    host: '192.168.0.101',
    user: 'mirea_bot',
    password: 'uhbertbSwGRm2yt7',
    database: 'm_timetable',
}

/**
 * Return user group
 * @param {String} userId User ID
 */
 async function SQLCheckUserGroup(userId) {
    return new Promise((resolve, reject) => {
        var conn = mysql.createConnection(mysqlconfig);
        var query = `select \`userGroup\` from \`groups\` where \`userId\` = ${userId}`;
        conn.query(query, (error, results) => {
            if (error) {
                reject(error);
                conn.end()
                return 0;
            } else {
                resolve(results);
                conn.end()
                return 0;
            };
        });
    });
};

/**
 * Insert user into database
 * @param {String} userId User ID
 */
async function SQLAddUser(userId) {
    var conn = mysql.createConnection(mysqlconfig);
	var query = `insert into \`groups\` (\`userId\`, \`userGroup\`) values ('${userId}', 'Отсутствует')`;
    conn.query(query, (error, results) => {
        if (error) console.log(error);
        conn.end();
    });
}

/**
 * Update user information in the database
 * @param {String} userId Table name
 * @param {String} newGroup Search key name
 */
async function SQLUpdateUser(userId, newGroup) {
    var conn = mysql.createConnection(mysqlconfig);
	var query = `update \`groups\` set \`userGroup\` = '${newGroup}' where userId = '${userId}'`;
    conn.query(query, (error, results) => {
        if (error) console.log(error);
        conn.end();
    });
}

export {SQLCheckUserGroup, SQLAddUser, SQLUpdateUser};
