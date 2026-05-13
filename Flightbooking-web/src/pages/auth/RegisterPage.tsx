import { useState } from "react"
import { motion } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Plane, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react"
import { authService } from "../../services/auth.service"
import { useAuthStore } from "../../stores/useAuthStore"

const registerSchema = z.object({
  fullName: z.string().min(2, "Họ và tên quá ngắn"),
  email: z.string().email("Email không hợp lệ"),
  phoneNumber: z.string().min(10, "Số điện thoại không hợp lệ"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
  confirmPassword: z.string().min(6, "Mật khẩu ít nhất 6 ký tự"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
})

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true)
    setErrorMsg("")
    try {
      const data = await authService.register(values)
      setAuth(data.user, data.accessToken, data.refreshToken)
      navigate("/")
    } catch (error: any) {
      setErrorMsg(error.response?.data?.message || "Đăng ký thất bại. Vui lòng kiểm tra lại.")
    } finally {
      setIsLoading(false)
    }
  }

  function handleGoogleLogin() {
    authService.loginWithGoogle();
  }

  function getPasswordStrength(pwd: string): { label: string; color: string; bars: number; Icon: typeof ShieldCheck } {
    if (!pwd) return { label: "", color: "bg-muted", bars: 0, Icon: ShieldX }
    const hasUpper = /[A-Z]/.test(pwd)
    const hasLower = /[a-z]/.test(pwd)
    const hasDigit = /\d/.test(pwd)
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd)
    const len = pwd.length
    const score = (len >= 8 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasDigit ? 1 : 0) + (hasSpecial ? 1 : 0)
    if (score <= 2) return { label: "Yếu", color: "bg-red-500", bars: 1, Icon: ShieldX }
    if (score === 3) return { label: "Trung bình", color: "bg-yellow-500", bars: 2, Icon: ShieldAlert }
    if (score === 4) return { label: "Mạnh", color: "bg-emerald-500", bars: 3, Icon: ShieldCheck }
    return { label: "Rất mạnh", color: "bg-emerald-600", bars: 4, Icon: ShieldCheck }
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-5xl bg-background/60 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] overflow-hidden border border-white/20 dark:border-white/10 flex flex-col md:flex-row relative z-10"
      >
        <div className="relative hidden md:flex w-1/2 flex-col bg-gradient-to-br from-primary/80 to-primary p-12 text-white overflow-hidden order-last">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
          <div className="relative z-20 flex items-center text-2xl font-bold gap-3 tracking-tight">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <Plane className="h-6 w-6" />
            </div>
            SkyBooking
          </div>
          <div className="relative z-20 mt-auto">
            <motion.blockquote 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-6"
            >
              <p className="text-2xl font-medium leading-snug">
                "Trở thành hội viên để nhận được vô vàn ưu đãi và tích lũy dặm bay cho mỗi chuyến đi."
              </p>
              <footer className="text-sm text-white/80 font-medium">Chương trình khách hàng thân thiết</footer>
            </motion.blockquote>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-md flex flex-col justify-center space-y-6">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Tạo tài khoản mới
              </h1>
              <p className="text-sm text-muted-foreground">
                Nhập thông tin của bạn để đăng ký
              </p>
            </div>

            <div className="grid gap-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {errorMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg text-center font-medium">
                      {errorMsg}
                    </motion.div>
                  )}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Họ và tên</FormLabel>
                        <FormControl>
                          <Input className="bg-background/50 focus:bg-background transition-colors" placeholder="Nguyễn Văn A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input className="bg-background/50 focus:bg-background transition-colors" placeholder="name@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl>
                          <Input className="bg-background/50 focus:bg-background transition-colors" placeholder="0987654321" type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => {
                      // eslint-disable-next-line react-hooks/rules-of-hooks
                      const pwdValue = useWatch({ control: form.control, name: "password" })
                      const strength = getPasswordStrength(pwdValue)
                      return (
                        <FormItem>
                          <FormLabel>Mật khẩu</FormLabel>
                          <FormControl>
                            <Input className="bg-background/50 focus:bg-background transition-colors" placeholder="••••••••" type="password" {...field} />
                          </FormControl>
                          {pwdValue && (
                            <div className="space-y-1.5 pt-1">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4].map(bar => (
                                  <div
                                    key={bar}
                                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${bar <= strength.bars ? strength.color : "bg-muted"}`}
                                  />
                                ))}
                              </div>
                              <div className={`flex items-center gap-1 text-xs font-medium transition-colors ${strength.bars <= 1 ? "text-red-500" : strength.bars === 2 ? "text-yellow-500" : "text-emerald-500"}`}>
                                <strength.Icon className="w-3 h-3" />
                                {strength.label} — {strength.bars <= 1 ? "Thêm chữ hoa, số và ký tự đặc biệt" : strength.bars === 2 ? "Thêm ký tự đặc biệt để mạnh hơn" : "Mật khẩu tốt!"}
                              </div>
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Xác nhận mật khẩu</FormLabel>
                        <FormControl>
                          <Input className="bg-background/50 focus:bg-background transition-colors" placeholder="••••••••" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30" type="submit" disabled={isLoading}>
                    {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                  </Button>
                </form>
              </Form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-medium">
                  <span className="bg-background/60 backdrop-blur-xl px-4 text-muted-foreground rounded-full">
                    Hoặc đăng ký bằng
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button onClick={handleGoogleLogin} variant="outline" type="button" disabled={isLoading} className="gap-2 h-11 bg-background/50 hover:bg-background transition-colors">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" type="button" disabled={isLoading} className="gap-2 h-11 text-[#1877F2] hover:text-[#1877F2] border-[#1877F2]/20 hover:bg-[#1877F2]/10 bg-background/50 transition-colors">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </Button>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline underline-offset-4 transition-all">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
