import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const knexConfig = {
  development: {
    client: 'mysql', // Ou 'mysql2', dependendo do pacote que você instalou
    connection: {
      host: 'localhost', // Substitua pelo seu host
      user: 'root', // Substitua pelo seu usuário do MySQL
      password: '748512g#G', // Substitua pela sua senha do MySQL
      database: 'aalevar_sql' // Substitua pelo nome do seu banco de dados
    },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
    },
    seeds: {
      directory: path.join(__dirname, 'seeds'),
    },
  },
  production: {
    client: 'mysql',
    connection: {
      host: 'localhost',
      user: 'root',
      password: '748512g#G',
      database: 'aalevar_sql'
    },
    migrations: {
      directory: path.join(__dirname, 'migrations'),
    },
    seeds: {
      directory: path.join(__dirname, 'seeds'),
    },
  }
};




export default knexConfig;