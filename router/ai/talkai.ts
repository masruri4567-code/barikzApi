import { Request, Response } from 'express'
import axios from 'axios'

async function talktoAI(query: string) {
  const botName = "Beebop"
  const role = "AI Companion"
  const sessionID =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)


  const smsg = {
    data: {
      botName,
      role,
      message: `B::Hello!\nU::${query}`
    }
  }

  const sres = await axios.post(
    "https://talkto-api.pfpmaker.workers.dev/api/send-message",
    smsg,
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
        Referer: "https://talkto.ai/"
      },
      timeout: 15000
    }
  )

  if (sres.data.response !== "Message sent") {
    throw new Error("Gagal mengirim pesan ke AI")
  }

  const hash = sres.data.hash
  const blob = Buffer.from(`B::Hello!\nU::${query}`).toString("base64")


  const getmsg = {
    data: { hash, role, sessionID, blob }
  }

  const getres = await axios.post(
    "https://talkto-api.pfpmaker.workers.dev/api/get-message",
    getmsg,
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
        Referer: "https://talkto.ai/"
      },
      timeout: 15000
    }
  )

  if (getres.data.response !== "Message received") {
    throw new Error("Gagal mendapatkan jawaban dari AI")
  }

  return getres.data.message
}




export default async function talkaiHandler(req: Request, res: Response) {
  try {
    const query = (req.query.q || req.body.q) as string
    if (!query) {
      return res.status(400).json({
        creator: "KayzzAoshi",
        status: false,
        error: "Parameter 'q' diperlukan"
      })
    }

    const aiResponse = await talktoAI(query)

    res.json({
      creator: "KayzzAoshi",
      status: true,
      response: aiResponse
    })
  } catch (err: any) {
    res.status(500).json({
      creator: "KayzzAoshi",
      status: false,
      error: err.message || "Internal Server Error"
    })
  }
}