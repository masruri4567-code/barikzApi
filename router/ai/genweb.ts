import { Request, Response } from 'express';
import axios from 'axios';

async function generateWeb(prompt: string) {
    if (!prompt) throw new Error("parameter 'prompt' diperlukan.");

    const { data } = await axios.post(
        'https://ngapainngoding.com/api/generate',
        {
            type: "website",
            prompt: prompt
        },
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:147.0) Gecko/147.0 Firefox/147.0',
                'Referer': 'https://ngapainngoding.com/#generator'
            },
            responseType: 'text'
        }
    );

    let result = data;
    if (typeof result === 'string') {
        result = result.replace(/^data:\s*/gm, '').trim();
    }

    if (!result) throw new Error("Gagal mendapatkan respon dari generator.");

    return result;
}

export default async function genWebHandler(req: Request, res: Response) {
    try {
        const text = (req.query.text || req.body.text) as string;
        
        if (!text) {
            return res.status(400).json({
                status: false,
                error: "parameter 'text' atau 'prompt' diperlukan"
            });
        }

        const result = await generateWeb(text);

        res.json({
            status: true,
            response: result
        });
    } catch (err: any) {
        res.status(500).json({
            status: false,
            error: err.message || "internal server error"
        });
    }
}