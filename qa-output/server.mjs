process.env.DOTENV_CONFIG_PATH='__qa_no_env__';
Object.assign(process.env,{DB_HOST:'127.0.0.1',DB_PORT:'13316',DB_USER:'root',DB_PASSWORD:'',DB_NAME:'clubos',PORT:'14091',JWT_ACCESS_SECRET:'qa-access-012345678901234567890123456789',JWT_REFRESH_SECRET:'qa-refresh-012345678901234567890123456789'});
await import('../ClubOS/backend/src/server.js');
