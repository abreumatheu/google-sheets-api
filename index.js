require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const axios = require('axios');


// Logs para verificar se as variáveis de ambiente estão corretas
console.log('CLIENT_EMAIL:', process.env.CLIENT_EMAIL);
console.log('PRIVATE_KEY:', process.env.PRIVATE_KEY ? 'Loaded' : 'Missing');
console.log('SHEET_ID:', process.env.SHEET_ID);
console.log('API_ENDPOINT:', process.env.API_ENDPOINT);

// Função para autenticar e obter o objeto GoogleSpreadsheet
async function getDoc() {
    const clientEmail = process.env.CLIENT_EMAIL;
    const privateKey = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.replace(/\\n/g, '\n') : null;
    const sheetId = process.env.SHEET_ID;

    if (!clientEmail || !privateKey || !sheetId) {
        throw new Error('Missing required environment variables');
    }

    const serviceAccountAuth = new JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    return doc;
}

// Função para ler uma planilha específica e retornar uma lista de objetos de usuário
async function readWorkSheet() {
    const doc = await getDoc();
    await doc.loadInfo(); // Carrega informações do documento
    const sheet = doc.sheetsByIndex[0]; // Lê a primeira planilha
    const rows = await sheet.getRows();
    return rows.map(row => {
        return {
            nome: row.Nome,
            idade: row.Idade,
            email: row.Email
        };
    });
}

// Função para adicionar um usuário na API
async function addUser(data) {
    try {
        const response = await axios.post(process.env.API_ENDPOINT, data, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error adding user:', error);
        throw error;
    }
}

// Função principal para unir todas as funções e processar os dados
async function processSheetData() {
    try {
        const users = await readWorkSheet();
        console.log('Users fetched from sheet:', users);
        for (const user of users) {
            const response = await addUser(user);
            console.log('User added:', response);
        }
        console.log('Process completed successfully.');
    } catch (error) {
        console.error('Error processing sheet data:', error);
    }
}

processSheetData();
