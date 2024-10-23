import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import bcrypt from 'bcrypt';
import session from 'express-session';
import db from './database/database.js'; // Conexão com o banco de dados
import helmet from 'helmet';
import dotenv from 'dotenv';
import logger from 'morgan';
import http from 'http';
import pool from './db.js'; // Ajuste o caminho conforme necessário

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger('dev'));

// Configurar headers CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Desativar cache
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

// Configuração de sessões
app.use(session({
    secret: process.env.SESSION_SECRET || 'chave-secreta',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Serve arquivos estáticos
app.use(express.static(path.join(process.cwd(), 'public')));

// Middleware de autenticação
const isAuthenticated = (req, res, next) => {
    if (req.session.isAuthenticated) {
        return next();
    }
    res.redirect('/login');
};

// Rotas principais
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'login.html'));
});

app.get('/home', isAuthenticated, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'home.html'));
});



// Nova rota para o dashboard
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'dashboard.html'));
});


// Rota para lidar com dados do dashboard via POST
app.post('/dashboard', isAuthenticated, async (req, res) => {
    try {
        // Aqui você pode processar os dados recebidos do dashboard
        const { someData } = req.body; // Exemplo de como acessar dados
        // Realize operações no banco de dados ou qualquer outra lógica necessária
        // Por exemplo, você pode armazenar esses dados no banco de dados
        return res.status(200).json({ message: 'Dados recebidos com sucesso', data: someData });
    } catch (error) {
        console.error('Erro ao processar dados do dashboard:', error);
        return res.status(500).json({ message: 'Erro ao processar dados do dashboard' });
    }
});





// ------------------- CRUD para Usuários -------------------

// Criar Usuário
app.post('/api/usuarios', async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    try {
        const existingUser = await db('usuarios').where('email', email).first();
        if (existingUser) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);
        await db('usuarios').insert({ nome, email, senha: hashedPassword });
        return res.status(201).json({ message: 'Usuário criado com sucesso' });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        return res.status(500).json({ message: 'Erro ao criar usuário' });
    }
});

// Listar Usuários
app.get('/api/usuarios', async (req, res) => {
    try {
        const results = await db('usuarios').select('*');
        return res.status(200).json(results);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        return res.status(500).json({ message: 'Erro ao buscar usuários' });
    }
});

// Rota de Login
app.post('/api/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    try {
        const usuario = await db('usuarios').where({ email }).first();
        if (!usuario) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        req.session.isAuthenticated = true;
        req.session.userId = usuario.id;

        return res.status(200).json({ message: 'Login bem-sucedido' });
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        return res.status(500).json({ message: 'Erro ao realizar login' });
    }
});

// Rota de Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Erro ao realizar logout' });
        }
        res.status(200).json({ message: 'Logout realizado com sucesso' });
    });
});

// ------------------- Painel Admin -------------------

// Rota de login
app.post('/api/loggins', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    try {
        const usuario = await db('usuarios').where({ email }).first();
        if (!usuario) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        req.session.isAuthenticated = true;
        req.session.userId = usuario.id;

        return res.status(200).json({ message: 'Login bem-sucedido' });
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        return res.status(500).json({ message: 'Erro ao realizar login' });
    }
});

// ------------------- CRUD para Clientes -------------------

// ------------------- CRUD para Clientes -------------------

// Criar Cliente
app.post('/api/clientes', async (req, res) => {
    const { nome, cpf, endereco_coleta } = req.body;

    if (!nome || !cpf || !endereco_coleta) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    try {
        const existingClient = await db('clientes').where('cpf', cpf).first();
        if (existingClient) {
            return res.status(400).json({ message: 'CPF já cadastrado' });
        }

        await db('clientes').insert({ 
            nome, 
            cpf, 
            endereco_coleta 
        });
        return res.status(201).json({ message: 'Cliente criado com sucesso' });
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        return res.status(500).json({ message: 'Erro ao criar cliente' });
    }
});

// Listar Clientes
app.get('/api/clientes', async (req, res) => {
    try {
        const clientes = await db('clientes').select('*');
        return res.status(200).json(clientes);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        return res.status(500).json({ message: 'Erro ao buscar clientes' });
    }
});

// Atualizar Cliente
app.put('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, cpf, endereco_coleta } = req.body;

    if (!nome || !cpf || !endereco_coleta) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    try {
        const updatedRows = await db('clientes').where({ id }).update({ nome, cpf, endereco_coleta });
        if (updatedRows === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }
        return res.status(200).json({ message: 'Cliente atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        return res.status(500).json({ message: 'Erro ao atualizar cliente' });
    }
});

// Deletar Cliente
app.delete('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedRows = await db('clientes').where({ id }).del();
        if (deletedRows === 0) {
            return res.status(404).json({ message: 'Cliente não encontrado' });
        }
        return res.status(200).json({ message: 'Cliente excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        return res.status(500).json({ message: 'Erro ao deletar cliente' });
    }
});


// ------------------- CRUD para Entregadores (Motoboys) -------------------

// Criar Entregador
app.post('/api/entregadores', async (req, res) => {
    const { nome, cpf, email, telefone } = req.body;

    if (!nome || !cpf || !email || !telefone) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    try {
        const existingDeliverer = await db('entregadores').where('cpf', cpf).first();
        if (existingDeliverer) {
            return res.status(400).json({ message: 'CPF já cadastrado' });
        }

        await db('entregadores').insert({ 
            nome, 
            cpf, 
            email, 
            telefone 
        });
        return res.status(201).json({ message: 'Entregador criado com sucesso' });
    } catch (error) {
        console.error('Erro ao criar entregador:', error);
        return res.status(500).json({ message: 'Erro ao criar entregador' });
    }
});

// Listar Entregadores
app.get('/api/entregadores', async (req, res) => {
    try {
        const entregadores = await db('entregadores').select('*');
        return res.status(200).json(entregadores);
    } catch (error) {
        console.error('Erro ao buscar entregadores:', error);
        return res.status(500).json({ message: 'Erro ao buscar entregadores' });
    }
});

// Atualizar Entregador
app.put('/api/entregadores/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, cpf, email, telefone } = req.body;

    if (!nome || !cpf || !email || !telefone) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    try {
        const updatedRows = await db('entregadores').where({ id }).update({ nome, cpf, email, telefone });
        if (updatedRows === 0) {
            return res.status(404).json({ message: 'Entregador não encontrado' });
        }
        return res.status(200).json({ message: 'Entregador atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar entregador:', error);
        return res.status(500).json({ message: 'Erro ao atualizar entregador' });
    }
});

// Deletar Entregador
app.delete('/api/entregadores/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedRows = await db('entregadores').where({ id }).del();
        if (deletedRows === 0) {
            return res.status(404).json({ message: 'Entregador não encontrado' });
        }
        return res.status(200).json({ message: 'Entregador excluído com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar entregador:', error);
        return res.status(500).json({ message: 'Erro ao deletar entregador' });
    }
});
// Long polling para entregas pendentes
app.get('/api/entregas/long-polling/:id_entregador', async (req, res) => {
    const { id_entregador } = req.params;

    const checkForNewDeliveries = async () => {
        const entregas = await db('entregas')
            .where({ id_entregador, status: 'pendente' })
            .select('*');
        
        if (entregas.length > 0) {
            return res.json(entregas);
        }

        // Se não houver entregas, aguarde 2 segundos e verifique novamente
        setTimeout(checkForNewDeliveries, 2000);
    };

    checkForNewDeliveries();
});

// Iniciar o servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});