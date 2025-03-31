import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Fetch records from Flask backend
    const response = await fetch("http://localhost:5000/records", {
      headers: {
        Accept: "application/json",
      },
    })

    // If Flask returns HTML (for the template), we need to extract the data
    const contentType = response.headers.get("content-type")

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data)
    } else {
      // For this demo, we'll return mock data if the Flask API returns HTML
      // In a real app, you'd need to modify the Flask API to return JSON
      const text = await response.text()

      // Simple regex to extract records from HTML (this is a fallback)
      const records = []
      const regex =
        /<tr[^>]*>.*?<td[^>]*>(\d+)<\/td>.*?<td[^>]*>(.*?)<\/td>.*?<td[^>]*>(.*?)<\/td>.*?<td[^>]*>(.*?)<\/td>.*?<\/tr>/gs

      let match
      while ((match = regex.exec(text)) !== null) {
        records.push({
          id: Number.parseInt(match[1]),
          vendor_name: match[2],
          customer_name: match[3],
          invoice_total: match[4],
        })
      }

      return NextResponse.json({ records })
    }
  } catch (error) {
    console.error("Error fetching records:", error)
    return NextResponse.json({ status: "error", message: "Failed to fetch records", records: [] }, { status: 500 })
  }
}

