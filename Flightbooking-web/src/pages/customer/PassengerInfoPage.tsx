import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams, useNavigate } from "react-router-dom"
import { bookingExtrasService } from "../../services/booking-extras.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Stepper } from "@/components/common/Stepper"
import { Briefcase, Utensils, Shield, Zap, ChevronRight, ChevronLeft, User } from "lucide-react"
import { differenceInYears, isAfter } from "date-fns"
import { cn } from "@/lib/utils"

// Base option for no baggage
const noBaggageOption = { id: "none", label: "Không chọn", weight: 0, price: 0 };

const getServiceIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'meal': return Utensils;
    case 'insurance': return Shield;
    case 'fasttrack': return Zap;
    default: return Briefcase;
  }
}

const passengerSchema = z.object({
  passengers: z.array(z.object({
    title: z.string().min(1, "Vui lòng chọn danh xưng"),
    firstName: z.string().min(2, "Tên đệm & tên không được để trống"),
    lastName: z.string().min(2, "Họ không được để trống"),
    dob: z.string().refine((val) => {
      const age = differenceInYears(new Date(), new Date(val));
      return age >= 2;
    }, "Hành khách phải trên 2 tuổi"),
    nationality: z.string().min(1, "Vui lòng chọn quốc tịch"),
    passportNumber: z.string().min(5, "Số hộ chiếu/CCCD không hợp lệ"),
    passportExpiry: z.string().refine((val) => {
      return isAfter(new Date(val), new Date()); // Simplification: should be after flight date
    }, "Hộ chiếu phải còn hạn"),
    baggage: z.string(),
    services: z.array(z.string()),
    sameAsBooker: z.boolean(),
  })).min(1),
})

type PassengerFormValues = z.infer<typeof passengerSchema>

