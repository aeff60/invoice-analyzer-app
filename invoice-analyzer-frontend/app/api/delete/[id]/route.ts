import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const flaskResponse = await fetch(`http://localhost:5000/delete/${id}`, {
      method: "POST",
    })

    const responseData = await flaskResponse.json()
    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json({ status: "error", message: "Failed to delete invoice" }, { status: 500 })
  }
}

