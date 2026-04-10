import { Request, Response } from 'express'
import axios from 'axios'

class Text2PetAI {
  constructor() {
    this.baseUrl = "https://text2pet.zdex.top"
    this.token = this.decryptToken()
    this.headers = {
      "user-agent": "AgungDevX FreeScrape/1.0.0",
      "accept-encoding": "gzip",
      "content-type": "application/json",
      authorization: this.token
    }
  }

  decryptToken() {
    const cipher = "hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW"
    const shift = 3

    return [...cipher].map(c => {
      if (/[a-z]/.test(c)) {
        return String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97)
      } else if (/[A-Z]/.test(c)) {
        return String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65)
      }
      return c
    }).join("")
  }

  async generateImage(prompt: string) {
    if (!prompt || !prompt.trim()) {
      return { success: false, error: "Prompt is required" }
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/images`,
        { prompt },
        { headers: this.headers }
      )

      if (response.data.code !== 0 || !response.data.data) {
        return { success: false, error: "Image generation failed" }
      }

      return {
        success: true,
        url: response.data.data,
        prompt: response.data.prompt || prompt
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

const generator = new Text2PetAI()

export default async function petImgHandler(req: Request, res: Response) {
  const prompt = (req.query.prompt || req.body.prompt) as string

  if (!prompt) {
    return res.status(400).json({
      creator: "KayzzAoshi",
      status: false,
      message: "Parameter 'prompt' wajib diisi"
    })
  }

  try {
    const result = await generator.generateImage(prompt)

    if (!result.success) {
      return res.status(500).json({
        creator: "KayzzAoshi",
        status: false,
        message: result.error
      })
    }

    res.json({
      creator: "KayzzAoshi",
      status: true,
      prompt: result.prompt,
      url: result.url
    })
  } catch (e: any) {
    res.status(500).json({
      creator: "KayzzAoshi",
      status: false,
      message: e.message
    })
  }
}
