import { Request, Response } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid";

class ChatEspanyolBot {
    baseUrl = "https://chatespanolaigratis.com/en/";
    ajaxUrl = "https://chatespanolaigratis.com/wp-admin/admin-ajax.php";

    config: {
        nonce: string | null;
        botId: string | null;
        postId: string | null;
    } = {
        nonce: null,
        botId: null,
        postId: null
    };

    headers = {
        "User-Agent": "Mozilla/5.0",
        "Referer": this.baseUrl,
        "Origin": "https://chatespanolaigratis.com",
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    };

    async refreshTokens() {
        const { data } = await axios.get(this.baseUrl, {
            headers: { "User-Agent": this.headers["User-Agent"] }
        });

        const $ = cheerio.load(data);
        const container = $('div[id^="aipkit_chat_container_"]');

        if (!container.length)
            throw new Error("Container chat tidak ditemukan");

        const configString = container.attr("data-config");
        if (!configString)
            throw new Error("data-config kosong");

        const parsed = JSON.parse(configString);

        this.config.nonce = parsed.nonce;
        this.config.botId = parsed.botId;
        this.config.postId = parsed.postId;
    }

    async sendMessage(message: string) {
        if (!this.config.nonce) {
            await this.refreshTokens();
        }

        const payload = new URLSearchParams();
        payload.append("action", "aipkit_frontend_chat_message");
        payload.append("_ajax_nonce", this.config.nonce as string);
        payload.append("bot_id", this.config.botId as string);
        payload.append("post_id", this.config.postId as string);
        payload.append("message", message);
        payload.append("session_id", uuidv4());
        payload.append("conversation_uuid", uuidv4());

        try {
            const { data } = await axios.post(
                this.ajaxUrl,
                payload.toString(),
                { headers: this.headers }
            );

            if (!data || data.success === false || data === 0) {
                throw new Error("Invalid token / WordPress error");
            }

            let raw = data.data?.reply || data.data?.response || "";
            return raw.replace(/<[^>]*>?/gm, "").trim();

        } catch (err) {
            this.config.nonce = null;
            await this.refreshTokens();

            const { data } = await axios.post(
                this.ajaxUrl,
                payload.toString(),
                { headers: this.headers }
            );

            let raw = data.data?.reply || data.data?.response || "";
            return raw.replace(/<[^>]*>?/gm, "").trim();
        }
    }
}

const espBot = new ChatEspanyolBot();

export default async function espHandler(req: Request, res: Response) {
    try {
        const q = (req.query.q || req.body.q) as string;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: "parameter 'q' diperlukan"
            });
        }

        const result = await espBot.sendMessage(q);

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
        res.status(500).json({
            status: false,
            error: err.message || "internal server error"
        });
    }
}