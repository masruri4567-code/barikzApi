import { Request, Response } from 'express'
import axios from 'axios'

async function veniceAI(question: string) {
    const { data } = await axios.post('https://outerface.venice.ai/api/inference/chat', {
        requestId: 'nekorinn',
        modelId: 'dolphin-3.0-mistral-24b',
        prompt: [{ content: question, role: 'user' }],
        systemPrompt: 'Jawablah menggunakan Bahasa Indonesia yang baik dan benar.',
        conversationType: 'text',
        temperature: 0.8,
        webEnabled: true,
        topP: 0.9,
        isCharacter: false,
        clientProcessingTime: 15
    }, {
        headers: {
            'accept': '*/*',
            'content-type': 'application/json',
            'origin': 'https://venice.ai',
            'referer': 'https://venice.ai/',
            'user-agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
            'x-venice-version': 'interface@20250523.214528+393d253'
        }
    })

    const chunks = data
        .split('\n')
        .filter((chunk: string) => chunk.trim())
        .map((chunk: string) => JSON.parse(chunk))

    return chunks.map((chunk: any) => chunk.content).join('')
}

export default async function veniceHandler(req: Request, res: Response) {
    try {
        const q = (req.query.q || req.body.q) as string
        if (!q) {
            return res.status(400).json({
                creator: "kayzzaoshi",
                status: false,
                error: "parameter 'q' diperlukan"
            })
        }

        const result = await veniceAI(q)

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