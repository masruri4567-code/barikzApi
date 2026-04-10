import fs from "fs"
import { tmpdir } from "os"
import { join, basename, extname } from "path"
import axios from "axios"
import FormData from "form-data"
import { Request, Response } from "express"

function genserial() {
  let s = ""
  for (let i = 0; i < 32; i++) s += Math.floor(Math.random() * 16).toString(16)
  return s
}

async function upload(filename: string) {
  const form = new FormData()
  form.append("file_name", filename)

  const res = await axios.post(
    "https://api.imgupscaler.ai/api/common/upload/upload-image",
    form,
    {
      headers: {
        ...form.getHeaders(),
        origin: "https://imgupscaler.ai",
        referer: "https://imgupscaler.ai/",
      },
    }
  )

  return res.data.result
}

async function uploadtoOSS(putUrl: string, filePath: string) {
  const file = fs.readFileSync(filePath)
  const type = extname(filePath) === ".png" ? "image/png" : "image/jpeg"

  const res = await axios.put(putUrl, file, {
    headers: {
      "Content-Type": type,
      "Content-Length": file.length,
    },
    maxBodyLength: Infinity,
  })

  return res.status === 200
}

async function createJob(imageUrl: string, prompt: string) {
  const form = new FormData()
  form.append("model_name", "magiceraser_v4")
  form.append("original_image_url", imageUrl)
  form.append("prompt", prompt)
  form.append("ratio", "match_input_image")
  form.append("output_format", "jpg")

  const res = await axios.post(
    "https://api.magiceraser.org/api/magiceraser/v2/image-editor/create-job",
    form,
    {
      headers: {
        ...form.getHeaders(),
        "product-code": "magiceraser",
        "product-serial": genserial(),
        origin: "https://imgupscaler.ai",
        referer: "https://imgupscaler.ai/",
      },
    }
  )

  return res.data.result.job_id
}

async function cekjob(jobId: string) {
  const res = await axios.get(
    `https://api.magiceraser.org/api/magiceraser/v1/ai-remove/get-job/${jobId}`,
    {
      headers: {
        origin: "https://imgupscaler.ai",
        referer: "https://imgupscaler.ai/",
      },
    }
  )

  return res.data
}

async function magicEraser(imagePath: string, prompt: string) {
  const filename = basename(imagePath)
  const up = await upload(filename)

  await uploadtoOSS(up.url, imagePath)

  const cdn = "https://cdn.imgupscaler.ai/" + up.object_name
  const jobId = await createJob(cdn, prompt)

  let result: any
  do {
    await new Promise((r) => setTimeout(r, 3000))
    result = await cekjob(jobId)
  } while (result.code === 300006)

  return result.result.output_url[0]
}

export default async function nanoBananaHandler(req: Request, res: Response) {
  try {
    const { imageUrl, prompt } = req.query as { imageUrl: string; prompt: string }

    if (!imageUrl || !prompt) {
      return res.status(400).json({
        status: false,
        message: "imageUrl dan prompt wajib diisi"
      })
    }

    const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" })
    const tmpInput = join(tmpdir(), `nano-${Date.now()}.jpg`)
    fs.writeFileSync(tmpInput, Buffer.from(imgRes.data))

    const resultUrl = await magicEraser(tmpInput, prompt)

    fs.unlinkSync(tmpInput)

    res.json({
      status: true,
      result: {
        prompt,
        image: resultUrl
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      status: false,
      message: "Internal Server Error"
    })
  }
}


