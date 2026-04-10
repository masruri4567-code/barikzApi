import { Request, Response } from "express";
import axios from "axios";
import crypto from "crypto";

const USER_TOKEN = "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzZWEtYXJ0IiwiYXVkIjpbImxvZ2luIl0sImV4cCI6MTc3NDU3OTcxNSwiaWF0IjoxNzY5Mzk1NzE1LCJqdGkiOiI5NTQ2ODA0MjI1MTY5MzA2MSIsInBheWxvYWQiOnsiaWQiOiJmYjdiODMwN2YxMjY5ZjI4Mzk3ZTA5NTJkNWIzZDAyOCIsImVtYWlsIjoiZnJ1YXRyZWNheTc1NkBnbWFpbC5jb20iLCJjcmVhdGVfYXQiOjE3Mjc1MDA1NTI2MjksInRva2VuX3N0YXR1cyI6MCwic3RhdHVzIjoxLCJpc3MiOiIifX0.jsb_N2EJVNkWy9CqU75NrfFUy0wf_repZKZunfuVk7v7lly0aKi3A5oeA04ItyRw8VfKG2-0KzEP833w8U_2-xB_s6PZXBWiudGJh6nN19x0nAOLVhuTTkvHU-q5u8uHh2nkntrqlqkKBozTTLrojnyWfOGtHHqv51WWYiCQynRbXA1II45hPuEN7kVYi0OWOfAD-2nvzlv_P6plPRp6zmdah6mdHrgVOMg79Js2vsS7y4nFGJlZQUaY8LNklwXEm5G8oXskrzBqw4DPLUS0L3FK6474g2X0J05bsgaVWBjAoubLRLzknAMkoLJi1RRxGzl64q7bfGWvG8atj1Su0A";

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

class SeaArtClient {
  private baseUrl = 'https://www.seaart.ai/api/v1';
  private streamUrl = 'https://www.seaart.ai/api/stream/character/session/chat_new';

  private headers(additional = {}) {
    return {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'X-Device-Id': crypto.randomUUID(),
      'X-Browser-Id': generateUUID(),
      'X-App-Id': 'phone_global_seaart',
      'X-Platform': 'phone',
      'X-Project-Id': 'seaart',
      'X-Timezone': 'Asia/Jakarta',
      'token': USER_TOKEN,
      ...additional
    };
  }

  async searchAndGetFirst(query: string) {
    const payload = { scene: "square", obj_name: query, obj_type: 9, page_size: 1, ss: 51 };
    const { data } = await axios.post(`${this.baseUrl}/square/v3/search/list`, payload, { headers: this.headers() });
    return data.data.items[0];
  }

  async getDetail(charId: string) {
    const payload = { id: charId, ss: 70 };
    const { data } = await axios.post(`${this.baseUrl}/character/detail`, payload, { headers: this.headers({ 'X-User-Id': 'guest_user_001' }) });
    return data.data;
  }

  async createSession(charId: string) {
    const payload = { character_id: charId, mask: "" };
    const { data } = await axios.post(`${this.baseUrl}/character/session/create`, payload, { headers: this.headers({ 'X-User-Id': 'guest_user_001' }) });
    return data.data.session_id;
  }

  async startChat(sessionId: string, timbreId: string) {
    const payload = { session_id: sessionId, dft_timbre_id: timbreId };
    await axios.post(`${this.baseUrl}/character/session/chat/start`, payload, { headers: this.headers({ 'X-User-Id': 'guest_user_001' }) });
  }

  async getChatResponse(sessionId: string, content: string, charName: string) {
    const payload = {
      content,
      support_voice: 1,
      model: "GPT-35-Turbo-1106",
      refer: "v1",
      stream: true,
      session_id: sessionId,
      name: charName,
      messages: [{ role: "text", content }],
      history_message: []
    };

    const response = await axios.post(this.streamUrl, payload, {
      headers: this.headers({ 'Accept': 'text/event-stream' }),
      responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
      let fullText = "";
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('data:')) {
            const jsonStr = line.replace('data: ', '').trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const msg = parsed.choices?.[0]?.message?.content;
              if (msg) fullText += msg;
            } catch (e) {}
          }
        }
      });
      response.data.on('end', () => resolve(fullText.replace(/<[^>]*>?|<[^>]*>?/gm, '')));
      response.data.on('error', reject);
    });
  }
}

export default async function seaartHandler(req: Request, res: Response) {
  const { q, text } = req.query;

  if (!q || !text) {
    return res.status(400).json({ status: false, message: "Missing params: q (char name) & text (message)" });
  }

  try {
    const client = new SeaArtClient();
    

    const char = await client.searchAndGetFirst(q as string);
    if (!char) return res.status(404).json({ status: false, message: "Karakter tidak ditemukan" });


    const details = await client.getDetail(char.id);
    const sessionId = await client.createSession(char.id);
    await client.startChat(sessionId, details.timbre_id);


    const reply = await client.getChatResponse(sessionId, text as string, details.name);

    res.status(200).json({
      status: true,
      character: details.name,
      session_id: sessionId,
      reply: reply
    });

  } catch (error: any) {
    res.status(500).json({ status: false, message: error.message });
  }
}
