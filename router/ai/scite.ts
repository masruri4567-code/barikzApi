import { Request, Response } from 'express'
import axios from 'axios'
import { randomUUID } from 'crypto'

async function sciteAI(prompt: string) {
    const anonId = randomUUID()

    const postRes = await axios.post("https://api.scite.ai/assistant/poll", {
        turns: [{ role: "user", content: prompt }],
        user_input: prompt,
        session_id: null,
        country: null,
        alwaysUseReferences: false,
        neverUseReferences: false,
        abstractsOnly: false,
        fullTextsOnly: false,
        numReferences: 25,
        rankBy: "relevance",
        answerLength: "medium",
        model: "gpt-4o-mini-2024-07-18",
        reasoningEffort: "medium",
        citationStyle: "apa",
        anon_id: anonId
    }, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 11; vivo 1901)",
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json",
            "Authorization": "Bearer null",
            "Origin": "https://scite.ai",
            "Referer": "https://scite.ai/"
        }
    })

    const taskId = postRes.data?.id
    if (!taskId) throw new Error("Gagal mendapatkan taskId.")

    let resultData
    while (true) {
        const getRes = await axios.get(`https://api.scite.ai/assistant/tasks/${taskId}`, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Linux; Android 11; vivo 1901)",
                "Accept": "application/json, text/plain, */*",
                "Authorization": "Bearer null",
                "Origin": "https://scite.ai",
                "Referer": "https://scite.ai/"
            }
        })

        resultData = getRes.data
        if (resultData.status === "SUCCESS") break
        if (resultData.status === "FAILURE") throw new Error("AI Task Failed.")
        await new Promise(r => setTimeout(r, 2000))
    }

    const assistantTurn = resultData.result?.turns?.find((t: any) => t.role === "assistant")
    return assistantTurn?.content || "Tidak ada respon dari AI."
}

export default async function sciteHandler(req: Request, res: Response) {
    try {
        const q = (req.query.q || req.body.q) as string
        if (!q) {
            return res.status(400).json({
                creator: "kayzzaoshi",
                status: false,
                error: "parameter 'q' diperlukan"
            })
        }

        const result = await sciteAI(q)

        res.json({
            creator: "kayzzaoshi",
            status: true,
            response: result
        })
    } catch (err: any) {
        res.status(500).json({
            creator: "kayzzaoshi",
            status: false,
            error: err.message || "internal server error"
        })
    }
}