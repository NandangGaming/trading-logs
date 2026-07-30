const express = require('express');
const axios = require('axios');
const { Octokit } = require('@octokit/rest');

const app = express();
app.use(express.json());

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Fungsi panggil DeepSeek
async function callDeepSeek(messages) {
    const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
            model: "deepseek-chat",
            messages: messages,
            max_tokens: 200
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );
    return response.data.choices[0].message.content;
}

app.post('/webhook', async (req, res) => {
    try {
        const signal = req.body;
        console.log("Signal diterima:", signal);

        // Analisis dengan DeepSeek
        const analysis = await callDeepSeek([
            { role: "system", content: "Kamu adalah analis trading. Analisis sinyal berikut dan berikan rekomendasi singkat." },
            { role: "user", content: JSON.stringify(signal) }
        ]);

        console.log("Analisis AI:", analysis);

        // Simpan ke GitHub
        await octokit.issues.create({
            owner: 'NAMA_PENGGUNA_GITHUB_ANDA',
            repo: 'trading-logs',
            title: `Signal signal.symbol−{signal.symbol} -signal.symbol−{signal.action}`,
            body: `**Data Sinyal:**\nJSON.stringify(signal,null,2)\n\n∗∗AnalisisAI(DeepSeek):∗∗\n{JSON.stringify(signal, null, 2)}\n\n**Analisis AI (DeepSeek):**\nJSON.stringify(signal,null,2)\n\n∗∗AnalisisAI(DeepSeek):∗∗\n{analysis}`
        });

        res.status(200).send("OK");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error: " + error.message);
    }
});

app.get('/', (req, res) => {
    res.send('Server DeepSeek-AI berjalan!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server berjalan di port ${port}`));
