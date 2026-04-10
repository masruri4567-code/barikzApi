import { Request, Response } from 'express';
import axios from 'axios';

async function chatHubAI(text: string) {
    if (!text) throw new Error("parameter 'text' diperlukan.");

    const { data } = await axios({
        method: 'post',
        url: 'https://freeaichathub.com/chat',
        headers: {
            'authority': 'freeaichathub.com',
            'accept': '*/*',
            'content-type': 'application/json',
            'origin': 'https://freeaichathub.com',
            'referer': 'https://freeaichathub.com/',
            'user-agent': 'Mozilla/5.0 (Android 10; Mobile; rv:147.0) Gecko/147.0 Firefox/147.0'
        },
        data: {
            message: text,
            model: "gpt-3.5-turbo",
            language: "en"
        }
    });

    let result = data;
    if (typeof result === 'string') {
        try {
            result = JSON.parse(result);
        } catch (e) {

        }
    }

    if (result.choices && result.choices[0] && result.choices[0].message) {
        return result.choices[0].message.content.trim();
    } else {
        return result.message || result.reply || result.content || "Gagal mendapatkan respon.";
    }
}

export default async function chatHubHandler(req: Request, res: Response) {
    try {
        const q = (req.query.q || req.body.q) as string;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: "parameter 'q' diperlukan"
            });
        }

        const result = await chatHubAI(q);

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