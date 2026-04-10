import { Request, Response } from 'express'
import axios from 'axios'

async function fetchCopilot(prompt: string) {
    const { data } = await axios.get(
        "https://labs.shannzx.xyz/api/v1/copilot",
        {
            params: {
                model: "gpt-5",
                prompt: prompt
            }
        }
    )

    return data?.data?.text || null
}

export default async function handler(req: Request, res: Response) {
    try {
        const q = (req.query.q || req.body.q) as string

        if (!q) {
            return res.status(400).json({
                status: false,
                error: "parameter 'q' diperlukan"
            })
        }

        const result = await fetchCopilot(q)

        if (!result) {
            return res.status(404).json({
                status: false,
                error: "Respon tidak ditemukan"
            })
        }

        res.json({
            status: true,
            response: result
        })
    } catch (err: any) {
        res.status(500).json({
            status: false,
            error: err.message || "internal server error"
        })
    }
}