export default function PassengerInfoPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Đọc thông tin từ URL (truyền từ SeatSelectionPage)
  const flightId      = searchParams.get("flightId")      || ""
  const originCode    = searchParams.get("origin")        || "SGN"
  const destCode      = searchParams.get("destination")   || "HAN"
  const flightNumber  = searchParams.get("flightNumber")  || ""
  const basePriceUrl  = Number(searchParams.get("basePrice")) || 2_500_000
  const totalUrl      = Number(searchParams.get("total"))     || basePriceUrl
  const seatsParam    = searchParams.get("seats")         || ""
  const passengerCount = Number(searchParams.get("passengerCount")) || 1

  const { data: dbBaggage = [] } = useQuery({
    queryKey: ['baggage-allowances'],
    queryFn: bookingExtrasService.getBaggageAllowances
  });

  const { data: dbServices = [] } = useQuery({
    queryKey: ['additional-services'],
    queryFn: bookingExtrasService.getAdditionalServices
  });

  const baggageOptions = [
    noBaggageOption,
    ...dbBaggage.map(b => ({
      id: b.id.toString(),
      label: `${b.maxWeight}kg`,
      weight: b.maxWeight,
      price: b.additionalFee
    }))
  ];

  const servicesOptions = dbServices.map(s => ({
    id: s.id.toString(),
    label: s.serviceName,
    price: s.price,
    icon: getServiceIcon(s.serviceType)
  }));

  const form = useForm<PassengerFormValues>({
    resolver: zodResolver(passengerSchema),
    defaultValues: {
      passengers: [{
        title: "",
        firstName: "",
        lastName: "",
        dob: "",
        nationality: "Vietnam",
        passportNumber: "",
        passportExpiry: "",
        baggage: "none",
        services: [],
        sameAsBooker: false,
      }],
    },
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "passengers",
  })

  const steps = [
    { id: 1, name: "Chọn chỗ ngồi", status: "complete" as const },
    { id: 2, name: "Thông tin hành khách", status: "current" as const },
    { id: 3, name: "Thanh toán", status: "upcoming" as const },
  ]

  function onSubmit(values: PassengerFormValues) {
    // Tính tổng tiền cuối cùng (vé + hành lý + dịch vụ)
    const serviceTotal = values.passengers.reduce((acc, p) => {
      const baggage = baggageOptions.find(opt => opt.id === p.baggage)
      const baggageFee = baggage ? baggage.price : 0
      const svcFee = p.services.reduce((s, sId) => {
        const svc = servicesOptions.find(opt => opt.id === sId)
        return s + (svc ? svc.price : 0)
      }, 0)
      return acc + baggageFee + svcFee
    }, 0)

    const finalTotal = totalUrl + serviceTotal

    // Lưu thông tin hành khách vào localStorage để dùng ở trang thanh toán
    localStorage.setItem("draftPassengers", JSON.stringify(values.passengers))

    const params = new URLSearchParams({
      flightId,
      origin:        originCode,
      destination:   destCode,
      flightNumber,
      total:         finalTotal.toString(),
      service:       serviceTotal.toString(),
      passengers:    passengerCount.toString(),
      seats:         seatsParam,
    })
    navigate(`/payment?${params.toString()}`)
  }

  const watchedPassengers = useWatch({
    control: form.control,
    name: "passengers",
  }) || []

  const calculateTotal = () => {
    let total = totalUrl // Dùng total từ URL (đã bao gồm giá vé + nâng hạng ghế)

    watchedPassengers.forEach(p => {
      const baggage = baggageOptions.find(opt => opt.id === p.baggage)
      if (baggage) total += baggage.price

      p.services?.forEach(sId => {
        const service = servicesOptions.find(opt => opt.id === sId)
        if (service) total += service.price
      })
    })

    return total
  }

  const formControl = form.control as any;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
        <Stepper steps={steps} className="mb-8" />
        
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Thông tin hành khách</h2>
              <Button 
                variant="outline" 
                size="sm" 
                type="button" 
                onClick={() => append({
                  title: "", firstName: "", lastName: "", dob: "", 
                  nationality: "Vietnam", passportNumber: "", passportExpiry: "",
                  baggage: "none", services: [], sameAsBooker: false
                })}
                className="rounded-full px-4 border-primary text-primary hover:bg-primary/5"
              >
                + Thêm hành khách
              </Button>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {fields.map((field, index) => (
                  <Card key={field.id} className="overflow-hidden border-none shadow-lg shadow-slate-200/50">
                    <CardHeader className="bg-slate-900 text-white py-4 px-6 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <CardTitle className="text-lg">Hành khách {index + 1}</CardTitle>
                      </div>
                      {index > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => remove(index)}
                          className="text-slate-400 hover:text-white hover:bg-white/10"
                        >
                          Xóa
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                      {/* Checkbox Same as Booker */}
                      <FormField
                        control={formControl}
                        name={`passengers.${index}.sameAsBooker`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 bg-primary/5 p-4 rounded-lg">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-medium text-slate-700">
                                Dùng thông tin của tôi (người đặt vé)
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Passenger Details */}
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                        <FormField
                          control={formControl}
                          name={`passengers.${index}.title`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-1">
                              <FormLabel>Danh xưng</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white">
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
                          control={formControl}
                          name={`passengers.${index}.lastName`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Họ (như trong hộ chiếu)</FormLabel>
                              <FormControl>
                                <Input placeholder="NGUYEN" className="uppercase bg-white" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={formControl}
                          name={`passengers.${index}.firstName`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-3">
                              <FormLabel>Tên đệm & Tên</FormLabel>
                              <FormControl>
                                <Input placeholder="VAN A" className="uppercase bg-white" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={formControl}
                          name={`passengers.${index}.dob`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Ngày sinh</FormLabel>
                              <FormControl>
                                <Input type="date" className="bg-white" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={formControl}
                          name={`passengers.${index}.nationality`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Quốc tịch</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Chọn..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Vietnam">Việt Nam</SelectItem>
                                  <SelectItem value="USA">Hoa Kỳ</SelectItem>
                                  <SelectItem value="Japan">Nhật Bản</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="md:col-span-2 hidden md:block"></div>

                        <FormField
                          control={formControl}
                          name={`passengers.${index}.passportNumber`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-3">
                              <FormLabel>Số hộ chiếu / CCCD</FormLabel>
                              <FormControl>
                                <Input placeholder="Số định danh" className="bg-white" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={formControl}
                          name={`passengers.${index}.passportExpiry`}
                          render={({ field }) => (
                            <FormItem className="md:col-span-3">
                              <FormLabel>Ngày hết hạn hộ chiếu</FormLabel>
                              <FormControl>
                                <Input type="date" className="bg-white" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Baggage Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-900">
                          <Briefcase className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Hành lý ký gửi (tùy chọn)</h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                          {baggageOptions.map((opt) => (
                            <div 
                              key={opt.id}
                              onClick={() => form.setValue(`passengers.${index}.baggage`, opt.id)}
                              className={cn(
                                "cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center transition-all duration-200",
                                watchedPassengers[index]?.baggage === opt.id 
                                  ? "border-primary bg-primary/5 shadow-md" 
                                  : "border-slate-100 bg-white hover:border-slate-300"
                              )}
                            >
                              <span className="text-sm font-bold">{opt.label}</span>
                              <span className="text-xs text-slate-500">{opt.price === 0 ? "Miễn phí" : `+${opt.price.toLocaleString()}₫`}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Additional Services */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-900">
                          <Zap className="h-5 w-5 text-primary" />
                          <h4 className="font-semibold">Dịch vụ đi kèm</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {servicesOptions.map((svc) => {
                            const Icon = svc.icon
                            const currentServices = watchedPassengers[index]?.services || []
                            const isSelected = currentServices.includes(svc.id)
                            
                            return (
                              <div 
                                key={svc.id}
                                onClick={() => {
                                  const newValue = isSelected 
                                    ? currentServices.filter(id => id !== svc.id)
                                    : [...currentServices, svc.id]
                                  form.setValue(`passengers.${index}.services`, newValue)
                                }}
                                className={cn(
                                  "cursor-pointer border-2 rounded-xl p-4 flex gap-4 items-center transition-all duration-200",
                                  isSelected 
                                    ? "border-primary bg-primary/5 shadow-md" 
                                    : "border-slate-100 bg-white hover:border-slate-300"
                                )}
                              >
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
                                )}>
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold">{svc.label}</span>
                                  <span className="text-xs text-primary font-medium">+{svc.price.toLocaleString()}₫</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                  <Button variant="ghost" type="button" className="text-slate-600">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Quay lại
                  </Button>
                  <Button 
                    type="submit" 
                    size="lg"
                    disabled={!form.formState.isValid}
                    className="px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-xl"
                  >
                    Tiếp tục thanh toán <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <aside className="lg:col-span-4 h-fit sticky top-8">
            <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
              
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                Chi tiết giá vé
              </h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-slate-300">
                  <span>Giá vé cơ bản ({fields.length}x)</span>
                  <span>{(2800000 * fields.length).toLocaleString()}₫</span>
                </div>
                {watchedPassengers.map((p, idx) => {
                  const baggage = baggageOptions.find(opt => opt.id === p.baggage)
                  if (baggage && baggage.price > 0) {
                    return (
                      <div key={idx} className="flex justify-between text-xs text-slate-400 pl-4">
                        <span>Hành lý HK{idx + 1} ({baggage.label})</span>
                        <span>+{baggage.price.toLocaleString()}₫</span>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
              
              <div className="border-t border-white/10 pt-6 mt-6">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 text-sm uppercase tracking-wider font-semibold">Tổng số tiền</span>
                  <div className="text-4xl font-black text-white">
                    {calculateTotal().toLocaleString()} <span className="text-lg font-normal text-slate-400">₫</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Shield className="h-4 w-4" /> Giá đã bao gồm thuế & phí
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
