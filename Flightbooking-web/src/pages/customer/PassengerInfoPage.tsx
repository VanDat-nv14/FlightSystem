import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const passengerSchema = z.object({
  title: z.string().min(1, "Vui lòng chọn danh xưng"),
  firstName: z.string().min(2, "Tên quá ngắn"),
  lastName: z.string().min(2, "Họ quá ngắn"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  dob: z.string().min(1, "Vui lòng chọn ngày sinh"),
  passportNumber: z.string().optional(),
})

export default function PassengerInfoPage() {
  const form = useForm<z.infer<typeof passengerSchema>>({
    resolver: zodResolver(passengerSchema),
    defaultValues: {
      title: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dob: "",
      passportNumber: "",
    },
  })

  function onSubmit(values: z.infer<typeof passengerSchema>) {
    console.log(values)
    // Go to payment page
  }

  return (
    <div className="container px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
      <div className="flex-1 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Thông tin hành khách</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="bg-card text-card-foreground rounded-xl shadow-sm border p-6 space-y-6">
              <h3 className="font-semibold text-lg border-b pb-2">Người lớn 1</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Danh xưng</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="mr">Ông</SelectItem>
                          <SelectItem value="mrs">Bà</SelectItem>
                          <SelectItem value="ms">Cô</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ</FormLabel>
                      <FormControl>
                        <Input placeholder="Nguyễn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên Đệm & Tên</FormLabel>
                      <FormControl>
                        <Input placeholder="Văn A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@gmail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="0901234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày sinh</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passportNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số hộ chiếu / CCCD</FormLabel>
                      <FormControl>
                        <Input placeholder="Tùy chọn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" type="button">Quay lại</Button>
              <Button type="submit">Tiếp tục thanh toán</Button>
            </div>
          </form>
        </Form>
      </div>

      <aside className="w-full lg:w-80 shrink-0">
        <div className="bg-card text-card-foreground rounded-xl shadow-sm border p-6 sticky top-24">
          <h3 className="font-semibold text-lg mb-4 border-b pb-2">Tổng cộng</h3>
          <div className="text-3xl font-bold text-primary">2.800.000 ₫</div>
        </div>
      </aside>
    </div>
  )
}
