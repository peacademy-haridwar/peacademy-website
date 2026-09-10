export default async function handler(req, res) {
    // केवल POST रिक्वेस्ट की अनुमति दें
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { contents, systemInstruction } = req.body;
        const apiKey = process.env.GEMINI_API_KEY; // यह की सर्वर पर सुरक्षित रहेगी

        if (!apiKey) {
            return res.status(500).json({ error: 'API Key not configured on server' });
        }

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
