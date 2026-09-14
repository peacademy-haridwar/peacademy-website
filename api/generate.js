export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        let apiKey = process.env.GEMINI_API_KEY;

        // अगर एनवायरनमेंट वेरिएबल में डायरेक्ट की नहीं है, तो Secret Manager से कनेक्ट करने का प्रयास करें
        if (!apiKey) {
            // Google Cloud Secret Manager से सुरक्षित रूप से की प्राप्त करने का लॉजिक
            const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
            const client = new SecretManagerServiceClient();
            const name = 'projects/1024175197775/secrets/GEMINI_API_KEY/versions/latest';
            const [version] = await client.accessSecretVersion({ name });
            apiKey = version.payload.data.toString('utf8');
        }

        if (!apiKey) {
            return res.status(500).json({ error: 'API Key not configured or accessible' });
        }

        const { contents, systemInstruction } = req.body;
        const modelName = "gemini-3.8-flash";
        const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
                contents: contents,
                tools: [{ googleSearch: {} }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
