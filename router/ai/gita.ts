import { Request, Response } from 'express'
import axios from 'axios'

async function gitaAI(question: string) {
    if (!question) throw new Error('Question is required.')

    try {
        const response = await axios.get('https://api.siputzx.my.id/api/ai/gita', {
            params: { q: question }
        })

        if (response.data && response.data.status) {
            return response.data.data
        } else {
            throw new Error('Gagal mendapatkan respon dari Gita AI')
        }
    } catch (err) {
        throw err
    }
}

export default async function gitaHandler(req: Request, res: Response) {
    const q = (req.query.q || req.body.q) as string

    if (!q) {
        return res.status(400).json({
            status: false,
            message: "Parameter 'q' diperlukan."
        })
    }

    try {
        const result = await gitaAI(q)
        res.json({
            status: true,
            response: result
        })
    } catch (error: any) {
        res.status(500).json({
            status: false,
            message: error.message
        })
    }
}