import { Request, Response } from "express";
import axios from "axios";
import { URLSearchParams } from "url";

const CONFIG = {
    baseUrl: "https://data.toolbaz.com",
    origin: "https://toolbaz.com",
    referer: "https://toolbaz.com/",
    userAgent: "Mozilla/5.0 (Linux; Android 10)",
    model: "toolbaz-v4.5-fast"
};

const gRS = (length: number) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const client = axios.create({
    baseURL: CONFIG.baseUrl,
    headers: {
        Host: "data.toolbaz.com",
        "User-Agent": CONFIG.userAgent,
        Accept: "*/*",
        Origin: CONFIG.origin,
        Referer: CONFIG.referer,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest"
    }
});

function generateClientToken() {
    const payloadObj = {
        bR6wF: {
            nV5kP: CONFIG.userAgent,
            lQ9jX: "id-ID",
            sD2zR: "360x800",
            tY4hL: "Asia/Jakarta",
            pL8mC: "Linux armv8l",
            cQ3vD: 24,
            hK7jN: 8
        },
        uT4bX: { mM9wZ: [], kP8jY: [] },
        tuTcS: Math.floor(Date.now() / 1000),
        tDfxy: "null",
        RtyJt: gRS(36)
    };

    const jsonStr = JSON.stringify(payloadObj);
    const base64Str = Buffer.from(jsonStr).toString("base64");
    return gRS(6) + base64Str;
}

async function chatGrok(message: string) {
    const sessionId = gRS(40);
    const clientToken = generateClientToken();


    const tokenParams = new URLSearchParams();
    tokenParams.append("session_id", sessionId);
    tokenParams.append("token", clientToken);

    const tokenResponse = await client.post("/token.php", tokenParams);

    if (!tokenResponse.data?.success) {
        throw new Error("Gagal mendapatkan token");
    }

    const serverCapcha = tokenResponse.data.token;


    const chatParams = new URLSearchParams();
    chatParams.append("text", message);
    chatParams.append("capcha", serverCapcha);
    chatParams.append("model", CONFIG.model);
    chatParams.append("session_id", sessionId);

    const chatResponse = await client.post("/writing.php", chatParams);

    let cleanText = chatResponse.data;

    if (typeof cleanText === "string") {
        cleanText = cleanText.replace(/\[model:\s*[^\]]+\]/g, "").trim();
    }

    return cleanText;
}

export default async function grokHandler(req: Request, res: Response) {
    try {
        const q = (req.query.q || req.body.q) as string;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: "parameter 'q' diperlukan"
            });
        }

        const result = await chatGrok(q);

        if (!result) {
            return res.json({
                status: false,
                error: "Tidak ada respon."
            });
        }

        res.json({
            status: true,
            response: result
        });

    } catch (err: any) {
        console.error("GROK ERROR:", err.message);
        res.status(500).json({
            status: false,
            error: err.message || "internal server error"
        });
    }
}