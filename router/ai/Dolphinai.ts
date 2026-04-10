import { Request, Response } from 'express'
import axios from 'axios'

async function dolphinAI(message: string, template: string = 'logical') {
    const templates = ['logical', 'creative', 'summarize', 'code-beginner', 'code-advanced']

    if (!message) throw new Error('Parameter message diperlukan.')
    if (!templates.includes(template)) throw new Error(`Available templates: ${templates.join(', ')}.`)


    const { data: rawData } = await axios.post(
        'https://chat.dphn.ai/api/chat',
        {
            messages: [{ role: 'user', content: message }],
            model: 'dolphinserver:24B',
            template
        },
        {
            headers: {
                origin: 'https://chat.dphn.ai',
                referer: 'https://chat.dphn.ai/',
                'user-agent': 'Mozilla/5.0 (Linux; Android 15; SM-F958 Build/AP3A.240905.015) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.86 Mobile Safari/537.36'
            }
        }
    )


    const result = rawData
        .split('\n\n')
        .filter(line => line && line.startsWith('data: {'))
        .map(line => JSON.parse(line.substring(6)))
        .map(item => item.choices?.[0]?.delta?.content || '')
        .join('')

    if (!result) throw new Error('No result found.')

    return result
}


export default async function dolphinHandler(req: Request, res: Response) {
    const q = (req.query.q || req.body.q) as string
    const template = (req.query.template || req.body.template || 'logical') as string

    if (!q) return res.status(400).json({ status: false, message: "Parameter 'q' diperlukan." })

    try {
        const answer = await dolphinAI(q, template)
        res.json({ status: true, response: answer })
    } catch (error: any) {
        res.status(500).json({ status: false, message: error.message })
    }
}