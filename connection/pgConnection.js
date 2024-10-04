const { Client } = require("pg");
function getClient() {
  return new Client({
    user: "root",
    password: process.env.PG_PASS,
    host: process.env.PG_HOST,
    port: "5432",
    database: "risk",
  });
}

async function query(sql, params) {
  let client = getClient();
  await client.connect();
  const res = (await client.query(sql, params)).rows;
  await client.end();
  return res;
}

async function update(sql, params) {
  let client = getClient();
  await client.connect();
  const res = await client.query(sql, params);
  await client.end();
  return res;
}

async function getUnregisterdUser() {
  return query(
    `SELECT bm.*, p.proxy FROM blockmesh as bm LEFT JOIN proxies as p ON bm.proxy_id = p.id WHERE bm.status='active' AND is_created is null  AND p.id <= 300 ORDER BY id ASC LIMIT 100;`
  );
}

async function updateUser(user) {
  return update(
    `UPDATE blockmesh SET updated_at = now(), is_created = true WHERE "user" = $1`,
    [user]
  );
}

async function updateConnectionStatus(id, isConnected) {
  return update(
    `UPDATE blockmesh SET is_connected = $2, updated_at = now() WHERE id = $1;`,
    [id, isConnected]
  );
}

async function getUsers(user, offset = 0, limit = process.env.LIMIT || 5) {
  return query(
    `SELECT bm.*, p.proxy FROM blockmesh as bm LEFT JOIN proxies as p ON bm.proxy_id = p.id WHERE "user" = $1 AND bm.status='active' ORDER BY id ASC LIMIT ${limit} OFFSET ${offset};`,
    [user]
  );
}
module.exports = {
  getUnregisterdUser,
  updateUser,
  getUsers,
  updateConnectionStatus,
};
