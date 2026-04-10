import { Request, Response } from "express"
import axios from "axios"

export default async function muslimAiHandler(req: Request, res: Response) {
  const query = (req.query.q as string)?.trim()

  if (!query) {
    res.status(400)
    res.setHeader("Content-Type", "application/json")
    return res.json({ status: false, message: "Parameter 'q' wajib diisi" })
  }

  try {
    const searchUrl = 'https://www.muslimai.io/api/search'
    const headers = { 'Content-Type': 'application/json' }

    const searchResponse = await axios.post(searchUrl, { query: query }, { headers })
    const passages = searchResponse.data.map((item: any) => item.content).join('\n\n')

    const answerUrl = 'https://www.muslimai.io/api/answer'
    const prompt = `Use the following passages to answer the query to the best of your ability as a world class expert in the Quran. Do not mention that you were provided any passages in your answer: ${query}\n\n${passages}`

    const answerResponse = await axios.post(answerUrl, { prompt: prompt }, { headers })

    res.json({
      status: true,
      creator: "KayzzAoshi",
      data: {
        answer: answerResponse.data,
        sources: searchResponse.data
      }
    })

  } catch (err: any) {
    console.error(err)
    res.status(500)
    res.json({ 
      status: false, 
      message: "Gagal mendapatkan respon dari Muslim AI",
      error: err.message 
    })
  }
}
  