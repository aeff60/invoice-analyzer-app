"use client"

import { useState, useEffect } from "react"
import { Edit, Trash2, ArrowLeft, FileSpreadsheet, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Invoice {
  id: number
  vendor_name: string
  customer_name: string
  invoice_total: string
}

export default function Records() {
  const [records, setRecords] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/records")
      const data = await response.json()
      setRecords(data.records || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch records",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) {
      return
    }

    try {
      const response = await fetch(`/api/delete/${id}`, {
        method: "POST",
      })

      const result = await response.json()

      if (result.status === "success") {
        toast({
          title: "Deleted",
          description: "Record deleted successfully",
        })
        fetchRecords()
      } else {
        toast({
          title: "Delete failed",
          description: result.message || "An error occurred while deleting",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice({ ...invoice })
    setIsDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingInvoice) return

    try {
      const response = await fetch(`/api/update/${editingInvoice.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendor_name: editingInvoice.vendor_name,
          customer_name: editingInvoice.customer_name,
          invoice_total: editingInvoice.invoice_total,
        }),
      })

      const result = await response.json()

      if (result.status === "success") {
        toast({
          title: "Updated",
          description: "Record updated successfully",
        })
        setIsDialogOpen(false)
        fetchRecords()
      } else {
        toast({
          title: "Update failed",
          description: result.message || "An error occurred while updating",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      })
    }
  }

  const handleExport = async () => {
    try {
      window.location.href = "/api/export"
      toast({
        title: "Export started",
        description: "Your Excel file is being downloaded",
      })
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export records to Excel",
        variant: "destructive",
      })
    }
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Button variant="outline" asChild className="mr-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Invoice Records</h1>
        </div>
        <Button onClick={handleExport}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading records...</p>
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-muted-foreground mb-4">No invoice records found</p>
            <Button asChild>
              <Link href="/">Upload and analyze invoices</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {records.map((record) => (
            <Card key={record.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Invoice #{record.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Vendor Name</p>
                    <p>{record.vendor_name || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Customer Name</p>
                    <p>{record.customer_name || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Invoice Total</p>
                    <p>{record.invoice_total || "Not specified"}</p>
                  </div>
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(record)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(record.id)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>Make changes to the invoice information below.</DialogDescription>
          </DialogHeader>
          {editingInvoice && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vendor_name" className="text-right">
                  Vendor Name
                </Label>
                <Input
                  id="vendor_name"
                  value={editingInvoice.vendor_name || ""}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, vendor_name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer_name" className="text-right">
                  Customer Name
                </Label>
                <Input
                  id="customer_name"
                  value={editingInvoice.customer_name || ""}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, customer_name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="invoice_total" className="text-right">
                  Invoice Total
                </Label>
                <Input
                  id="invoice_total"
                  value={editingInvoice.invoice_total || ""}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, invoice_total: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

