import { useState, useEffect, useMemo } from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams, useNavigate } from "react-router-dom"
import { bookingExtrasService } from "../../services/booking-extras.service"
import { accountService } from "../../services/account.service"
import { flightService } from "../../services/flight.service"
import { useAuthStore } from "../../stores/useAuthStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Stepper } from "@/components/common/Stepper"
import { Briefcase, Utensils, Shield, Zap, ChevronRight, ChevronLeft, User, Clock } from "lucide-react"
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
      return isAfter(new Date(val), new Date());
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
  const { isAuthenticated } = useAuthStore()

  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: accountService.getProfile,
    enabled: isAuthenticated
  })

  // Đọc thông tin từ URL (truyền từ SeatSelectionPage)
  const flightId      = searchParams.get("flightId")      || ""
  const originCode    = searchParams.get("origin")        || "SGN"
  const destCode      = searchParams.get("destination")   || "HAN"
  const flightNumber  = searchParams.get("flightNumber")  || ""
  const basePriceUrl  = Number(searchParams.get("basePrice")) || 2_500_000
  const totalUrl      = Number(searchParams.get("total"))     || basePriceUrl
  const seatsParam    = searchParams.get("seats")         || ""
  const passengerCountParam = Number(searchParams.get("passengerCount")) || 1

  const seatNumbers = useMemo(() => {
    return seatsParam ? seatsParam.split(",").map(s => s.trim()).filter(Boolean) : []
  }, [seatsParam])

  const actualPassengerCount = seatNumbers.length > 0 ? seatNumbers.length : passengerCountParam

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const expiresAtStr = sessionStorage.getItem("seatHoldExpiresAt")
    if (expiresAtStr) {
      const remaining = Math.max(0, Math.floor((parseInt(expiresAtStr, 10) - Date.now()) / 1000))
      return remaining
    }
    return 10 * 60 // 10 phút mặc định
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          alert("Thời gian giữ chỗ của bạn đã hết (10 phút). Vui lòng chọn lại ghế.")
          navigate(`/seats?flightId=${flightId}&passengerCount=${actualPassengerCount}&origin=${originCode}&destination=${destCode}&flightNumber=${flightNumber}&basePrice=${basePriceUrl}`)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [flightId, actualPassengerCount, originCode, destCode, flightNumber, basePriceUrl, navigate])

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

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

  const initialPassengers = useMemo(() => {
    return Array.from({ length: actualPassengerCount }, () => ({
      title: "",
      firstName: "",
      lastName: "",
      dob: "",
      nationality: "Vietnam",
      passportNumber: "",
      passportExpiry: "",
      baggage: "none",
      services: [] as string[],
      sameAsBooker: false,
    }))
  }, [actualPassengerCount])

  const form = useForm<PassengerFormValues>({
    resolver: zodResolver(passengerSchema),
    defaultValues: {
      passengers: initialPassengers,
    },
    mode: "onChange",
  })

  const { fields } = useFieldArray({
    control: form.control,
    name: "passengers",
  })

  const handleSameAsBookerChange = (index: number, checked: boolean) => {
    if (checked && profile) {
      let lastName = ""
      let firstName = ""
      if (profile.fullName) {
        const parts = profile.fullName.trim().split(/\s+/)
        if (parts.length > 0) {
          lastName = parts[0].toUpperCase()
          if (parts.length > 1) {
            firstName = parts.slice(1).join(" ").toUpperCase()
          }
        }
      }

      let title = ""
      if (profile.gender) {
        const g = profile.gender.toLowerCase()
        if (g === "male" || g === "nam" || g === "1") {
          title = "mr"
        } else if (g === "female" || g === "nữ" || g === "nu" || g === "0") {
          title = "mrs"
        }
      }

      const dob = profile.dateOfBirth ? profile.dateOfBirth.split("T")[0] : ""
      const passportExpiry = profile.passportExpiry ? profile.passportExpiry.split("T")[0] : ""

      form.setValue(`passengers.${index}.title`, title, { shouldValidate: true })
      form.setValue(`passengers.${index}.lastName`, lastName, { shouldValidate: true })
      form.setValue(`passengers.${index}.firstName`, firstName, { shouldValidate: true })
      form.setValue(`passengers.${index}.dob`, dob, { shouldValidate: true })
      form.setValue(`passengers.${index}.nationality`, profile.nationality || "Vietnam", { shouldValidate: true })
      form.setValue(`passengers.${index}.passportNumber`, profile.passportNumber || profile.idCardNumber || "", { shouldValidate: true })
      if (passportExpiry) {
        form.setValue(`passengers.${index}.passportExpiry`, passportExpiry, { shouldValidate: true })
      }
    } else {
      form.setValue(`passengers.${index}.title`, "")
      form.setValue(`passengers.${index}.lastName`, "")
      form.setValue(`passengers.${index}.firstName`, "")
      form.setValue(`passengers.${index}.dob`, "")
      form.setValue(`passengers.${index}.nationality`, "Vietnam")
      form.setValue(`passengers.${index}.passportNumber`, "")
      form.setValue(`passengers.${index}.passportExpiry`, "")
    }
  }

  const steps = [
    { id: 1, name: "Chọn chỗ ngồi", status: "complete" as const },
    { id: 2, name: "Thông tin hành khách", status: "current" as const },
    { id: 3, name: "Thanh toán", status: "upcoming" as const },
  ]

  async function onSubmit(values: PassengerFormValues) {
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

    sessionStorage.setItem("draftPassengers", JSON.stringify(values.passengers))

    const params = new URLSearchParams({
      flightId,
      origin:        originCode,
      destination:   destCode,
      flightNumber,
      total:         finalTotal.toString(),
      service:       serviceTotal.toString(),
      passengers:    actualPassengerCount.toString(),
      seats:         seatsParam,
    })
    navigate(`/payment?${params.toString()}`)
  }

  const watchedPassengers = useWatch({
    control: form.control,
    name: "passengers",
  }) || []

  const calculateTotal = () => {
    let total = totalUrl

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

        {/* ── Countdown Timer Banner ── */}
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl mb-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
            <span>Ghế của bạn đang được giữ trong:</span>
            <span className="font-mono text-base font-bold text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded">
              {formatTimer(timeLeft)}
            </span>
          </div>
          <span className="text-xs text-amber-700 hidden sm:inline">
            Vui lòng hoàn tất thông tin và thanh toán trước khi hết giờ.
          </span>
        </div>
        
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Thông tin hành khách</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Đang đặt cho <strong>{actualPassengerCount}</strong> hành khách (Ghế: {seatNumbers.join(", ")})
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">
                {actualPassengerCount} Ghế đã chọn
              </span>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {fields.map((field, index) => (
                  <Card key={field.id} className="overflow-hidden border-none shadow-lg shadow-slate-200/50">
                    <CardHeader className="bg-slate-900 text-white py-4 px-6 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <CardTitle className="text-lg flex items-center gap-2">
                          <span>Hành khách {index + 1}</span>
                          {seatNumbers[index] && (
                            <span className="text-xs font-normal bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                              Ghế: {seatNumbers[index]}
                            </span>
                          )}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-8">
                      {/* Checkbox Same as Booker */}
                      {isAuthenticated ? (
                        <FormField
                          control={formControl}
                          name={`passengers.${index}.sameAsBooker`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 bg-primary/5 p-4 rounded-lg">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked)
                                    handleSameAsBookerChange(index, checked === true)
                                  }}
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
                      ) : (
                        <div className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center gap-2">
                          <span>💡</span>
                          <span>Hãy <a href="/login" className="text-primary hover:underline font-medium">đăng nhập</a> để sử dụng tính năng tự điền thông tin nhanh chóng.</span>
                        </div>
                      )}

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
                  <Button 
                    variant="ghost" 
                    type="button" 
                    onClick={async () => {
                      // Nhả ghế trên server trước khi quay lại
                      const heldSeats = sessionStorage.getItem("heldSeats")
                      if (flightId && heldSeats) {
                        try {
                          const parsed: string[] = JSON.parse(heldSeats)
                          if (parsed.length > 0) {
                            await flightService.releaseSeats(Number(flightId), parsed)
                          }
                        } catch {
                          // ignore — ghế sẽ tự hết hạn sau 10 phút trên Redis
                        }
                      }
                      sessionStorage.removeItem("seatHoldExpiresAt")
                      sessionStorage.removeItem("heldSeats")
                      navigate(-1)
                    }}
                    className="text-slate-600"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Quay lại chọn ghế
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
                  <span>{(totalUrl).toLocaleString()}₫</span>
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
