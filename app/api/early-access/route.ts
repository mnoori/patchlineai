import { type NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }
  const filePath = path.join(process.cwd(), "data", "early-access.json")
  let emails = []
  if (fs.existsSync(filePath)) {
    emails = JSON.parse(fs.readFileSync(filePath, "utf-8"))
  }
  emails.push({ email, date: new Date().toISOString() })
  fs.writeFileSync(filePath, JSON.stringify(emails, null, 2))
  return NextResponse.json({ success: true })
}
