"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, Save, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any[]>([])
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload",
        variant: "destructive",
      })
      return
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "Invalid file format",
        description: "Please upload a PDF file",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/analyze-upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.status === "success") {
        setAnalysisResults(result.data)
        toast({
          title: "Analysis complete",
          description: "Invoice analyzed successfully",
        })
      } else {
        toast({
          title: "Analysis failed",
          description: result.message || "An error occurred during analysis",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze invoice",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const saveInvoice = async (invoice: any) => {
    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoice),
      })

      const result = await response.json()

      if (result.status === "success") {
        toast({
          title: "Saved",
          description: "Invoice saved to database successfully",
        })
      } else {
        toast({
          title: "Save failed",
          description: result.message || "An error occurred while saving",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save invoice",
        variant: "destructive",
      })
    }
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Invoice Analyzer</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Upload Invoice</CardTitle>
            <CardDescription>Upload a PDF invoice to analyze using Azure Form Recognizer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="invoice">Select Invoice PDF</Label>
                <Input id="invoice" type="file" accept=".pdf" onChange={handleFileChange} />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setFile(null)} disabled={!file || isUploading}>
              Clear
            </Button>
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Analyze Invoice
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Management</CardTitle>
            <CardDescription>View and manage your invoice records</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Database className="h-12 w-12 mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Access your invoice database to view, edit, or delete records</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/records">
                <FileText className="mr-2 h-4 w-4" />
                View Records
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      {analysisResults.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
          <div className="grid grid-cols-1 gap-4">
            {analysisResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>Invoice {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Vendor Name</p>
                      <p className="text-lg">{result.vendor_name || "Not detected"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Customer Name</p>
                      <p className="text-lg">{result.customer_name || "Not detected"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Invoice Total</p>
                      <p className="text-lg">{result.invoice_total || "Not detected"}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="ml-auto" onClick={() => saveInvoice(result)}>
                    <Save className="mr-2 h-4 w-4" />
                    Save to Database
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

