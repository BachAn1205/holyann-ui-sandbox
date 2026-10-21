import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { postFeature8TestMic } from "@/lib/ai-api-client"

/** Proxy device check: client sends a short audio/video clip to FastAPI. */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get("file")
    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "Thieu file audio/video (field `file`)." },
        { status: 400 },
      )
    }

    const result = await postFeature8TestMic(file, file.name || "camera-mic-test.webm")
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Device test failed"
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
