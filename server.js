const express = require('express');
const axios = require('axios');
const { Octokit } = require('@octokit/rest');

const app = express();
app.use(express.json());

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

// Ganti dengan username GitHub Anda
const GITHUB_USER = 'NandangGaming';
const GITHUB_REPO = 'trading-logs';

app.post('/webhook', async (req, res) => {
    try {
        const signal = req.body;
        console.log("Signal diterima:", signal);

        // Panggil DeepSeek API
        const aiResponse = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "Kamu adalah analis trading. Analisis sinyal berikut dan berikan rekomendasi singkat dalam bahasa Indonesia."
                    },
                    {
                        role: "user",
                        content: JSON.stringify(signal)
                    }
                ],
                max_tokens: 200
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.DEEPSEEK_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const analysis = aiResponse.data.choices[0].message.content;
        console.log("Analisis AI:", analysis);

        // Simpan ke GitHub sebagai Issue
        await octokit.issues.create({
            owner: GITHUB_USER,
            repo: GITHUB_REPO,
            title: `Signal ${signal.symbol || 'Unknown'} - ${signal.action || 'Unknown'}`,
            body: `
## Data Sinyal

\`\`\`json
${JSON.stringify(signal, null, 2)}
\`\`\`

## Analisis AI

${analysis}
`
        });

        console.log("Issue GitHub berhasil dibuat");
        res.status(200).send("OK");

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).send(error.response?.data || error.message);
    }
});

app.get('/', (req, res) => {
    res.send('Server DeepSeek-AI berjalan!');
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
});
